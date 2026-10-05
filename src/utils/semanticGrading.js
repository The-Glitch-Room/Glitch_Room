import { supabase } from "../supabaseClient";

/**
 * Stop words for token filtering in offline fallback.
 */
const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "in", "on", "at", "to", "for", "from", "by", "with", "about", "into",
  "through", "during", "before", "after", "above", "below", "to", "from",
  "up", "down", "in", "out", "on", "off", "over", "under", "again",
  "further", "then", "once", "here", "there", "when", "where", "why",
  "how", "all", "any", "both", "each", "few", "more", "most", "other",
  "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than",
  "too", "very", "can", "will", "just", "don", "should", "now", "it",
  "its", "that", "this", "these", "those", "and", "but", "if", "or", "because",
  "as", "until", "while", "of"
]);

/**
 * Tokenize and normalize text for semantic comparison.
 */
function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

/**
 * Check if two words are conceptually related via prefix / stemming match.
 */
function isWordMatch(w1, w2) {
  if (w1 === w2) return true;
  // Prefix stemming for words of length >= 4 (e.g. handle / handling, crash / crashing)
  if (w1.length >= 4 && w2.length >= 4) {
    const prefixLen = Math.min(4, Math.min(w1.length, w2.length));
    if (w1.slice(0, prefixLen) === w2.slice(0, prefixLen)) {
      return true;
    }
  }
  return false;
}

/**
 * Offline semantic similarity calculation (concept overlap ratio).
 * Returns a ratio between 0.0 and 1.0.
 */
export function calculateSemanticOverlap(expectedAnswer, candidateAnswer) {
  const expTokens = tokenize(expectedAnswer);
  const candTokens = tokenize(candidateAnswer);

  if (expTokens.length === 0 || candTokens.length === 0) return 0;

  let matchCount = 0;
  for (const exp of expTokens) {
    if (candTokens.some((cand) => isWordMatch(exp, cand))) {
      matchCount++;
    }
  }

  return matchCount / expTokens.length;
}

/**
 * Fallback semantic grading function when AI services are unavailable.
 */
export function fallbackEvaluateShortAnswer({
  expectedAnswer,
  candidateAnswer,
  maxPoints = 5,
}) {
  const trimmedCand = String(candidateAnswer || "").trim();
  const trimmedExp = String(expectedAnswer || "").trim();

  if (!trimmedCand) {
    return { pointsEarned: 0, isCorrect: false, score: 0, method: "fallback-empty" };
  }
  if (!trimmedExp) {
    return { pointsEarned: maxPoints, isCorrect: true, score: 10, method: "fallback-no-key" };
  }
  if (trimmedCand.toLowerCase() === trimmedExp.toLowerCase()) {
    return { pointsEarned: maxPoints, isCorrect: true, score: 10, method: "exact" };
  }

  const ratio = calculateSemanticOverlap(trimmedExp, trimmedCand);

  // Full credit if >= 55% core concept overlap
  if (ratio >= 0.55) {
    return {
      pointsEarned: maxPoints,
      isCorrect: true,
      score: 10,
      method: "fallback-semantic-full",
    };
  }

  // Partial credit if between 25% and 55%
  if (ratio >= 0.25) {
    const partial = Math.max(1, Math.min(maxPoints - 1, Math.round(ratio * maxPoints)));
    return {
      pointsEarned: partial,
      isCorrect: partial === maxPoints,
      score: Math.round(ratio * 10),
      method: "fallback-semantic-partial",
    };
  }

  // Incorrect if < 25%
  return {
    pointsEarned: 0,
    isCorrect: false,
    score: Math.round(ratio * 10),
    method: "fallback-semantic-fail",
  };
}

/**
 * Evaluates an open-ended Short Answer question using Semantic AI grading.
 * Compares candidate's answer with expected answer based on meaning, correctness, and key concepts.
 *
 * Scoring logic:
 * - Score 8-10 (Full credit): Same meaning and core concepts even with different phrasing/synonyms.
 * - Score 4-7 (Partial credit): Captures some key concepts but partially incomplete.
 * - Score 0-3 (Incorrect): Core concept is wrong, contradictory, irrelevant, or missing.
 *
 * @param {Object} params
 * @param {string} params.questionText
 * @param {string} params.expectedAnswer
 * @param {string} params.candidateAnswer
 * @param {number} params.maxPoints
 * @returns {Promise<{ pointsEarned: number, isCorrect: boolean, score: number, feedback?: string }>}
 */
