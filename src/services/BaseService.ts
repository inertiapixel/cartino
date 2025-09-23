// src/services/BaseService.ts
import { Types } from 'mongoose';
import { getCartModel } from '../db/cartinoModel';
import { EnrichedCartItem, I_Cart, I_CartItem, I_CartModifier } from '../types/cartModel';
import { isModifierValid, normalizeModifier, validateModifierOrder, validateModifierTarget, validateModifierType, validateModifierValue } from '../utils/modifierUtils';
import { AppliedModifier, ModifierValidationIssue } from '../types/modifier';
import { _getCartDetails } from '../utils';
import { CartinoRequest } from '../types/cartino';

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

type BaseServiceStatic<T extends BaseService> = {
  new (ownerId: string | Types.ObjectId): T;
  resolveOwner(req?: CartinoRequest, fallbackOwnerId?: string): string | Types.ObjectId;
  run<R>(fn: (service: T) => Promise<R>, req?: CartinoRequest, fallbackOwnerId?: string): Promise<R>;
};

export abstract class BaseService {
  protected owner: { userId?: Types.ObjectId; sessionId?: string };
  protected abstract instance: 'cart' | 'wishlist' | 'save_for_later';
  private _itemId?: string | Types.ObjectId;

  /**
   * Initializes the service with the owner ID.
   * Accepts either a MongoDB ObjectId (for authenticated users)
   * or a string session ID (for guests).
   *
   * @param ownerId - The unique identifier for the cart owner
   */
  protected constructor(ownerId: string | Types.ObjectId) {
    if (typeof ownerId === "string") {
      if (ownerId.startsWith("cartino_")) {
        this.owner = { sessionId: ownerId };
      } else {
        this.owner = { userId: new Types.ObjectId(ownerId) };
      }
    } else {
      // direct ObjectId (already a Mongo ObjectId)
      this.owner = { userId: ownerId };
    }
  }
  
  public static resolveOwner(req?: CartinoRequest, fallbackOwnerId?: string): string | Types.ObjectId {
    console.log('req.cartinoreq.cartino::-',req?.cartino);
    if (req?.cartino?.userId) return req.cartino.userId;
    if (req?.cartino?.sessionId) return req.cartino.sessionId;
    if (fallbackOwnerId) return fallbackOwnerId;
  
    throw new Error(
      "Cartino: Cannot resolve ownerId. Either pass req with cartino session or use Cart.owner(userId)"
    );
  }

  /** private functions for internal use only */

  item(itemId: string | Types.ObjectId) {
    this._itemId = itemId;
    return this;
  }
  
  private async getCart(): Promise<I_Cart | null> {
    const CartModel = getCartModel();
    const query: Record<string, unknown> = {
      instance: this.instance,
      ...this.owner,
    };
  
    return await CartModel.findOne(query);
  }

  private async getOrThrow(): Promise<I_Cart> {
    const cart = await this.getCart();
    if (!cart) throw new Error('Cart not found');
    return cart;
  }

  private async getItemIndex(itemId: string | Types.ObjectId): Promise<{
    cart: I_Cart;
    index: number;
  }> {
    const cart = await this.getOrThrow();
    const itemIdStr = itemId.toString();
  
    const index = cart.items.findIndex(
      item => item.itemId.toString() === itemIdStr
    );
  
    if (index === -1) {
      throw new Error('Cart item not found');
    }
  
    return { cart, index };
  }

  private assertItemIdExists(): string {
    if (!this._itemId) {
      throw new Error('Item ID is required');
    }
    return this._itemId.toString();
  }
  
  private async findItemOrThrow(): Promise<I_CartItem> {
    const cart = await this.getOrThrow();
    const itemId = this.assertItemIdExists();
  
    const item = cart.items.find(i => i.itemId.toString() === itemId);
    if (!item) {
      throw new Error('Item not found');
    }
  
    return item;
  }

  /** end of private functions for internal use only */


   /** --------------------------
   * Shared helper for static methods
   * -------------------------- */
   public static async run<T extends BaseService, R>(
    this: { new (ownerId: string | Types.ObjectId): T; resolveOwner(req?: CartinoRequest, fallbackOwnerId?: string): string | Types.ObjectId },
    fn: (service: T) => Promise<R>,
    req?: CartinoRequest,
    fallbackOwnerId?: string
  ): Promise<R> {
    const owner = this.resolveOwner(req, fallbackOwnerId);
    const service: T = new this(owner); // type-safe
    return await fn(service);
  }
  
  /** --------------------------
   * Static methods
   * -------------------------- */
  static add<T extends BaseService>(
    this: BaseServiceStatic<T>,
    params: I_AddToCart,
    req?: CartinoRequest
  ): Promise<I_Cart> {
    return this.run((service: T) => service.add(params), req);
  }

