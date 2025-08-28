// src/services/CartinoService.ts
import { getCartModel } from '../db/cartinoModel';
import { Types } from 'mongoose';
import { CartinoValidator } from '../utils/CartinoValidator';

export class CartinoService {
  static async mergeCarts(userId: string | unknown, sessionId: string | unknown) {
    // 🔹 Validate inputs separately
    CartinoValidator.validateSessionId(sessionId);
    CartinoValidator.validateUserId(userId);

    const Cart = getCartModel();

    const guestCart = await Cart.findOne({ sessionId, userId: null });
    const userCart = await Cart.findOne({ userId });

    // Case 1: No guest cart, return user cart
    if (!guestCart) return userCart;

    // Case 2: No user cart, upgrade guest → user
    if (!userCart) {
      guestCart.userId =
        typeof userId === "string" ? new Types.ObjectId(userId) : userId;
      guestCart.sessionId = null;
      await guestCart.save();
      return guestCart;
    }

    // Case 3: Merge guest into user cart
    for (const gItem of guestCart.items) {
      const existing = userCart.items.find(
        (uItem) => uItem.itemId.toString() === gItem.itemId.toString()
      );
      if (existing) {
        existing.quantity += gItem.quantity; // merge quantity
      } else {
        userCart.items.push(gItem);
      }
    }

    await userCart.save();
    await Cart.deleteOne({ _id: guestCart._id });

    return userCart;
  }
}
