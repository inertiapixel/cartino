import { Request, Response } from "express";

export interface CartinoSession {
  sessionId?: string;
  userId?: string;
}

/**
 * Express Request extended with `cartino` property
 */
export interface CartinoRequest extends Request {
  cartino?: CartinoSession;
}

/**
 * Express Response (kept for consistency, easy aliasing)
 */
export type CartinoResponse = Response;