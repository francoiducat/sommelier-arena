import type * as Party from 'partykit/server';
import { v4 as uuidv4 } from 'uuid';
import type { SessionPhase, QuestionCategory, AnswerOption, Question, Wine, Participant, ParticipantAnswer, SessionListEntry, SavedState } from './types';
export type { SessionPhase, QuestionCategory, AnswerOption, Question, Wine, Participant, ParticipantAnswer, SessionListEntry, SavedState };
import { MAX_PLAYERS, CATEGORY_PROMPTS } from './constants';
import { shuffle, generatePseudonym, generateHostId } from './utils';
import { scoreAnswer, buildRankings } from './scoring';
import { TimerManager } from './timer';

// ─── GameSession Durable Object ───────────────────────────────────────────────

export default class GameSession implements Party.Server {
  // ── In-memory state (restored from disk in onStart) ──────────────────────
  wines: Wine[] = [];
  phase: SessionPhase = 'waiting';
  timerSeconds = 60;
  currentRound = 0;
  currentQuestion = 0;
  hostId: string | null = null;
  sessionTitle = '';
  createdAt = '';
  hostConnectionId: string | null = null;
  private readonly timer = new TimerManager();

  // Keyed by rejoinToken
  participants = new Map<string, Participant>();
  // Keyed by `${participantId}:${questionId}`
  inFlightAnswers = new Map<string, string>();

  constructor(readonly room: Party.Room) {}

  // ── Restore persisted state when DO wakes ────────────────────────────────

  async onStart() {
    const state = await this.room.storage.get<SavedState>('state');
    if (state) {
      this.wines = state.wines;
      this.phase = state.phase;
      this.timerSeconds = state.timerSeconds;
      this.currentRound = state.currentRound;
      this.currentQuestion = state.currentQuestion;
      this.hostId = state.hostId;
      this.sessionTitle = state.sessionTitle;
      this.createdAt = state.createdAt;
    }

    // Restore participants from disk
    const allKeys = await this.room.storage.list<Participant>();
    for (const [key, value] of allKeys) {
      if (key.startsWith('participant:')) {
        const rejoinToken = key.slice('participant:'.length);
        this.participants.set(rejoinToken, {
          ...value,
          socketId: '', // will be re-assigned on reconnect
          connected: false,
          answeredQuestions: new Set(Array.isArray((value as any).answeredQuestions)
            ? (value as any).answeredQuestions
            : []),
        });
      }
    }
  }

  // ── New connection ────────────────────────────────────────────────────────

  onConnect(conn: Party.Connection) {
    // Send current state snapshot to new connection so they can decide next step
    conn.send(JSON.stringify({
      type: 'server:state_snapshot',
      phase: this.phase,
      code: this.room.id,
    }));
  }

  // ── Message dispatcher ────────────────────────────────────────────────────

  async onMessage(message: string, sender: Party.Connection) {
    let event: { type: string; [key: string]: unknown };
    try {
      event = JSON.parse(message);
    } catch {
      return;
    }

    switch (event.type) {
      case 'create_session':
        await this.handleCreateSession(event, sender);
        break;
      case 'rejoin_host':
        await this.handleRejoinHost(event, sender);
        break;
      case 'join_session':
        await this.handleJoinSession(event, sender);
        break;
      case 'rejoin_session':
        await this.handleRejoinSession(event, sender);
        break;
      case 'host:start':
        await this.handleHostStart(sender);
        break;
      case 'host:pause':
        this.handleHostPause(sender);
        break;
      case 'host:resume':
        await this.handleHostResume(sender);
        break;
      case 'host:reveal':
        await this.handleHostReveal(sender);
        break;
      case 'host:next':
        await this.handleHostNext(sender);
        break;
      case 'host:end':
        await this.handleHostEnd(sender);
        break;
      case 'submit_answer':
        this.handleSubmitAnswer(event, sender);
        break;
    }
  }

  // ── Connection closed ─────────────────────────────────────────────────────

  onClose(conn: Party.Connection) {
    if (conn.id === this.hostConnectionId) {
      this.hostConnectionId = null;
      // Host disconnected — if game was active, end it gracefully so
      // participants receive final scores before the session:ended message.
      if (this.phase !== 'waiting' && this.phase !== 'ended') {
        this.timer.clear();
        void this.endGame();
      }
      return;
    }

    // Participant disconnected — mark as disconnected, freeze score
    for (const [, participant] of this.participants) {
      if (participant.socketId === conn.id) {
        participant.connected = false;
        // Notify lobby if still in waiting phase
        if (this.phase === 'waiting') {
          this.broadcast('lobby:updated', {
            participants: this.getLobbyParticipants(),
            count: this.participants.size,
          });
        }
        break;
      }
    }
  }

