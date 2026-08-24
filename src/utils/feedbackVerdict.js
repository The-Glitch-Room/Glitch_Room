// utils/feedbackVerdict.js
//
// Shared scoring presentation logic used by every "Fix*" challenge page
// (FixBug, FixAIChallenge, FixCreativeSpark, FixGlitch) and by
// ArenaChallenge. Keeping this in one place means the verdict wording
// and the points formula can't drift out of sync between challenge types.

export const PASS_THRESHOLD = 6;

/**
 * Turns a 0-10 AI score into a verdict label + pass/fail flag.
 * Score buckets:
 *   9-10 -> "Nailed it 🎯"
 *   7-8  -> "Correct enough — nice work"
 *   6    -> "Just cleared the bar"
 *   <6   -> "Not quite there yet"
 */
export const getVerdict = (score) => {
  const s = typeof score === "number" ? score : 0;

  if (s < PASS_THRESHOLD) {
    return { label: "Not quite there yet", passed: false };
  }
  if (s >= 9) {
    return { label: "Nailed it 🎯", passed: true };
  }
  if (s >= 7) {
    return { label: "Correct enough — nice work", passed: true };
  }
  // s === 6 (exactly at the pass line)
  return { label: "Just cleared the bar", passed: true };
};

/**
 * Converts a raw AI score (0-10) into an actual points/gBits award,
 * scaled against maxPoints. Anything below PASS_THRESHOLD earns 0 —
 * there's no partial credit for a failing score.
 *
 * e.g. pointsForScore(8, 10) -> 8
 *      pointsForScore(6, 25) -> 15
 *      pointsForScore(5, 25) -> 0   (below threshold)
 */
export const pointsForScore = (score, maxPoints) => {
  const s = typeof score === "number" ? score : 0;
  if (s < PASS_THRESHOLD) return 0;
  return Math.round((s / 10) * maxPoints);
};
