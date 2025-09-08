// cartino/src/utils/sessionManager.ts
import { randomBytes } from "crypto";
import { CookieManager } from "./cookieManager";
import { CartinoRequest, CartinoResponse, CartinoSession } from "../types/cartino";

function generateCartinoSessionId(): string {
  return `cartino_${randomBytes(6).toString("base64url")}`;
}

export interface SessionOptions {
  req: CartinoRequest;
  res: CartinoResponse;
  cookieName?: string;
  maxAgeDays?: number;
}

export function ensureCartinoSession({
  req,
  res,
  cookieName = "sessionId",   // 🔁 unify with cookie naming
  maxAgeDays = 7,
}: SessionOptions): CartinoSession {
  let sessionId = CookieManager.getCookie(req, cookieName);
  if (!sessionId) {
    sessionId = generateCartinoSessionId();
    CookieManager.setCookie(res, cookieName, sessionId, { maxAgeDays });
  }

  // keep existing userId if present, otherwise rehydrate from cookie
  const cookieUserId = CookieManager.getCookie(req, "userId");
  const session: CartinoSession = {
    sessionId,
    userId: req.cartino?.userId ?? cookieUserId,
  };

  req.cartino = session;
  return session;
}

export function resetCartinoSession({
  res,
  cookieName = "sessionId",   // unify with cookie naming
  maxAgeDays = 7,
}: Omit<SessionOptions, "req">): CartinoSession {
  const newSessionId = generateCartinoSessionId();
  CookieManager.setCookie(res, cookieName, newSessionId, { maxAgeDays });
  return { sessionId: newSessionId };
}