  // ── Alarm: authoritative timer expiry ────────────────────────────────────

  async alarm() {
    await this.handleTimerExpiry();
  }

  // ─── Event handlers ───────────────────────────────────────────────────────

  private async handleCreateSession(
    event: Record<string, unknown>,
    sender: Party.Connection,
  ) {
    if (this.wines.length > 0) {
      // Session already exists — re-attach if same hostId
      const existingHostId = await this.room.storage.get<string>('hostId');
      if (existingHostId && existingHostId === event.hostId) {
        this.hostConnectionId = sender.id;
        sender.send(JSON.stringify({
          type: 'session:created',
          code: this.room.id,
          hostId: existingHostId,
        }));
      } else {
        sender.send(JSON.stringify({
          type: 'error',
          message: 'Session code already in use',
          code: 'CODE_TAKEN',
        }));
      }
      return;
    }

    const wines = event.wines as Array<{
      name: string;
      questions: Array<{
        category: QuestionCategory;
        correctAnswer: string;
        distractors: [string, string, string];
      }>;
    }>;

    const timerSeconds = typeof event.timerSeconds === 'number'
      ? Math.max(15, Math.min(120, event.timerSeconds))
      : 60;

    const hostId = (event.hostId as string) || generateHostId();
    const title = (event.title as string) || wines[0]?.name || 'Wine Night';

    this.wines = wines.map((wineDto) => ({
      id: uuidv4(),
      name: wineDto.name,
      questions: wineDto.questions.map((qDto) => {
        const options: AnswerOption[] = shuffle([
          { id: uuidv4(), text: qDto.correctAnswer, correct: true },
          ...qDto.distractors.map((text) => ({
            id: uuidv4(),
            text,
            correct: false,
          })),
        ]);
        return {
          id: uuidv4(),
          category: qDto.category,
          prompt: CATEGORY_PROMPTS[qDto.category],
          options,
        };
      }),
    }));

    this.timerSeconds = timerSeconds;
    this.hostId = hostId;
    this.sessionTitle = title;
    this.createdAt = new Date().toISOString();
    this.hostConnectionId = sender.id;

    await this.saveState();
    await this.room.storage.put('hostId', hostId);

    // Update KV session index
    await this.upsertKvSession({ status: 'waiting' });

    sender.send(JSON.stringify({
      type: 'session:created',
      code: this.room.id,
      hostId,
    }));
  }

  private async handleRejoinHost(
    event: Record<string, unknown>,
    sender: Party.Connection,
  ) {
    const storedHostId = await this.room.storage.get<string>('hostId');
    if (!storedHostId || storedHostId !== event.hostId) {
      sender.send(JSON.stringify({
        type: 'error',
        message: 'Invalid host ID',
        code: 'INVALID_HOST_ID',
      }));
      return;
    }

    this.hostConnectionId = sender.id;
    sender.send(JSON.stringify({
      type: 'host:state_snapshot',
      phase: this.phase,
      code: this.room.id,
      hostId: storedHostId,
      wines: this.wines,
      participants: this.getLobbyParticipants(),
      timerSeconds: this.timerSeconds,
      currentRound: this.currentRound,
      currentQuestion: this.currentQuestion,
      question: this.phase === 'question_open' || this.phase === 'question_paused' || this.phase === 'question_revealed'
        ? this.buildQuestionPayload()
        : null,
      rankings: buildRankings(this.participants),
    }));
  }

