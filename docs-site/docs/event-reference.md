---
id: event-reference
title: Event Reference
sidebar_label: Event Reference
---

# Event Reference

All WebSocket messages are JSON objects with a `type` field. The transport is PartySocket (native WebSocket under the hood).

## Client → Server

### `create_session`

Sent by host to create a new session.

```ts
{
  type: 'create_session';
  title: string;
  hostId: string;           // e.g. 'TANNIC-FALCON'
  timerSeconds: number;     // 15–120
  wines: Array<{
    name: string;
    questions: Array<{
      category: 'color' | 'country' | 'grape_variety' | 'vintage_year' | 'wine_name';
      correctAnswer: string;
      distractors: [string, string, string];
    }>;
  }>;
}
```

### `join_session`

Sent by participant to join a waiting session.

```ts
{ type: 'join_session'; code: string }
```

### `rejoin_host`

Sent by host on socket open to re-authenticate (after page refresh or reconnect).

```ts
{ type: 'rejoin_host'; hostId: string }
```

### `rejoin_session`

Sent by participant on socket open when a `rejoinToken` is in localStorage.

```ts
{ type: 'rejoin_session'; rejoinToken: string }
```

### `host:start` / `host:pause` / `host:resume` / `host:reveal` / `host:next` / `host:end`

Host control events — no additional payload.

```ts
{ type: 'host:start' }
{ type: 'host:pause' }
{ type: 'host:resume' }
{ type: 'host:reveal' }
{ type: 'host:next' }
{ type: 'host:end' }
```

### `submit_answer`

Sent by participant to select or change an answer.

```ts
{ type: 'submit_answer'; questionId: string; optionId: string }
```

---

## Server → Client

### `session:created`

Sent to host after successful `create_session`.

```ts
{ type: 'session:created'; code: string; hostId: string }
```

### `participant:joined`

Sent to the joining participant.

```ts
{ type: 'participant:joined'; pseudonym: string; rejoinToken: string }
```

### `lobby:updated`

Broadcast to all connected clients when a participant joins or leaves the lobby.

```ts
{ type: 'lobby:updated'; participants: string[] }
```

### `host:state_snapshot`

Sent to host on `rejoin_host` (full current state).

```ts
{
  type: 'host:state_snapshot';
  code: string;
  hostId: string;
  phase: SessionPhase;
  participants: string[];
  question: QuestionPayload | null;
  rankings: RankingEntry[];
}
```

### `participant:state_snapshot`

Sent to participant on `rejoin_session`.

```ts
{
  type: 'participant:state_snapshot';
  pseudonym: string;
  phase: SessionPhase;
  question: QuestionPayload | null;
}
```

### `sessions:list`

Sent to host listing their past and active sessions (sourced from KV).

```ts
{
  type: 'sessions:list';
  sessions: Array<{
    code: string;
    title: string;
    createdAt: string;
    status: 'waiting' | 'active' | 'ended';
    participantCount: number;
    finalRankings?: RankingEntry[];
  }>;
}
```

### `game:question`

Broadcast when a new question starts.

```ts
{
  type: 'game:question';
  questionId: string;
  prompt: string;
  category: QuestionCategory;
  options: Array<{ id: string; text: string }>;   // shuffled; no 'correct' flag
  roundIndex: number;
  questionIndex: number;
  totalQuestions: number;
  totalRounds: number;
  timerMs: number;
}
```

### `game:timer_tick`

Emitted every second during `question_open` and `question_paused`.

```ts
{ type: 'game:timer_tick'; remainingMs: number }
```

### `game:timer_paused` / `game:timer_resumed`

```ts
{ type: 'game:timer_paused'; remainingMs: number }
{ type: 'game:timer_resumed'; remainingMs: number }
```

### `game:participant_answered` (host only)

```ts
{ type: 'game:participant_answered'; answeredCount: number; totalCount: number }
```

### `game:answer_revealed`

Sent to host:

```ts
{
  type: 'game:answer_revealed';
  correctOptionId: string;
  results: Array<{ pseudonym: string; points: number; totalScore: number }>;
}
```

Sent to each participant:

```ts
{
  type: 'game:answer_revealed';
  correctOptionId: string;
  myPoints: number;
  myTotalScore: number;
}
```

### `game:round_leaderboard`

```ts
{
  type: 'game:round_leaderboard';
  rankings: RankingEntry[];
  roundIndex: number;
}
```

### `game:final_leaderboard`

```ts
{ type: 'game:final_leaderboard'; rankings: RankingEntry[] }
```

### `session:ended`

```ts
{ type: 'session:ended' }
```

### `error`

```ts
{ type: 'error'; message: string }
```

---

## Types

```ts
type QuestionCategory = 'color' | 'country' | 'grape_variety' | 'vintage_year' | 'wine_name';
type SessionPhase = 'waiting' | 'question_open' | 'question_paused' | 'question_revealed' | 'round_leaderboard' | 'ended';

interface RankingEntry {
  pseudonym: string;
  score: number;
  rank: number;
}
```