  static isEmpty<T extends BaseService>(
    this: BaseServiceStatic<T>,
    req?: CartinoRequest,
    fallbackOwnerId?: string
  ): Promise<boolean> {
    return this.run((service) => service.isEmpty(), req, fallbackOwnerId);
  }

  static countItems<T extends BaseService>(
    this: BaseServiceStatic<T>,
    req?: CartinoRequest,
    fallbackOwnerId?: string
  ): Promise<number> {
    return this.run((service) => service.countItems(), req, fallbackOwnerId);
  }

  // static wrapper for countTotalQuantity
  static async countTotalQuantity<T extends BaseService>(
    this: BaseServiceStatic<T>,
    req?: CartinoRequest,
    fallbackOwnerId?: string
  ): Promise<number> {
    return this.run(service => service.countTotalQuantity(), req, fallbackOwnerId);
  }

  // static wrapper for findItem
  static async findItem<T extends BaseService>(
    this: BaseServiceStatic<T>,
    itemId: string | Types.ObjectId,
    req?: CartinoRequest,
    fallbackOwnerId?: string
  ): Promise<I_CartItem | undefined> {
    return this.run(service => service.findItem(itemId), req, fallbackOwnerId);
  }

  static async remove<T extends BaseService>(
    this: BaseServiceStatic<T>,
    itemId: string | Types.ObjectId,
    req?: CartinoRequest,
    fallbackOwnerId?: string
  ): Promise<I_Cart> {
    return this.run(service => service.remove(itemId), req, fallbackOwnerId);
  }

  static async update<T extends BaseService>(
    this: BaseServiceStatic<T>,
    itemId: string | Types.ObjectId,
    updates: Partial<Omit<I_CartItem, 'itemId' | 'quantity'>> & { quantity?: number },
    req?: CartinoRequest,
    fallbackOwnerId?: string
  ): Promise<I_Cart> {
    return this.run(service => service.update(itemId, updates), req, fallbackOwnerId);
  }

  // -------------------------------------------------
  // Static wrapper for incrementQuantity
  // -------------------------------------------------
  static async incrementQuantity<T extends BaseService>(
    this: BaseServiceStatic<T>,
    value: number = 1,
    req?: CartinoRequest,
    fallbackOwnerId?: string
  ): Promise<I_Cart> {
    return this.run(service => service.incrementQuantity(value), req, fallbackOwnerId);
  }

  // -------------------------------------------------
  // Static wrapper for decrementQuantity
  // -------------------------------------------------
  static async decrementQuantity<T extends BaseService>(
    this: BaseServiceStatic<T>,
    value: number = 1,
    req?: CartinoRequest,
    fallbackOwnerId?: string
  ): Promise<I_Cart> {
    return this.run(service => service.decrementQuantity(value), req, fallbackOwnerId);
  }

  // -------------------------------------------------
  // Static wrapper for updateQuantity
  // -------------------------------------------------
  static async updateQuantity<T extends BaseService>(
    this: BaseServiceStatic<T>,
    itemId: string | Types.ObjectId,
    input: number | { relative?: boolean; quantity: number },
    req?: CartinoRequest,
    fallbackOwnerId?: string
  ): Promise<I_Cart> {
    return this.run(async service => service.item(itemId).updateQuantity(input), req, fallbackOwnerId);
  }

  // -------------------------------------------------
  // Static wrapper for clear
  // -------------------------------------------------
  static async clear<T extends BaseService>(
    this: BaseServiceStatic<T>,
    req?: CartinoRequest,
    fallbackOwnerId?: string
  ): Promise<I_Cart> {
    return this.run(async service => service.clear(), req, fallbackOwnerId);
  }
  
  // static async remove<T extends BaseService>(...) { ... }

  // -------------------------------------------------
  // Instance methods
  // -------------------------------------------------
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

    let cart = await this.getCart();
    if (!cart) {
      cart = new CartModel({
        ...this.owner,
        instance: this.instance,
        items: [],
      }) as I_Cart;
    }

    const itemIdStr = itemId.toString();