  private async handleJoinSession(
    event: Record<string, unknown>,
    sender: Party.Connection,
  ) {
    if (this.phase !== 'waiting') {
      sender.send(JSON.stringify({
        type: 'error',
        message: 'Game already started',
        code: 'GAME_STARTED',
      }));
      return;
    }
    if (this.participants.size >= MAX_PLAYERS) {
      sender.send(JSON.stringify({
        type: 'error',
        message: 'Session is full',
        code: 'SESSION_FULL',
      }));
      return;
    }

    const usedPseudonyms = new Set(
      Array.from(this.participants.values()).map((p) => p.pseudonym),
    );
    const pseudonym = generatePseudonym(usedPseudonyms);
    const rejoinToken = uuidv4();

    const participant: Participant = {
      id: uuidv4(),
      socketId: sender.id,
      pseudonym,
      score: 0,
      connected: true,
      answeredQuestions: new Set(),
    };

    this.participants.set(rejoinToken, participant);

    // Persist to DO storage
    await this.room.storage.put(`participant:${rejoinToken}`, {
      id: participant.id,
      pseudonym: participant.pseudonym,
      score: participant.score,
      connected: participant.connected,
      answeredQuestions: [],
    });

    sender.send(JSON.stringify({
      type: 'participant:joined',
      pseudonym,
      rejoinToken,
    }));

    this.broadcast('lobby:updated', {
      participants: this.getLobbyParticipants(),
      count: this.participants.size,
    });
  }

  private async handleRejoinSession(
    event: Record<string, unknown>,
    sender: Party.Connection,
  ) {
    const rejoinToken = event.rejoinToken as string;
    const participant = this.participants.get(rejoinToken);

    if (!participant) {
      sender.send(JSON.stringify({
        type: 'error',
        message: 'Invalid rejoin token',
        code: 'INVALID_TOKEN',
      }));
      return;
    }

    participant.socketId = sender.id;
    participant.connected = true;

    sender.send(JSON.stringify({
      type: 'participant:state_snapshot',
      pseudonym: participant.pseudonym,
      score: participant.score,
      phase: this.phase,
      question: this.phase === 'question_open' || this.phase === 'question_paused'
        ? this.buildQuestionPayload()
        : null,
    }));

    if (this.phase === 'waiting') {
      this.broadcast('lobby:updated', {
        participants: this.getLobbyParticipants(),
        count: this.participants.size,
      });
    }
  }

  private async handleHostStart(sender: Party.Connection) {
    if (sender.id !== this.hostConnectionId) return;
    if (this.phase !== 'waiting') return;
    if (this.participants.size === 0) {
      sender.send(JSON.stringify({
        type: 'error',
        message: 'No participants in lobby',
        code: 'NO_PARTICIPANTS',
      }));
      return;
    }

    this.phase = 'question_open';
    this.currentRound = 0;
    this.currentQuestion = 0;
    await this.saveState();
    await this.upsertKvSession({ status: 'active' });

    this.broadcast('game:started', {});
    await this.broadcastQuestion();
  }

  private handleHostPause(sender: Party.Connection) {
    if (sender.id !== this.hostConnectionId) return;
    if (this.phase !== 'question_open') return;

    this.timer.pause();
    this.phase = 'question_paused';

    this.room.broadcast(JSON.stringify({
      type: 'game:timer_paused',
      remainingMs: this.timer.remainingMs,
    }));
  }

  private async handleHostResume(sender: Party.Connection) {
    if (sender.id !== this.hostConnectionId) return;
    if (this.phase !== 'question_paused') return;

    this.phase = 'question_open';
    const remaining = this.timer.remainingMs;
    const onTick = (ms: number) => {
      this.room.broadcast(JSON.stringify({ type: 'game:timer_tick', remainingMs: ms }));
    };
    this.timer.resume(remaining, onTick, () => {});
    await this.room.storage.setAlarm(Date.now() + remaining);

    this.room.broadcast(JSON.stringify({
      type: 'game:timer_resumed',
      remainingMs: remaining,
    }));
  }

  private async handleHostReveal(sender: Party.Connection) {
    if (sender.id !== this.hostConnectionId) return;
    if (this.phase !== 'question_open' && this.phase !== 'question_paused') return;

    this.timer.clear();
    this.phase = 'question_revealed';

    const question = this.wines[this.currentRound].questions[this.currentQuestion];
    const correctOption = question.options.find((o) => o.correct)!;

    // Score and persist final answers
    const hostResults: { pseudonym: string; points: number; totalScore: number }[] = [];
    for (const [, participant] of this.participants) {
      const inFlightKey = `${participant.id}:${question.id}`;
      const answeredOptionId = this.inFlightAnswers.get(inFlightKey) ?? null;
      const { correct: isCorrect, points } = answeredOptionId !== null
        ? scoreAnswer(question, answeredOptionId)
        : { correct: false, points: 0 };
      participant.score += points;

      // Persist final answer to disk
      await this.room.storage.put(`response:${participant.id}:${question.id}`, {
        optionId: answeredOptionId,
        correct: isCorrect,
        points,
      });

      hostResults.push({
        pseudonym: participant.pseudonym,
        points,
        totalScore: participant.score,
      });

      // Send per-participant result
      const conn = this.room.getConnection(participant.socketId);
      if (conn) {
        conn.send(JSON.stringify({
          type: 'game:answer_revealed',
          correctOptionId: correctOption.id,
          myPoints: points,
          myTotalScore: participant.score,
        }));
      }
    }

    await this.saveState();

    // Send host result
    const hostConn = this.hostConnectionId
      ? this.room.getConnection(this.hostConnectionId)
      : null;
    hostConn?.send(JSON.stringify({
      type: 'game:answer_revealed',
      correctOptionId: correctOption.id,
      results: hostResults,
    }));
  }

