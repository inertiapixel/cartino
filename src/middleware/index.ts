import { Request, Response, NextFunction } from 'express';
import { Model } from 'mongoose';
import { I_Cart } from '../types/cartModel';
import { setCartModel } from '../db/cartinoModel';
import { ensureCartinoSession } from '../utils/sessionManager';

let initialized = false;

export function createCartinoMiddleware(model: Model<I_Cart>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!initialized) {
      setCartModel(model);
      initialized = true;
    }

    const sessionId = ensureCartinoSession({ req, res });

    req.cartino = {
      sessionId
    };

    next();
  };
}