    const existingItem = cart.items.find(
      (item) =>
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

  // -------------------------------------------------
  // Instance method
  // -------------------------------------------------
  async isEmpty(): Promise<boolean> {
    const cart = await this.getCart();
    return !cart || cart.items.length === 0;
  }


  // -------------------------------------------------
  // Instance method
  // -------------------------------------------------
  async countItems(): Promise<number> {
    const cart = await this.getOrThrow();
    return cart.items.length;
  }


  async countTotalQuantity(): Promise<number> {
    const cart = await this.getOrThrow();
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }

  async findItem(itemId: string | Types.ObjectId): Promise<I_CartItem | undefined> {
    const cart = await this.getOrThrow();
  
    const item = cart.items.find(
      item => item.itemId.toString() === itemId.toString()
    );
  
    return item;
  }

  
  /**
   * Removes an item from the cart by its itemId.
   * Throws an error if cart or item is not found.
   *
   * @param itemId - The item ID to remove (ObjectId or string)
   * @returns Updated cart document after item removal
   */
  async remove(itemId: string | Types.ObjectId): Promise<I_Cart> {

    const cart = await this.getOrThrow();
  
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
  const { cart, index } = await this.getItemIndex(itemId);
  const item = cart.items[index];

  if (updates.quantity !== undefined && updates.quantity <= 0) {
    cart.items.splice(index, 1);
  } else {
    if (updates.price !== undefined) {
      item.price = parseFloat(updates.price.toFixed(2));
    }

    if (updates.quantity !== undefined) {
      item.quantity = updates.quantity;
    }

    if (updates.name !== undefined) {
      item.name = updates.name;
    }

    if (updates.attributes !== undefined) {
      item.attributes = updates.attributes;
    }

    if (updates.associatedModel !== undefined) {
      item.associatedModel = updates.associatedModel;
    }
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
  if (!this._itemId) throw new Error('Item ID not provided');

  const { cart, index } = await this.getItemIndex(this._itemId);
  const item = cart.items[index];

  let newQuantity: number;

  if (typeof input === 'number') {
    newQuantity = input;
  } else {
    const { relative = false, quantity } = input;
    newQuantity = relative ? item.quantity + quantity : quantity;
  }

  if (newQuantity <= 0) {
    cart.items.splice(index, 1);
  } else {
    item.quantity = newQuantity;
  }

  cart.updatedAt = new Date();
  await cart.save();
  return cart;
}

/**
 * Removes all items and modifiers from the cart.
 * @returns The updated (now-empty) cart document.
 * @throws Error if the cart is not found.
 */
async clear(): Promise<I_Cart> {
  const cart = await this.getOrThrow();

  cart.items = [];
  cart.modifiers = [];
  cart.updatedAt = new Date();
  await cart.save();

  return cart;
}

/**
 * Apply a pricing modifier (e.g., discount, tax, shipping) to a specific cart item.
 *
 * Supports value formats like flat amount (e.g., -100, 100) or percentage (e.g., -10%, 10%).
 * If target is not provided, it defaults to 'subtotal'.
 * If order is not provided, it is auto-incremented based on existing modifiers.
 *
 * @param modifier - Modifier to apply (requires type and value; name is optional)
 * @throws Error if cart or item not found, or modifier is invalid/duplicate
 */
async applyItemModifier(modifier: I_CartModifier): Promise<I_Cart> {

  const cart = await this.getOrThrow();

  const normalized = normalizeModifier(modifier);

  // Validate modifier before proceeding
  const validationResult = isModifierValid(normalized);
  if (!validationResult.valid) {
    throw new Error(`Invalid modifier: ${validationResult.details}`);
  }

  if (!this._itemId) throw new Error('Item ID is required before applying a modifier');

  const item = cart.items.find(item => item.itemId.toString() === this._itemId!.toString());
  if (!item) throw new Error('Item not found in cart');

  item.modifiers ??= [];

  const duplicate = item.modifiers.find(m => m.type === normalized.type && m.name === normalized.name);
  if (duplicate) throw new Error(`Modifier '${normalized.name}' already applied.`);

  // Set incremental order if not provided
  if (typeof normalized.order !== 'number') {
    const maxOrder = item.modifiers.reduce((max, m) => Math.max(max, m.order ?? 0), 0);
    normalized.order = maxOrder + 1;
  }

  item.modifiers.push(normalized);

  cart.updatedAt = new Date();
  await cart.save();

  return cart;
}


/**
 * Apply a pricing modifier (e.g., discount, tax) to all items in the cart.
 *
 * If the modifier's `order` is not provided, it will be auto-incremented per item.
 *
 * @param modifier - Modifier definition to apply (must include type and value; target is optional and defaults to "subtotal")
 * @throws Error if cart not found, or modifier is invalid
 */
async applyModifierToAllItems(modifier: I_CartModifier): Promise<I_Cart> {
  const cart = await this.getOrThrow();
  const normalizedBase = normalizeModifier(modifier);

  // Validate before applying
  if (!isModifierValid(normalizedBase)) {
    throw new Error('Invalid modifier object');
  }

  for (const item of cart.items) {
    item.modifiers ??= [];

    const exists = item.modifiers.find(
      m => m.type === normalizedBase.type && m.name === normalizedBase.name
    );
    if (exists) continue;

    const modifierToApply = { ...normalizedBase };

    // Assign order per item if not explicitly set
    if (typeof modifierToApply.order !== 'number') {
      const maxOrder = item.modifiers.reduce((max, m) => Math.max(max, m.order ?? 0), 0);
      modifierToApply.order = maxOrder + 1;
    }

    item.modifiers.push(modifierToApply);
  }

  cart.updatedAt = new Date();
  await cart.save();

  return cart;
}


/**
 * Remove a specific modifier from a cart item by its name.
 * 
 * @param modifierName - The name of the modifier to remove
 * @returns Updated cart document
 * @throws Error if cart, item, or modifier not found
 */
async removeItemModifier(modifierName: string): Promise<I_Cart> {
  const cart = await this.getOrThrow();
  const item = await this.findItemOrThrow();

  if (!Array.isArray(item.modifiers) || item.modifiers.length === 0) {
    throw new Error('No modifiers found.');
  }

  const initialLength = item.modifiers.length;
  item.modifiers = item.modifiers.filter(m => m.name !== modifierName);

  if (item.modifiers.length === initialLength) {
    throw new Error(`Modifier "${modifierName}" not found.`);
  }

  cart.updatedAt = new Date();
  await cart.save();

  return cart;
}

/**
 * Remove all modifiers from a specific cart item.
 *
 * @returns Updated cart document
 * @throws Error if cart or item not found
 */
async clearItemModifiers(): Promise<I_Cart> {
  const cart = await this.getOrThrow();
  const item = await this.findItemOrThrow();

  if (!item.modifiers || item.modifiers.length === 0) {
    throw new Error('No modifiers to clear for this item');
  }

  item.modifiers = [];
  cart.updatedAt = new Date();
  await cart.save();

  return cart;
}

/**
 * Retrieve all modifiers applied to a specific cart item.
 *
 * @returns Array of modifiers for the item
 * @throws Error if cart or item not found
 */
async getItemModifiers(): Promise<I_CartModifier[]> {
  const item = await this.findItemOrThrow();
  return item.modifiers || [];
}

/**
 * Get one or more modifiers by name(s) for the current item.
 *
 * @param nameOrNames - Single name or array of names
 * @returns Matching modifiers array (could be empty)
 * @throws Error if cart or item not found
 */
async getItemModifierByName(name: string): Promise<I_CartModifier | undefined>;
async getItemModifierByName(names: string[]): Promise<I_CartModifier[]>;
async getItemModifierByName(nameOrNames: string | string[]): Promise<I_CartModifier | undefined | I_CartModifier[]> {
  const modifiers = await this.getItemModifiers();

  if (Array.isArray(nameOrNames)) {
    return modifiers.filter(mod => mod.name && nameOrNames.includes(mod.name));
  }

  return modifiers.find(mod => mod.name === nameOrNames);
}

/**
 * Get all modifiers by type(s) for the current item.
 *
 * @param typeOrTypes - Single type or array of types (e.g., 'discount', 'tax')
 * @returns Array of matching modifiers
 * @throws Error if cart or item not found
 */
async getItemModifiersByType(typeOrTypes: string | string[]): Promise<I_CartModifier[]> {
  const types = Array.isArray(typeOrTypes) ? typeOrTypes : [typeOrTypes];
  const modifiers = await this.getItemModifiers();
  return modifiers.filter(mod => mod.type && types.includes(mod.type));
}

/**
 * Checks if the item has at least one modifier matching the given name and/or type.
 *
 * @param filter - Object containing:
 *   - `name`: a string or array of strings to match modifier names.
 *   - `type`: a string or array of strings to match modifier types.
 *   - `match`: 'any' (default) to match either `name` or `type`, or 'all' to require both in the same modifier.
 * @returns Promise<boolean>
 *
 * @example
 * await cart.item(itemId).hasItemModifier({ name: "discount" });
 * await cart.item(itemId).hasItemModifier({ type: "tax" });
 * await cart.item(itemId).hasItemModifier({ name: ["discount", "offer"] });
 * await cart.item(itemId).hasItemModifier({ name: "discount", type: "tax", match: "any" }); // true if any match
 * await cart.item(itemId).hasItemModifier({ name: "discount", type: "tax", match: "all" }); // true only if both match in same modifier
 */
async hasItemModifier(
  filter: {
    name?: string | string[];
    type?: string | string[];
    match?: 'any' | 'all';
  }
): Promise<boolean> {
  const modifiers = await this.getItemModifiers();
  const matchType = filter.match || 'any';

  return modifiers.some((mod) => {
    const nameMatch = filter.name
      ? Array.isArray(filter.name)
        ? filter.name.includes(mod.name!)
        : mod.name === filter.name
      : false;

    const typeMatch = filter.type
      ? Array.isArray(filter.type)
        ? filter.type.includes(mod.type)
        : mod.type === filter.type
      : false;

    if (matchType === 'all') {
      return nameMatch && typeMatch;
    } else {
      return nameMatch || typeMatch;
    }
  });
}

/**
 * Reorder the modifiers of a specific cart item based on the provided modifier names.
 * Must be chained after `.owner(userId).item(itemId)` to set the context.
 *
 * Any modifiers not included in the `names` array will be appended at the end in original order.
 * This method reads the cart item using `getContent()` and performs the write update on the document.
 *
 * @param names - Array of modifier names specifying the desired order.
 * @returns Promise<boolean> - Returns true if reorder was successful.
 * @throws Error if cart or item is not found, or if no item is selected.
 *
 * @example
 * await Cart.owner(userId).item(itemId).reorderItemModifiers(['Coupon', 'Shipping']);
 */
async reorderItemModifiers(names: string[]): Promise<boolean> {
  const item = await this.findItemOrThrow();

  if (!Array.isArray(item.modifiers)) return false;

  const ordered: I_CartModifier[] = [];
  const remaining = [...item.modifiers];

  // Reorder modifiers based on the given names
  for (const name of names) {
    const index = remaining.findIndex(mod => mod.name === name);
    if (index !== -1) {
      ordered.push(remaining.splice(index, 1)[0]);
    }
  }

  // Append modifiers not mentioned in names
  ordered.push(...remaining);

  // Reassign order values
  ordered.forEach((mod, index) => {
    mod.order = index + 1;
  });

  // Save updated modifiers back to the item
  item.modifiers = ordered;

  const cart = await this.getOrThrow();
  cart.updatedAt = new Date();
  await cart.save();

  return true;
}

/**
 * Updates a specific modifier on the selected cart item by name.
 *
 * This method allows partial updates to any field of a modifier (e.g. value, type, operator, metadata).
 * It ensures the cart and item exist, and then applies the updates before saving.
 *
 * @param name - The name of the modifier to update.
 * @param data - A partial object containing fields to update on the modifier.
 * @returns Promise<boolean> - Returns true if the update was successful.
 * @throws Error if the cart, item, or modifier is not found.
 */
async updateItemModifier(name: string, modifier: Partial<I_CartModifier>) {
  if (!this._itemId) throw new Error('No item selected');

  const cart = await this.getOrThrow();

  if (!Array.isArray(cart.items)) {
    throw new Error('Cart items not found or invalid');
  }

  const itemIndex = cart.items.findIndex(i => i.itemId.equals(this._itemId));
  if (itemIndex === -1) throw new Error('Item not found');

  const item = cart.items[itemIndex];

  if (!Array.isArray(item.modifiers)) {
    throw new Error('Modifiers not found on item');
  }

  const existingModifierIndex = item.modifiers.findIndex(m => m.name === name);
  if (existingModifierIndex === -1) {
    throw new Error(`Modifier "${name}" not found on item`);
  }

  // Validate the incoming modifier update
  const issues: ModifierValidationIssue[] = [];

  const typeIssue = validateModifierType(modifier.type);
  if (typeIssue) issues.push(typeIssue);

  const valueIssue = validateModifierValue(modifier.value);
  if (valueIssue) issues.push(valueIssue);

  const targetIssue = validateModifierTarget(modifier.target);
  if (targetIssue) issues.push(targetIssue);

  const orderIssue = validateModifierOrder(modifier.order);
  if (orderIssue) issues.push(orderIssue);

  if (issues.length) {
    throw new Error(
      `Invalid modifier update for "${name}":\n` +
        issues.map(i => `- ${i.reason} (e.g., ${i.example})`).join('\n')
    );
  }

  // Merge the update into the existing modifier
  const existingModifier = item.modifiers[existingModifierIndex];
  Object.assign(existingModifier, modifier);

  // Update timestamp and save the cart
  cart.updatedAt = new Date();
  await cart.save();

  return cart;
}

/**
 * Evaluate and apply pricing modifiers to a cart item.
 *
 * Returns a detailed summary including subtotal, total, and modifier impact.
 *
 * @returns {Promise<{
*   original: number;
*   modified: number;
*   differenceAmount: number;
*   differencePercent: number;
*   appliedModifiers: Array<{
*     name: string;
*     type: string;
*     operator: 'add' | 'subtract';
*     value: string | number;
*     amount: number;
*     differenceAmount: number;
*     differencePercent: number;
*     isFlat: boolean;
*     isPercent: boolean;
*     target: 'subtotal' | 'total';
*     order?: number;
*   }>
* }>}
*/
async evaluateItemModifiers(): Promise<{
  subtotal: number;
  total: number;
  differenceAmount: number;
  differencePercent: number;
  appliedModifiers: AppliedModifier[];
}> {
  const item = await this.findItemOrThrow();

  const base = parseFloat((item.price * item.quantity).toFixed(2));
  let total = base;

  const appliedModifiers: AppliedModifier[] = [];

  const modifiers = (item.modifiers || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  for (const mod of modifiers) {
    const value = typeof mod.value === 'string' ? mod.value.trim() : mod.value.toString();
    const operator = value.startsWith('-') ? 'subtract' : 'add';
    const isPercent = value.toString().includes('%');
    const isFlat = !isPercent;

    const numericValue = parseFloat(value.replace('%', '').replace('+', '').replace('-', ''));
    const amount = parseFloat(
      (isPercent ? (total * numericValue) / 100 : numericValue).toFixed(2)
    );

    const finalAmount = operator === 'subtract' ? -amount : amount;
    total = parseFloat((total + finalAmount).toFixed(2));

    const differenceAmount = parseFloat(Math.abs(amount).toFixed(2));
    const differencePercent = parseFloat(((differenceAmount / base) * 100).toFixed(2));

    appliedModifiers.push({
      name: mod.name,
      type: mod.type,
      operator,
      value: mod.value,
      differenceAmount,
      differencePercent,
      isFlat,
      isPercent,
      target: mod.target ?? 'subtotal',
      order: mod.order,
    });
  }

  const differenceAmount = parseFloat((base - total).toFixed(2));
  const differencePercent = parseFloat(((differenceAmount / base) * 100).toFixed(2));

  return {
    subtotal: base,
    total,
    differenceAmount,
    differencePercent,
    appliedModifiers,
  };
}


async getItemSubTotal(): Promise<number> {
  return (await this.evaluateItemModifiers()).subtotal;
}

async getItemTotal(): Promise<number> {
  return (await this.evaluateItemModifiers()).total;
}

async moveTo(target: 'cart' | 'save_for_later'): Promise<I_Cart> {
  if (this.instance === target) {
    throw new Error(`Source and target must be different. Cannot move item from "${this.instance}" to "${target}".`);
  }

  const currentCart = await this.getOrThrow();
  const item = await this.findItemOrThrow();

  const CartModel = getCartModel();
  const query: Record<string, unknown> = {
    instance: target,
    ...this.owner,
  };

  let targetCart = await CartModel.findOne(query);

  if (!targetCart) {
    targetCart = new CartModel({
      ...this.owner,
      instance: target,
      items: [],
    });
  }

  // Check if the item already exists in the target cart
  const existingItem = targetCart.items.find(
    (i) =>
      i.itemId.toString() === item.itemId.toString() &&
      JSON.stringify(i.attributes || {}) === JSON.stringify(item.attributes || {})
  );

  if (existingItem) {
    // Merge quantity into existing item
    existingItem.quantity += item.quantity;
  } else {
    // Push the new item
    targetCart.items.push(item);
  }

  targetCart.updatedAt = new Date();

  // Save target cart first
  await targetCart.save();

  // Now safely remove the item from the source cart
  currentCart.items = currentCart.items.filter(
    (i) => i.itemId.toString() !== this._itemId!.toString()
  );
  currentCart.updatedAt = new Date();

  await currentCart.save();

  return targetCart;
}

async applyModifier(modifier: I_CartModifier): Promise<I_Cart> {
  const cart = await this.getOrThrow();

  const normalized = normalizeModifier(modifier);

  // Validate modifier
  const validationResult = isModifierValid(normalized);
  if (!validationResult.valid) {
    throw new Error(`Invalid modifier: ${JSON.stringify(validationResult.details)}`);
  }

  cart.modifiers ??= [];

  const duplicate = cart.modifiers.find(m => m.type === normalized.type && m.name === normalized.name);
  if (duplicate) throw new Error(`Modifier '${normalized.name}' already applied.`);

  // Auto-set order if missing
  if (typeof normalized.order !== 'number') {
    const maxOrder = cart.modifiers.reduce((max, m) => Math.max(max, m.order ?? 0), 0);
    normalized.order = maxOrder + 1;
  }

  cart.modifiers.push(normalized);

  cart.updatedAt = new Date();
  await cart.save();

  return cart;
}


async removeModifier(modifierName: string): Promise<I_Cart> {
  const cart = await this.getOrThrow();

  if (!cart.modifiers || cart.modifiers.length === 0) {
    throw new Error(`No modifiers found on ${this.instance}.`);
  }

  const initialLength = cart.modifiers.length;
  cart.modifiers = cart.modifiers.filter(m => m.name !== modifierName);

  if (cart.modifiers.length === initialLength) {
    throw new Error(`Modifier "${modifierName}" not found.`);
  }

  cart.updatedAt = new Date();
  await cart.save();

  return cart;
}

async removeModifierByType(type: string): Promise<I_Cart> {
  const cart = await this.getOrThrow();

  if (!cart.modifiers || cart.modifiers.length === 0) {
    return cart;
  }

  const originalCount = cart.modifiers.length;
  const newModifiers = cart.modifiers.filter(mod => mod.type !== type);

  if (newModifiers.length === originalCount) {
    throw new Error(`No modifier found with type '${type}'`);
  }

  cart.modifiers = newModifiers;
  cart.markModified('modifiers');

  cart.updatedAt = new Date();
  await cart.save();

  return cart;
}

async clearModifiers(): Promise<I_Cart> {
  const cart = await this.getOrThrow();

  cart.modifiers = [];
  cart.markModified('modifiers');

  cart.updatedAt = new Date();
  await cart.save();

  return cart;
}

async getModifiers(): Promise<I_CartModifier[]> {
  const cart = await this.getOrThrow();
  return cart.modifiers ?? [];
}

async getModifier(name: string | string[]): Promise<I_CartModifier[]> {
  const cart = await this.getOrThrow();
  const modifiers = cart.modifiers ?? [];

  const names = Array.isArray(name) ? name.map(n => n.toLowerCase()) : [name.toLowerCase()];

  return modifiers.filter(m => m.name && names.includes(m.name.toLowerCase()));
}


async getModifierByType(type: string | string[]): Promise<I_CartModifier[]> {
  const cart = await this.getOrThrow();
  const modifiers = cart.modifiers ?? [];

  const types = Array.isArray(type) ? type : [type];

  return modifiers.filter(m => types.includes(m.type));
}

/**
 * Checks if the cart has at least one modifier matching the given name and/or type.
 *
 * @param filter - Object containing:
 *   - `name`: a string or array of strings to match modifier names.
 *   - `type`: a string or array of strings to match modifier types.
 *   - `match`: 'any' (default) to match either `name` or `type`, or 'all' to require both in the same modifier.
 * @returns boolean
 *
 * @example
 * cart.hasModifier({ name: "discount" });
 * cart.hasModifier({ type: "shipping" });
 * cart.hasModifier({ name: ["coupon", "gift"] });
 * cart.hasModifier({ name: "tax", type: "service", match: "any" });
 * cart.hasModifier({ name: "tax", type: "service", match: "all" });
 */
async hasModifier(filter: {
  name?: string | string[];
  type?: string | string[];
  match?: 'any' | 'all';
}
): Promise<boolean> {
  const cart = await this.getOrThrow();
  const modifiers = cart.modifiers ?? [];

  const matchType = filter.match || 'any';

  return modifiers.some((mod) => {
    const nameMatch = filter.name
      ? Array.isArray(filter.name)
        ? filter.name.includes(mod.name!)
        : mod.name === filter.name
      : false;

    const typeMatch = filter.type
      ? Array.isArray(filter.type)
        ? filter.type.includes(mod.type)
        : mod.type === filter.type
      : false;

    return matchType === 'all' ? nameMatch && typeMatch : nameMatch || typeMatch;
  });
}

/**
 * Reorder the cart-level modifiers based on the provided modifier names.
 * Must be chained after `.owner(userId)` to set the context.
 *
 * Any modifiers not included in the `names` array will be appended at the end in original order.
 * This method reads the cart using `getOrThrow()` and performs the write update on the document.
 *
 * @param names - Array of modifier names specifying the desired order.
 * @returns Promise<boolean> - Returns true if reorder was successful.
 * @throws Error if cart is not found.
 *
 * @example
 * await Cart.owner(userId).reorderModifiers(['Tax', 'Shipping']);
 */
async reorderModifiers(names: string[]): Promise<boolean> {
  const cart = await this.getOrThrow();

  if (!Array.isArray(cart.modifiers)) return false;

  const ordered: I_CartModifier[] = [];
  const remaining = [...cart.modifiers];

  // Reorder modifiers based on the given names
  for (const name of names) {
    const index = remaining.findIndex(mod => mod.name === name);
    if (index !== -1) {
      ordered.push(remaining.splice(index, 1)[0]);
    }
  }

  // Append remaining modifiers that were not explicitly ordered
  ordered.push(...remaining);

  // Reassign the order property
  ordered.forEach((mod, index) => {
    mod.order = index + 1;
  });

  // Save updated modifier order to cart
  cart.modifiers = ordered;
  cart.updatedAt = new Date();
  await cart.save();

  return true;
}


async updateModifier(name: string, modifier: Partial<I_CartModifier>) {
  const cart = await this.getOrThrow();

  if (!Array.isArray(cart.modifiers)) {
    throw new Error('Modifiers not found or invalid');
  }

  const existingModifierIndex = cart.modifiers.findIndex(m => m.name === name);
  if (existingModifierIndex === -1) {
    throw new Error(`Modifier "${name}" not found on cart`);
  }

  // Validate the incoming modifier update
  const issues: ModifierValidationIssue[] = [];

  const typeIssue = validateModifierType(modifier.type);
  if (typeIssue) issues.push(typeIssue);

  const valueIssue = validateModifierValue(modifier.value);
  if (valueIssue) issues.push(valueIssue);

  const targetIssue = validateModifierTarget(modifier.target);
  if (targetIssue) issues.push(targetIssue);

  const orderIssue = validateModifierOrder(modifier.order);
  if (orderIssue) issues.push(orderIssue);

  if (issues.length) {
    throw new Error(
      `Invalid modifier update for "${name}":\n` +
        issues.map(i => `- ${i.reason} (e.g., ${i.example})`).join('\n')
    );
  }

  // Merge the update into the existing modifier
  const existingModifier = cart.modifiers[existingModifierIndex];
  Object.assign(existingModifier, modifier);

  // Update timestamp and save the cart
  cart.updatedAt = new Date();
  await cart.save();

  return cart;
}

async evaluateModifiers(): Promise<{
  subtotal: number;
  total: number;
  differenceAmount: number;
  differencePercent: number;
  appliedModifiers: AppliedModifier[];
}> {
  const cart = await this.getOrThrow(); // Assuming you have this method
  const items = cart.items || [];

  // Step 1: Calculate subtotal (sum of item prices × quantity)
  const subtotal = parseFloat(
    items.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)
  );

  let total = subtotal;
  const appliedModifiers: AppliedModifier[] = [];

  // Step 2: Sort cart-level modifiers by order
  const modifiers = (cart.modifiers || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Step 3: Apply each modifier
  for (const mod of modifiers) {
    const value = typeof mod.value === 'string' ? mod.value.trim() : mod.value.toString();
    const operator = value.startsWith('-') ? 'subtract' : 'add';
    const isPercent = value.includes('%');
    const isFlat = !isPercent;

    const numericValue = parseFloat(value.replace('%', '').replace('+', '').replace('-', ''));
    const amount = parseFloat(
      (isPercent ? (total * numericValue) / 100 : numericValue).toFixed(2)
    );

    const finalAmount = operator === 'subtract' ? -amount : amount;
    total = parseFloat((total + finalAmount).toFixed(2));

    const differenceAmount = parseFloat(Math.abs(amount).toFixed(2));
    const differencePercent = parseFloat(((differenceAmount / subtotal) * 100).toFixed(2));

    appliedModifiers.push({
      name: mod.name,
      type: mod.type,
      operator,
      value: mod.value,
      differenceAmount,
      differencePercent,
      isFlat,
      isPercent,
      target: mod.target ?? 'subtotal',
      order: mod.order,
    });
  }

  const differenceAmount = parseFloat((subtotal - total).toFixed(2));
  const differencePercent = parseFloat(((differenceAmount / subtotal) * 100).toFixed(2));

  return {
    subtotal,
    total,
    differenceAmount,
    differencePercent,
    appliedModifiers,
  };
}

async getSubTotal(): Promise<number> {
  const cartDetails = await this.getCartDetails();
  if (!cartDetails) return 0;
  return cartDetails.summary.modifiedSubtotal;
}


async getTotal(): Promise<number> {
  const cartDetails = await this.getCartDetails();
  if (!cartDetails) return 0; // or throw an error if cart must exist
  return cartDetails.summary.finalTotal;
}

/** Get the number of distinct items in the cart */
async getItemCount(): Promise<number> {
  const cart = await this.getOrThrow();
  return cart.items.length;
}


/** Get the total quantity of all items in the cart */
async getTotalQuantity(): Promise<number> {
  const cart = await this.getOrThrow();
  const totalQty = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  return totalQty;
}

/** Get the quantity of a specific item by itemId */
async getItemQuantity(itemId: string): Promise<number> {
  const cart = await this.getOrThrow();
  const item = cart.items.find(i => i.itemId.equals(itemId));
  return item?.quantity || 0;
}

async getCartDetails() {
  // 1. get cart detail
  const cart = await this.getCart();
  if (!cart) return false;
  

  const cartData = cart.toObject();
  const userId = cartData.user;
  const sessionId = cartData.sessionId || null;
  // const items = cart.items || [];

  // 2. Evaluate cart-level modifiers
  const cartDetails = _getCartDetails(cartData);

  return {
    userId,
    sessionId,
    ...cartDetails
  }

}




//class BaseService end
}