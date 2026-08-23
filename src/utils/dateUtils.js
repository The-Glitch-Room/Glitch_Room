/**
 * Date Utility Helpers for Glitch Room
 */

/**
 * Returns canonical local calendar date string in YYYY-MM-DD format
 * Prevents UTC timezone rollover bugs for local midnight calculations
 */
export const getLocalDateStr = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
