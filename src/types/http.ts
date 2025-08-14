// cartino/src/types/http.ts
import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    cartino?: {
      sessionId?: string;
    };
  }
}