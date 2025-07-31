import { Document, Types } from 'mongoose';

export interface I_CartModifier {
  /** Human-readable label (optional, for UI/debugging) */
  name?: string;

  /** Required: The type of modifier, useful for filtering/grouping 
   * ex: 'shipping' | 'tax' | 'discount' | 'wrapping' | 'custom' | 'sale' | 'promo'
   **/

  type: string;

  /** Required: The numeric value of the modifier */
  value: string | number; // directly positive or negative: Flat -10, 15, or Percentage 5%, -5% etc.

  /** Required: Whether this affects subtotal or total */
  target?: 'total' | 'subtotal';

  /** Optional: Execution order (lower = applied earlier) */
  order?: number;

  /** Optional: Flexible metadata storage */
  metadata?: Record<string, unknown>;
}

export interface I_CartItem {
  itemId: Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  attributes?: Record<string, unknown>;
  modifiers?: I_CartModifier[];
  associatedModel?: {
    modelName: string;
    data: Record<string, unknown>; // full raw object from Product, Service, etc.
  };
}

export interface I_Cart extends Document {
  userId?: Types.ObjectId | null;
  sessionId?: string | null;
  instance: 'cart' | 'wishlist' | 'save_for_later';
  items: I_CartItem[];
  modifiers?: I_CartModifier[];
  metadata?: Record<string, unknown>; //could be store ip, origin, browser etc.
  createdAt: Date;
  updatedAt: Date;
}

export interface EnrichedCartItem extends I_CartItem {
  hasAttribute: (key: string) => boolean;
  getAttribute: (key: string) => unknown;
}