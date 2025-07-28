// src/services/BaseService.ts
import { Types } from 'mongoose';
import { getCartModel } from '../db/cartinoModel';
import { I_Cart, I_CartItem } from '../types/cartModel';

interface AssociatedModel {
  modelName: string;
  data: Record<string, unknown>;
}

interface I_AddToCart {
  itemId: Types.ObjectId | string;
  name: string;
  quantity: number;
  price: number;
  attributes?: Record<string, unknown>;
  associatedModel?: AssociatedModel;
}

export abstract class BaseService {
  protected owner: { userId?: Types.ObjectId; sessionId?: string };
  protected abstract instance: 'cart' | 'wishlist' | 'saved_for_later';
  private _itemId?: string | Types.ObjectId;

  /**
   * Initializes the service with the owner ID.
   * Accepts either a MongoDB ObjectId (for authenticated users)
   * or a string session ID (for guests).
   *
   * @param ownerId - The unique identifier for the cart owner
   */
  protected constructor(ownerId: string | Types.ObjectId) {
    if (Types.ObjectId.isValid(ownerId) && typeof ownerId !== 'string') {
      this.owner = { userId: new Types.ObjectId(ownerId) };
    } else {
      this.owner = { sessionId: String(ownerId) };
    }
  }

  item(itemId: string | Types.ObjectId) {
    this._itemId = itemId;
    return this;
  }

  /**
   * Adds an item to the cart/wishlist/saved list.
   * If the item with same attributes exists, its quantity will be incremented.
   * Otherwise, it adds a new entry to the cart.
   *
   * @param params - Item details including itemId, quantity, price, name, attributes, and associated model
   * @returns Updated cart document
   */
  async add(params: I_AddToCart): Promise<I_Cart> {
    const {
      itemId,
      quantity,
      price,
      name,
      attributes = {},
      associatedModel,
    } = params;

    const CartModel = getCartModel();
    const query: Record<string, unknown> = {
      instance: this.instance,
      ...this.owner,
    };

    let cart: I_Cart | null = await CartModel.findOne(query);

    if (!cart) {
      cart = new CartModel({
        ...this.owner,
        instance: this.instance,
        items: [],
      }) as I_Cart;
    }

    const itemIdStr = itemId.toString();

    const existingItem = cart.items.find(
      item =>
        item.itemId.toString() === itemIdStr &&
        JSON.stringify(item.attributes || {}) === JSON.stringify(attributes)
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      const newItem: I_CartItem = {
        itemId: new Types.ObjectId(itemId),
        name,
        quantity,
        price: parseFloat(price.toFixed(2)),
        attributes,
        associatedModel,
      };

      cart.items.push(newItem);
    }

    cart.updatedAt = new Date();
    await cart.save();

    return cart;
  }

  /**
   * Removes an item from the cart by its itemId.
   * Throws an error if cart or item is not found.
   *
   * @param itemId - The item ID to remove (ObjectId or string)
   * @returns Updated cart document after item removal
   */
  async remove(itemId: string | Types.ObjectId): Promise<I_Cart> {
    const CartModel = getCartModel();
    const query: Record<string, unknown> = {
      instance: this.instance,
      ...this.owner,
    };
  
    const cart = await CartModel.findOne(query);
    if (!cart) throw new Error('Cart not found');
  
    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item => item.itemId.toString() !== itemId.toString());
  
    if (cart.items.length === initialLength) {
      throw new Error('Item not found in cart');
    }
  
    cart.updatedAt = new Date();
    await cart.save();
  
    return cart;
  }

 /**
 * Updates an existing cart item's properties (like quantity, price, attributes, etc.).
 * - Only the provided fields in `updates` will be modified.
 * - If `quantity` is less than or equal to zero, the item will be removed from the cart.
 *
 * @param itemId - The unique ID of the cart item to update.
 * @param updates - An object containing optional fields to update.
 * @returns The updated cart document.
 * @throws Error if the cart or item is not found.
 */
