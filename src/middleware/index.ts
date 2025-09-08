// cartino/src/middleware/index.ts
import { Response, NextFunction } from "express";
import { Model } from "mongoose";
import { I_Cart } from "../types/cartModel";
import { setCartModel } from "../db/cartinoModel";
import { ensureCartinoSession } from "../utils/sessionManager";
import { CartinoRequest } from "../types/cartino";

let initialized = false;

export function createCartinoMiddleware(model: Model<I_Cart>) {
  return (req: CartinoRequest, res: Response, next: NextFunction) => {
    if (!initialized) {
      setCartModel(model);
      initialized = true;
    }

    ensureCartinoSession({ req, res }); // this attaches req.cartino

    next();
  };
}
