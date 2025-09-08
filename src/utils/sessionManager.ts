// cartino/src/utils/sessionManager.ts
import { randomBytes } from "crypto";
import { CookieManager } from "./cookieManager";
import { Response, Request } from "express";

function generateCartinoSessionId(): string {
  return `cartino_${randomBytes(6).toString("base64url")}`;
}

export interface SessionOptions {
  req: Request;
  res: Response;
  cookieName?: string;
  maxAgeDays?: number;
}

export function ensureCartinoSession({
  req,
  res,
  cookieName = "session",
  maxAgeDays = 7,
}: SessionOptions) {
  let sessionId = CookieManager.getCookie(req, cookieName);

  if (!sessionId) {
    sessionId = generateCartinoSessionId();
    CookieManager.setCookie(res, cookieName, sessionId, { maxAgeDays });
  }

  req.cartino = {
    sessionId,
    userId: req.cartino?.userId, // keep userId if already attached
  };

  return req.cartino;
}

export function resetCartinoSession({
  res,
  cookieName = "session",
  maxAgeDays = 7,
}: Omit<SessionOptions, "req">) {
  const newSessionId = generateCartinoSessionId();
  CookieManager.setCookie(res, cookieName, newSessionId, { maxAgeDays });

  return { sessionId: newSessionId };
}
