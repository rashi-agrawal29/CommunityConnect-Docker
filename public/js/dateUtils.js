

/**
 * Checks whether a given date string represents a future date.
 * @param {string} dateStr - The date string to check (usually in ISO format).
 * @returns {boolean} - Returns true if the date is in the future; otherwise, false.
 */
function isFutureDate(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  // If the date conversion fails, return false.
  if (isNaN(date.getTime())) {
    return false;
  }
  return date > now;
}

module.exports = { isFutureDate };
