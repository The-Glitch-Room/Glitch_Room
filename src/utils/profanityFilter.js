/**
 * Glitch Room Community Profanity Filter Utility
 * Protects forum posts and comments from profanity, offensive slurs, and abuse.
 */

const PROFANITY_WORDS = [
  "fuck", "fucker", "fucking", "fuckin", "fucked", "fuckhead", "fuckoff", "fucks",
  "shit", "shitting", "shitted", "shithead", "shitty", "shits", "bullshit",
  "bitch", "bitches", "bitching", "bitchy",
  "asshole", "asswipe", "asshat", "arsehole", "bastard", "dickhead", "dick", "dicks",
  "cunt", "cunts", "cock", "cocks", "cocksucker", "pussy", "pussies",
  "whore", "slut", "sluts", "twat", "wanker", "prick", "nigger", "nigga",
  "faggot", "fag", "retard", "retarded", "chink", "spic", "kike", "dyke",
  "motherfucker", "motherfucking", "jackass", "dipshit"
];

// Known false positives from substring/boundary edge cases — extend as you find more.
const SAFE_EXCEPTIONS = [
  "scunthorpe", "penistone", "cockburn", "dickinson", "dickens",
  "despicable", "conspicuous", "conspicuously", "cockpit", "cocktail",
  "cockatoo", "peacock", "shuttlecock", "candlestick",
];

const LEET_MAP = {
  '@': 'a', '4': 'a',
  '8': 'b',
  '(': 'c',
  '3': 'e',
  '1': 'i', '!': 'i', '|': 'i',
  '0': 'o',
  '$': 's', '5': 's',
  '+': 't', '7': 't',
  'v': 'u',
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Separator characters allowed between the letters of a single target word
// (handles "f u c k", "f.u.c.k", "f_u_c_k", etc.) without destroying word
// boundaries elsewhere in the message — unlike globally stripping all spaces.
const SEP = "[\\s._\\-*]*";

// Precompute everything once at module load — not on every call.
const COMPILED_PATTERNS = PROFANITY_WORDS.map((word) => {
  const spaced = word.split("").map(escapeRegex).join(SEP);
  return { word, regex: new RegExp(`\\b${spaced}\\b`, "i") };
});

// Collapse ALL repeated identical characters to one, applied symmetrically
// to both the input text and the dictionary words, so evasions like
// "fuuuuuck" reduce to "fuck" while legitimately double-lettered words
// (e.g. "asshole") still compare correctly against their own deduped form.
const dedupe = (s) => s.replace(/(.)\1+/g, "$1");

const DEDUPED_PATTERNS = PROFANITY_WORDS.map((word) => ({
  word,
  regex: new RegExp(`\\b${dedupe(word)}\\b`, "i"),
}));

function normalizeText(text) {
  const lower = text.toLowerCase();
  const converted = lower.split("").map((ch) => LEET_MAP[ch] || ch).join("");
  return { lower, converted };
}

/**
 * Checks if a given text string contains profanity or abusive language.
 * @param {string} text - Text to inspect (title, body, comment)
 * @returns {boolean} - True if profanity is detected, false otherwise.
 */
export function containsProfanity(text) {
  if (!text || typeof text !== "string") return false;

  const { lower, converted } = normalizeText(text);

  // Skip entirely if the whole message is a known safe exception
  const bareWord = converted.trim();
  if (SAFE_EXCEPTIONS.includes(bareWord)) return false;

  // 1. Spacing/leet evasion check — real \b boundaries preserved, so
  // "despicable" can't match "spic" (no boundary before the 's').
  for (const { regex } of COMPILED_PATTERNS) {
    if (regex.test(converted) || regex.test(lower)) return true;
  }

  // 2. Elongation evasion check — "fuuuuuck" -> "fuck"
  const deduped = dedupe(converted);
  for (const { regex } of DEDUPED_PATTERNS) {
    if (regex.test(deduped)) return true;
  }

  return false;
}

export const PROFANITY_ERROR_MSG =
  "⚠️ Inappropriate language detected. Please keep community posts and comments clean and respectful.";
