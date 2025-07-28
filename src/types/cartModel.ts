import { Document, Types } from 'mongoose';

/**
 * target: 'total': // this condition will be applied to cart's subtotal when getSubTotal() is called.
 * target: 'total'; //this condition will be applied to cart's total when getTotal() is called.
 * type: 'shipping' | 'tax' | 'discount' | 'wrapping' | 'custom' | 'sale' | 'promo';
 */
export interface I_CartCondition {
  name?: string;
  type: string;
  value: number;
  operator?: 'add' | 'subtract';
  target: 'total' | 'subtotal';
  order?: number; // defines the sequence (e.g., 1 = applied first, 2 = second)
  metadata?: Record<string, unknown>; // string, number, object, array, etc.
}

export interface I_CartItem {
  itemId: Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  attributes?: Record<string, unknown>;
//   conditions?: I_CartCondition[];
  associatedModel?: {
    modelName: string;
    data: Record<string, unknown>; // full raw object from Product, Service, etc.
  };
}

export interface I_Cart extends Document {
  userId?: Types.ObjectId | null;
  sessionId?: string | null;
  instance: 'cart' | 'wishlist' | 'saved_for_later';
  items: I_CartItem[];
  conditions?: I_CartCondition[];
  metadata?: Record<string, unknown>; //could be store ip, origin, browser etc.
  createdAt: Date;
  updatedAt: Date;
}