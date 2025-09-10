import { randomBytes } from "crypto";

/**
 * Generate a secure Cartino sessionId.
 * Example: cartino_N1k4aBcX9L0=
 */
export const generateCartinoSessionId = (): string =>
  `cartino_${randomBytes(6).toString("base64url")}`;