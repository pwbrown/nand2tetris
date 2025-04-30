/**
 * Converts a decimal number into a binary string (w/ optional padding)
 * @param num number to convert
 * @param length target length of the final binary string (0's added as left padding)
 * @returns binary string
 */
export const toBinaryString = (num: number, length?: number) => {
  const binStr = num.toString(2);
  if (typeof length === 'number' && length > binStr.length) {
    return binStr.padStart(length, '0');
  }
  return binStr;
};

/** Shortcut for the toBinaryString with a target length of 15 bits */
export const toBinaryAddress = (num: number) => toBinaryString(num, 15);