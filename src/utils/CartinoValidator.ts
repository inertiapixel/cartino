// src/utils/CartinoValidator.ts
import { Types } from "mongoose";

export class CartinoValidator {
  // Helper to safely stringify values for error messages
  private static safePrint(val: unknown): string {
    if (val === null) return "null";
    if (val === undefined) return "undefined";
    if (typeof val === "string") return `"${val}"`; // wrap strings in quotes
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }

  static validateSessionId(sessionId: unknown): asserts sessionId is string {
    if (!(typeof sessionId === "string") || !sessionId.trim()) {
      throw new Error(
        `Invalid sessionId: expected non-empty string, got ${this.safePrint(sessionId)}`
      );
    }
  }

  static validateUserId(userId: unknown): asserts userId is string | Types.ObjectId {
    if (
      !(
        (typeof userId === "string" && userId.trim().length > 0) ||
        userId instanceof Types.ObjectId
      )
    ) {
      throw new Error(
        `Invalid userId: expected non-empty string or ObjectId, got ${this.safePrint(userId)}`
      );
    }
  }
}
