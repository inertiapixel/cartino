//cartino/src/utils/sessionManager.ts
import { Request, Response } from 'express';
import { randomBytes } from 'crypto';

interface SessionOptions {
  req: Request;
  res: Response;
  cookieName?: string;
  maxAgeDays?: number;
}

function generateCartinoSessionId(): string {
  const timestamp = Date.now();
  const randomPart = randomBytes(16).toString('hex');
  return `cartino_${timestamp}_${randomPart}`;
}

export function ensureCartinoSession({
  req,
  res,
  cookieName = 'cartino_session',
  maxAgeDays = 7,
}: SessionOptions): string {
  let sessionId = '';

  // Parse cookies
  const rawCookie = req.headers.cookie || '';
  const cookies: Record<string, string> = {};
  rawCookie.split(';').forEach((pair) => {
    const [key, value] = pair.trim().split('=');
    if (key && value) cookies[key] = decodeURIComponent(value);
  });

  // Reuse existing cookie if available
  sessionId = cookies[cookieName] || '';

  if (!sessionId) {
    sessionId = generateCartinoSessionId();

    const expires = new Date();
    expires.setDate(expires.getDate() + maxAgeDays);

    res.setHeader(
      'Set-Cookie',
      [
        `${cookieName}=${encodeURIComponent(sessionId)}`,
        'HttpOnly',
        'Path=/',
        'SameSite=Lax',
        `Expires=${expires.toUTCString()}`,
        process.env.NODE_ENV === 'production' ? 'Secure' : '',
      ]
        .filter(Boolean)
        .join('; ')
    );
  }

  return sessionId;
}