  private async handleHostNext(sender: Party.Connection) {
    if (sender.id !== this.hostConnectionId) return;
    if (this.phase !== 'question_revealed' && this.phase !== 'round_leaderboard') return;

    const wine = this.wines[this.currentRound];
    const isLastQuestion = this.currentQuestion >= wine.questions.length - 1;
    const isLastWine = this.currentRound >= this.wines.length - 1;

    if (this.phase === 'round_leaderboard') {
      if (isLastWine) {
        await this.endGame();
      } else {
        this.currentRound++;
        this.currentQuestion = 0;
        this.phase = 'question_open';
        await this.saveState();
        await this.broadcastQuestion();
      }
      return;
    }

    // From question_revealed
    if (isLastQuestion) {
      this.phase = 'round_leaderboard';
      await this.saveState();
      this.broadcast('game:round_leaderboard', {
        rankings: buildRankings(this.participants),
        roundIndex: this.currentRound,
        totalRounds: this.wines.length,
      });
    } else {
      this.currentQuestion++;
      this.phase = 'question_open';
      await this.saveState();
      await this.broadcastQuestion();
    }
  }

  private async handleHostEnd(sender: Party.Connection) {
    if (sender.id !== this.hostConnectionId) return;
    await this.endGame();
  }

  private handleSubmitAnswer(
    event: Record<string, unknown>,
    sender: Party.Connection,
  ) {
    const { questionId, optionId } = event as { questionId: string; optionId: string };
    if (this.phase !== 'question_open' && this.phase !== 'question_paused') return;

    // Find participant by socketId
    let participant: Participant | null = null;
    for (const [, p] of this.participants) {
      if (p.socketId === sender.id) {
        participant = p;
        break;
      }
    }
    if (!participant) return;

    const inFlightKey = `${participant.id}:${questionId}`;
    const isFirstAnswer = !this.inFlightAnswers.has(inFlightKey);

    // Overwrite (no lock)
    this.inFlightAnswers.set(inFlightKey, optionId);

    // answeredCount increments only on first answer
    const answeredCount = isFirstAnswer
      ? (participant.answeredQuestions.add(questionId), Array.from(this.participants.values()).filter(
          (p) => p.answeredQuestions.has(questionId),
        ).length)
      : Array.from(this.participants.values()).filter(
          (p) => p.answeredQuestions.has(questionId),
        ).length;

    const hostConn = this.hostConnectionId
      ? this.room.getConnection(this.hostConnectionId)
      : null;
    hostConn?.send(JSON.stringify({
      type: 'game:participant_answered',
      pseudonym: participant.pseudonym,
      answeredCount,
      totalCount: this.participants.size,
    }));
  }

  // ─── Timer helpers ────────────────────────────────────────────────────────

  private async startTimer() {
    const onTick = (ms: number) => {
      this.room.broadcast(JSON.stringify({ type: 'game:timer_tick', remainingMs: ms }));
    };
    this.timer.start(this.timerSeconds, onTick, () => {});

    // Disk layer: authoritative alarm (survives DO eviction)
    await this.room.storage.setAlarm(Date.now() + this.timer.remainingMs);
  }

