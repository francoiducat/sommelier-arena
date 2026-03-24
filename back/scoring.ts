import type { Question, Participant } from './types';

/**
 * Determine whether an answer option is correct and how many points it earns.
 */
export function scoreAnswer(question: Question, optionId: string): { correct: boolean; points: number } {
  const option = question.options.find((o) => o.id === optionId);
  const correct = option?.correct ?? false;
  return { correct, points: correct ? 100 : 0 };
}

/**
 * Build a sorted rankings array from the participants map.
 */
export function buildRankings(participants: Map<string, Participant>): { pseudonym: string; score: number }[] {
  return Array.from(participants.values())
    .map((p) => ({ pseudonym: p.pseudonym, score: p.score }))
    .sort((a, b) => b.score - a.score);
}