export async function evaluateShortAnswer({
  questionText = "",
  expectedAnswer = "",
  candidateAnswer = "",
  maxPoints = 5,
}) {
  const cand = String(candidateAnswer || "").trim();
  const exp = String(expectedAnswer || "").trim();
  const pts = Number(maxPoints) || 5;

  if (!cand) {
    return { pointsEarned: 0, isCorrect: false, score: 0 };
  }

  if (!exp) {
    return { pointsEarned: pts, isCorrect: true, score: 10 };
  }

  // Immediate case/whitespace-insensitive match
  if (cand.toLowerCase() === exp.toLowerCase()) {
    return { pointsEarned: pts, isCorrect: true, score: 10 };
  }

  try {
    const scenario =
      "You are an expert AI evaluator grading an open-ended Short Answer question in a technical assessment.\n\n" +
      `Assessment Question:\n${questionText}\n\n` +
      `Host's Expected Reference Answer:\n${exp}\n\n` +
      `Participant's Submitted Answer:\n${cand}\n\n` +
      "Evaluation Instructions:\n" +
      "- Compare the participant's answer with the host's expected answer based on meaning, correctness, and key concepts — NOT exact wording.\n" +
      "- Different wording, synonyms, and paraphrasing that convey the correct meaning and core concept MUST receive full credit (score 9-10).\n" +
      "- If the answer is partially correct (captures some key concepts but misses secondary details or is incomplete), award partial credit (score 4-8 proportional to correctness).\n" +
      "- If the answer is conceptually wrong, contradictory, irrelevant, or fails to address the question, score 0-3.\n" +
      "- Return a score from 0 to 10.";

    const { data, error } = await supabase.functions.invoke(
      "ai-feedback-edge-function",
      {
        body: { scenario, answer: cand },
      }
    );

    if (error) throw error;

    let parsed = typeof data === "string" ? JSON.parse(data) : data;
    if (parsed?.body && typeof parsed.body === "object") parsed = parsed.body;
    if (parsed?.result && typeof parsed.result === "object") parsed = parsed.result;

    const rawScore =
      typeof parsed?.score === "number"
        ? parsed.score
        : typeof parsed?.rating === "number"
        ? parsed.rating
        : typeof parsed?.points === "number"
        ? parsed.points
        : parseInt(parsed?.score, 10);

    if (typeof rawScore !== "number" || isNaN(rawScore)) {
      throw new Error("Invalid score returned by AI evaluator");
    }

    let pointsEarned = 0;
    let isCorrect = false;

    if (rawScore >= 8) {
      // Full credit
      pointsEarned = pts;
      isCorrect = true;
    } else if (rawScore >= 4) {
      // Partial credit (scaled proportionally between 1 and maxPoints - 1)
      pointsEarned = Math.max(1, Math.min(pts - 1, Math.round((rawScore / 10) * pts)));
      isCorrect = pointsEarned === pts;
    } else {
      // Incorrect
      pointsEarned = 0;
      isCorrect = false;
    }

    return {
      pointsEarned,
      isCorrect,
      score: rawScore,
      strength: parsed?.strength || "",
      gap: parsed?.gap || "",
    };
  } catch (err) {
    console.warn("[Semantic AI Grading] Edge function call failed or timed out, falling back to local semantic evaluation:", err.message);
    return fallbackEvaluateShortAnswer({
      expectedAnswer: exp,
      candidateAnswer: cand,
      maxPoints: pts,
    });
  }
}

/**
 * Batch evaluates multiple short answer questions concurrently.
 * @param {Array<{ id: string, questionText: string, expectedAnswer: string, candidateAnswer: string, maxPoints: number }>} items
 * @returns {Promise<Record<string, { pointsEarned: number, isCorrect: boolean, score: number }>>}
 */
export async function evaluateBatchShortAnswers(items = []) {
  const results = {};
  if (!Array.isArray(items) || items.length === 0) return results;

  const promises = items.map(async (item) => {
    try {
      const evaluation = await evaluateShortAnswer({
        questionText: item.questionText,
        expectedAnswer: item.expectedAnswer,
        candidateAnswer: item.candidateAnswer,
        maxPoints: item.maxPoints,
      });
      results[item.id] = evaluation;
    } catch (e) {
      console.error(`[Semantic AI Grading] Batch error on item ${item.id}:`, e);
      results[item.id] = fallbackEvaluateShortAnswer({
        expectedAnswer: item.expectedAnswer,
        candidateAnswer: item.candidateAnswer,
        maxPoints: item.maxPoints,
      });
    }
  });

  await Promise.allSettled(promises);
  return results;
}
