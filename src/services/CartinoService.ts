// src/services/CartinoService.ts
import { getCartModel } from "../db/cartinoModel";
import { Types } from "mongoose";
import { CartinoValidator } from "../utils/CartinoValidator";
import { CookieManager } from "../utils/cookieManager";
import { CartinoRequest, CartinoResponse } from "../types/cartino";
import { generateCartinoSessionId } from "../utils/session";

export class CartinoService {
  /**
   * Call right after a successful login.
   * Ensures cookies are set and merges any guest cart into the user's cart.
   */
  static async mergeCart(req: CartinoRequest, res: CartinoResponse, userId: string | Types.ObjectId) {
    if (!req || !res) {
      throw new Error("Cartino.mergeCart requires both req and res");
    }

    const sessionId = req?.cartino?.sessionId;
    CartinoValidator.validateSessionId(sessionId);
    CartinoValidator.validateUserId(userId);
    

    // Normalize to ObjectId
    const userObjectId =
      typeof userId === "string" ? new Types.ObjectId(userId) : userId;

      // console.log('userObjectId',userObjectId);

    const Cart = getCartModel();

    // Load guest + user carts
    const guestCart = await Cart.findOne({ sessionId, userId: null });
    const userCart = await Cart.findOne({ userId: userObjectId });

    // Update cookies: keep session; set userId
    CookieManager.setCookie(res, "sessionId", sessionId!, { maxAgeDays: 7 });
    CookieManager.setCookie(res, "userId", userObjectId.toString(), { maxAgeDays: 7 });

    // Attach to req for downstream handlers in the SAME request
    req.cartino = {
      sessionId: sessionId!,
      userId: userObjectId.toString(),
    };

    // console.log('req.cartino:', req.cartino);
    // Case 1: No guest cart → just return user cart (could be null if user had no cart)
    if (!guestCart) return userCart;

    // Case 2: No user cart → upgrade guest → user
    if (!userCart) {
      guestCart.userId = userObjectId;
      guestCart.sessionId = null;
      await guestCart.save();
      return guestCart;
    }

    // Case 3: Merge guest cart into user cart
    for (const gItem of guestCart.items) {
      const existing = userCart.items.find(
        (uItem) => uItem.itemId.toString() === gItem.itemId.toString()
      );
      if (existing) {
        existing.quantity += gItem.quantity;
      } else {
        userCart.items.push(gItem);
      }
    }

    await userCart.save();
    await Cart.deleteOne({ _id: guestCart._id });

    return userCart;
  }

  /**
   * Call right after logout.
   * Removes userId cookie but keeps/refreshes session so guest cart continues to work.
   */
  static async detachUser(req: CartinoRequest, res: CartinoResponse) {
    const oldSessionId = req?.cartino?.sessionId;
  
    if (!oldSessionId) {
      return { success: false, message: "No active session" };
    }
  
    // Generate a new sessionId for guest mode
    const newSessionId = generateCartinoSessionId();
  
    // Remove userId cookie
    CookieManager.deleteCookie(res, "userId");
  
    // Set the new sessionId cookie
    CookieManager.setCookie(res, "sessionId", newSessionId, { maxAgeDays: 7 });
  
    // Reset req.cartino into guest mode
    req.cartino = { sessionId: newSessionId, userId: undefined };
  
    return { success: true, sessionId: newSessionId };
  }
  
  
}