async update(
  itemId: string | Types.ObjectId,
  updates: Partial<Omit<I_CartItem, 'itemId' | 'quantity'>> & {
    quantity?: number;
  }
): Promise<I_Cart> {
  const CartModel = getCartModel();
  const query: Record<string, unknown> = {
    instance: this.instance,
    ...this.owner,
  };

  const cart: I_Cart | null = await CartModel.findOne(query);
  if (!cart) throw new Error('Cart not found');

  const itemIdStr = itemId.toString();

  const itemIndex = cart.items.findIndex(
    item => item.itemId.toString() === itemIdStr
  );

  if (itemIndex === -1) throw new Error('Cart item not found');

  const item = cart.items[itemIndex];

  // If quantity is set and is zero or less, remove the item from cart
  if (updates.quantity !== undefined && updates.quantity <= 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    if (updates.price !== undefined) item.price = parseFloat(updates.price.toFixed(2));
    if (updates.quantity !== undefined) item.quantity = updates.quantity;
    if (updates.name !== undefined) item.name = updates.name;
    if (updates.attributes !== undefined) item.attributes = updates.attributes;
    if (updates.associatedModel !== undefined) item.associatedModel = updates.associatedModel;
  }

  cart.updatedAt = new Date();
  await cart.save();

  return cart;
}

/**
 * Increase the quantity of a specific cart item by a given value.
 * @param value - Number to increment the quantity by (default is 1)
 * @returns Updated cart document
 */
async incrementQuantity(value: number = 1): Promise<I_Cart> {
  return this.updateQuantity({ relative: true, quantity: value });
}

/**
 * Decrease the quantity of a specific cart item by a given value.
 * If the resulting quantity is 0 or less, the item will be removed.
 * @param value - Number to decrement the quantity by (default is 1)
 * @returns Updated cart document
 */
async decrementQuantity(value: number = 1): Promise<I_Cart> {
  return this.updateQuantity({ relative: true, quantity: -value });
}

/**
 * Increase the quantity of a specific cart item by a given value.
 * @param value - Number to increment the quantity by (default is 1)
 * @returns Updated cart document
 */
async updateQuantity(
  input: number | { relative?: boolean; quantity: number }
): Promise<I_Cart> {
  const CartModel = getCartModel();
  const query: Record<string, unknown> = {
    instance: this.instance,
    ...this.owner,
  };

  const cart: I_Cart | null = await CartModel.findOne(query);
  if (!cart) throw new Error('Cart not found');

  const itemIdStr = this._itemId?.toString();
  if (!itemIdStr) throw new Error('Item ID not provided');

  const itemIndex = cart.items.findIndex(
    item => item.itemId.toString() === itemIdStr
  );
  if (itemIndex === -1) throw new Error('Cart item not found');

  const item = cart.items[itemIndex];

  let newQuantity: number;
  if (typeof input === 'number') {
    newQuantity = input; // absolute set
  } else {
    const { relative = false, quantity } = input;
    newQuantity = relative ? item.quantity + quantity : quantity;
  }

  if (newQuantity <= 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    item.quantity = newQuantity;
  }

  cart.updatedAt = new Date();
  await cart.save();
  return cart;
}

/**
 * Retrieve all items in the current user's cart along with total price sum.
 * Must be chained after `.owner(userId)` to set the cart context.
 *
 * @returns An object containing cart items and price sum.
 * @throws Error if the cart is not found.
 *
 * @example
 * const { items, getPriceSum } = await Cart.owner(userId).getContent();
 * console.log('Cart Total:', getPriceSum);
 * 
 * Each item includes utility methods: `hasAttribute(key)` and `getAttribute(key)`.
 */
async getContent(): Promise<{
  items: (I_CartItem & {
    hasAttribute: (key: string) => boolean;
    getAttribute: (key: string) => unknown;
  })[];
  getPriceSum: number;
}> {
  const CartModel = getCartModel();

  const query: Record<string, unknown> = {
    instance: this.instance,
    ...this.owner,
  };

  const cart: I_Cart | null = await CartModel.findOne(query);
  if (!cart) throw new Error('Cart not found');

  // Explicitly map to plain JS object using I_CartItem shape
  const items = cart.items.map((item): I_CartItem & {
    hasAttribute: (key: string) => boolean;
    getAttribute: (key: string) => unknown;
  } => {
    const plainItem: I_CartItem =
      typeof (item as any).toObject === 'function'
        ? (item as unknown as { toObject: () => I_CartItem }).toObject()
        : item;

    return {
      ...plainItem,
      hasAttribute(key: string): boolean {
        return Object.prototype.hasOwnProperty.call(plainItem.attributes ?? {}, key);
      },
      getAttribute(key: string): unknown {
        return plainItem.attributes?.[key] ?? null;
      },
    };
  });

  const getPriceSum = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return { items, getPriceSum };
}



//class BaseService end
}