  private async handleTimerExpiry() {
    if (this.phase !== 'question_open') return;
    // Treat as host clicking reveal
    this.timer.clear();
    this.phase = 'question_revealed';

    const question = this.wines[this.currentRound].questions[this.currentQuestion];
    const correctOption = question.options.find((o) => o.correct)!;

    const hostResults: { pseudonym: string; points: number; totalScore: number }[] = [];
    for (const [, participant] of this.participants) {
      const inFlightKey = `${participant.id}:${question.id}`;
      const answeredOptionId = this.inFlightAnswers.get(inFlightKey) ?? null;
      const { correct: isCorrect, points } = answeredOptionId !== null
        ? scoreAnswer(question, answeredOptionId)
        : { correct: false, points: 0 };
      participant.score += points;

      await this.room.storage.put(`response:${participant.id}:${question.id}`, {
        optionId: answeredOptionId,
        correct: isCorrect,
        points,
      });

      hostResults.push({ pseudonym: participant.pseudonym, points, totalScore: participant.score });

      const conn = this.room.getConnection(participant.socketId);
      conn?.send(JSON.stringify({
        type: 'game:answer_revealed',
        correctOptionId: correctOption.id,
        myPoints: points,
        myTotalScore: participant.score,
      }));
    }

    await this.saveState();

    const hostConn = this.hostConnectionId ? this.room.getConnection(this.hostConnectionId) : null;
    hostConn?.send(JSON.stringify({
      type: 'game:answer_revealed',
      correctOptionId: correctOption.id,
      results: hostResults,
    }));
  }

  // ─── Broadcast helpers ────────────────────────────────────────────────────

  private async broadcastQuestion() {
    const payload = this.buildQuestionPayload();
    this.room.broadcast(JSON.stringify({ type: 'game:question', ...payload }));
    await this.startTimer();
  }

  private buildQuestionPayload() {
    const wine = this.wines[this.currentRound];
    const question = wine.questions[this.currentQuestion];
    return {
      questionId: question.id,
      questionIndex: this.currentQuestion,
      totalQuestions: wine.questions.length,
      roundIndex: this.currentRound,
      totalRounds: this.wines.length,
      category: question.category,
      prompt: question.prompt,
      options: question.options.map((o) => ({ id: o.id, text: o.text })),
      timerMs: this.timerSeconds * 1000,
    };
  }

  broadcast(type: string, data: object, exclude?: string[]) {
    this.room.broadcast(JSON.stringify({ type, ...data }), exclude);
  }

  // ─── End game ─────────────────────────────────────────────────────────────

  private async endGame() {
    this.timer.clear();
    this.phase = 'ended';
    const rankings = buildRankings(this.participants);

    await this.saveState();
    await this.upsertKvSession({
      status: 'ended',
      finalRankings: rankings,
    });

    this.broadcast('game:final_leaderboard', { rankings });
    this.broadcast('session:ended', {});
  }

  // ─── Persistence helpers ──────────────────────────────────────────────────

  private async saveState() {
    await this.room.storage.put<SavedState>('state', {
      wines: this.wines,
      phase: this.phase,
      timerSeconds: this.timerSeconds,
      currentRound: this.currentRound,
      currentQuestion: this.currentQuestion,
      hostId: this.hostId ?? '',
      sessionTitle: this.sessionTitle,
      createdAt: this.createdAt,
    });
  }

  private async upsertKvSession(update: {
    status?: 'waiting' | 'active' | 'ended';
    finalRankings?: { pseudonym: string; score: number }[];
  }) {
    if (!this.hostId) return;
    const kvKey = `host:${this.hostId}`;
    try {
      const hostsKv = (this.room.context.bindings as unknown as {
        HOSTS_KV: { get(k: string, t: 'json'): Promise<unknown>; put(k: string, v: string): Promise<void> };
      }).HOSTS_KV;

      const existing = (await hostsKv.get(kvKey, 'json') as SessionListEntry[] | null) ?? [];

      const sessionEntry: SessionListEntry = {
        code: this.room.id,
        title: this.sessionTitle,
        createdAt: this.createdAt,
        status: update.status ?? 'waiting',
        participantCount: this.participants.size,
        ...(update.finalRankings ? { finalRankings: update.finalRankings } : {}),
      };

      const idx = existing.findIndex((s) => s.code === this.room.id);
      if (idx >= 0) {
        existing[idx] = sessionEntry;
      } else {
        existing.push(sessionEntry);
      }

      await hostsKv.put(kvKey, JSON.stringify(existing));
    } catch {
      // KV not available in local dev without binding — fail silently
    }
  }

  // ─── Misc helpers ─────────────────────────────────────────────────────────

  private getLobbyParticipants(): string[] {
    // Show ALL joined participants, not just those currently connected.
    // During reconnect cycles a participant's socket briefly closes, marking
    // connected=false. Filtering by connected would make them disappear from
    // the host's lobby view until they reconnect — confusing to the host.
    return Array.from(this.participants.values())
      .map((p) => p.pseudonym);
  }

}
