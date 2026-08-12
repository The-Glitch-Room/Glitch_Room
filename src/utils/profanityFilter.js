/**
 * Glitch Room Community Profanity Filter Utility
 * Protects forum posts and comments from profanity, offensive slurs, and abuse.
 */

// Core profanity word list (base terms + common explicit slurs & abusive words)
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

// Leetspeak character mappings for normalization
const LEET_MAP = {
  '@': 'a', '4': 'a',
  '8': 'b',
  'c': 'c', '(': 'c',
  '3': 'e',
  '1': 'i', '!': 'i', '|': 'i',
  '0': 'o',
  '$': 's', '5': 's',
  '+': 't', '7': 't',
  'v': 'u',
};

/**
 * Normalizes input text by removing spaces/symbols and replacing leetspeak characters
 */
function normalizeText(text) {
  if (!text) return "";
  let lower = text.toLowerCase();

  // Replace leetspeak characters
  let converted = lower.split("").map((ch) => LEET_MAP[ch] || ch).join("");

  // Remove repeating characters (e.g. fuuuuck -> fuck)
  let collapsed = converted.replace(/(.)\1{2,}/g, "$1$1");

  return { rawLower: lower, converted, collapsed };
}

/**
 * Checks if a given text string contains profanity or abusive language.
 * @param {string} text - Text to inspect (title, body, comment)
 * @returns {boolean} - True if profanity is detected, false otherwise.
 */
export function containsProfanity(text) {
  if (!text || typeof text !== "string") return false;

  const { rawLower, converted, collapsed } = normalizeText(text);

  // Check each profanity word against raw, converted, and collapsed strings
  for (const word of PROFANITY_WORDS) {
    // Exact word boundary regex (e.g. \bfuck\b)
    const pattern = new RegExp(`\\b${word}\\b`, "i");

    if (pattern.test(rawLower) || pattern.test(converted) || pattern.test(collapsed)) {
      return true;
    }

    // Check stripped punctuation variations (e.g. f.u.c.k or f_u_c_k or f-u-c-k)
    const stripped = rawLower.replace(/[\s._\-\*]+/g, "");
    if (stripped.includes(word)) {
      return true;
    }
  }

  return false;
}

export const PROFANITY_ERROR_MSG =
  "⚠️ Inappropriate language detected. Please keep community posts and comments clean and respectful.";
