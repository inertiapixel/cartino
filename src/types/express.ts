// cartino/src/types/express.d.ts
import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    cartino?: {
      sessionId?: string;
      userId?: string;
    };
  }
}