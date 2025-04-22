import crypto from "crypto";

/**
 * Generates a raw verification token, its SHA256 hash, and an expiry date.
 * @param {number} [expiresInHours=1] - Optional: How many hours until the token expires. Defaults to 1.
 * @returns {{ rawToken: string, hashedToken: string, expiryDate: Date }} - Object containing the raw token, hashed token, and expiry date.
 */
export const generateVerificationToken = (expiresInHours: number = 1) => {
  const rawToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + expiresInHours);

  return {
    rawToken,
    hashedToken,
    expiryDate,
  };
};

/**
 * Generates a raw password reset token, its SHA256 hash, and an expiry date.
 * @param {number} [expiresInMinutes=10]
 * @returns {{ rawToken: string, hashedToken: string, expiryDate: Date }}
 */
export const generatePasswordResetToken = (expiresInMinutes: number = 10) => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  const expiryDate = new Date(Date.now() + expiresInMinutes * 60 * 1000); // Convert minutes to ms
  return { rawToken, hashedToken, expiryDate };
};
