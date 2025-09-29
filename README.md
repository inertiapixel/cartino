              <p align="center">
  <br/>
  <a href="https://www.inertiapixel.com/" target="_blank"><img width="150px" src="https://www.inertiapixel.com/images/logo-min.svg" /></a>
  <h3 align="center">@inertiapixel/cartino</h3>
  <p align="center">Open Source</p>
</p>

**InertiaPixel Cartino** is a lightweight, easy-to-use cart management system for Node.js and Mongoose. It allows quick integration of cart functionality in e-commerce apps with features like adding, updating, removing items, and calculating totals. Fast, flexible, and perfect for simple or complex e-commerce sites.


![npm](https://img.shields.io/npm/v/@inertiapixel/cartino)
![MIT License](https://img.shields.io/npm/l/@inertiapixel/cartino)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)
![Open Source](https://img.shields.io/badge/Open%20Source-✔️-blue)
![TypeScript](https://img.shields.io/badge/Built%20with-TypeScript-3178c6?logo=typescript)


---

## Table of Contents

- [Why This Exists](#why-this-exists)
- [Features](#features)
- [Installation and Setup](#installation-and-setup)
- [Quick Start](#quick-start)
- [License](#license)
- [Related Projects](#related-projects)

---

## Why This Exists
While building a MERN ecommerce project, I couldn’t find a well-structured cart management package.
So, I created my own under the inertiapixel scope to work seamlessly together.


## Features

Cartino ships with 50+ useful methods that help developers manage cart operations seamlessly.

- Simple and intuitive API for cart management
- Chainable methods (`add()`, `remove()`, `update()`, `clear()` etc...)
- Automatic subtotal and total calculation
- Support for multiple users (per-session or per-user cart)
- Persistent storage ready (bring your own database)
- Lightweight and TypeScript-ready
- Works seamlessly with other @inertiapixel packages

---

## Installation and Setup

[![npm version](https://img.shields.io/npm/v/@inertiapixel/cartino)](https://www.npmjs.com/package/@inertiapixel/cartino)

Install the package:

```bash
npm install @inertiapixel/cartino
```

Run the initializer to create the required files:
```bash
npx cartino-init
```

This will generate:

- src/models/CartModel.ts
- src/lib/cartino.ts

### Setup in your server
Import the library and middleware in your index.ts or server.ts:

```ts
import { Cartino, cartinoMiddleware } from './lib/cartino';

app.use(cartinoMiddleware);
```

Merge guest cart with authenticated user (call after login success):
```ts
await Cartino.mergeCart(req, res, user._id);
```

Detach user session (call after logout):
```ts
await Cartino.detachUser(req, res);
```

> **⚠️ Important:**  
> Always call `mergeCart` after login and `detachUser` after logout.  
> These steps are essential for correct cart session management.

### Cartino is successfully installed and set up!

---
## Quick Start
After completing the installation and setup, you can start using Cartino right away.

#### IMPORTANT NOTE

**How req.cartino works**
```ts
const { userId, sessionId } = req.cartino;
```
- **userId**
  - **Guest:** Returns `undefined` if the user is not logged in.
  - **Logged-in:** The `_id` of the currently logged-in user.

- **sessionId**
  - A unique session identifier, e.g., `cartino_ABCXYZ`. Always present, even for guests.
  - After logout, the `sessionId` is rotated to a new value.

**Using .owner(sessionId) vs Without**

Almost every method in `Cart`, `Wishlist`, or `SaveForLater` can be used with or without `.owner(sessionId)`.

- **With** `.owner(sessionId)` → Explicitly works with a specific user's cart/session.

- **Without** `.owner(sessionId)` → Automatically resolves the cart using the request/session (you must pass req as the last argument).

### Add item to Cart
Cartino supports two ways of adding items:
#### 1. With Session/User Owner (no login required)
```ts
import { Cart } from '@/lib/cartino';

const product = await Product.findById(itemId).lean();
const sessionId = req.cartino.sessionId;

await Cart.owner(sessionId).add({
  itemId: product._id,
  quantity: 2,
  price: product.price,
  name: product.name,
  attributes: {
    variantId: product.variant._id,
    sku: product.variant.sku,
    slug: product.slug,
    image: product.variant.image,
  }, //attributes is optional
  associatedModel: {
    modelName: "Product",
    data: product, // keep product data linked
  } //associating of model with cart is optional
});

```

#### 2. Without Owner (Auto-pick from session req.cartino)

```ts
import { Cart } from '@/lib/cartino';
const product = await Product.findById(itemId).lean();

await Cart.add({
  itemId: product._id,
  quantity: 2,
  price: product.price,
  name: product.name,
  attributes: {
    variantId: product.variant._id,
    sku: product.variant.sku,
    slug: product.slug,
    image: product.variant.image,
  }, //attributes is optional
  associatedModel: {
    modelName: "Product",
    data: product,
  } //associating of model with cart is optional
}, req);

```
- Use Cart.owner(sessionId) when you have a user/session id.
- Use Cart.add(..., req) when you want Cartino to pull the session id automatically from req.

Bonus: You can associate the full product model for future reference and its optional:
```ts
associatedModel: {
  modelName: "Product",
  data: product
}
```

### ❤️ Wishlist & 🕒 Save For Later
Just like `Cart`, you can manage Wishlist and SaveForLater items with the same API style.

#### Add to Wishlist
```ts
await Wishlist.owner(sessionId).add({
  itemId: product._id,
  name: product.name,
  price: product.price
});

// OR with request auto-detection
await Wishlist.add({
  itemId: product._id,
  name: product.name,
  price: product.price
}, req);
```

#### Add to SaveForLater
```ts
await SaveForLater.owner(sessionId).add({
  itemId: product._id,
  name: product.name,
  price: product.price
});

// OR with request auto-detection
await SaveForLater.add({
  itemId: product._id,
  name: product.name,
  price: product.price
}, req);
```
### Update
```ts
await Cart.owner(sessionId).update(itemId, {
      quantity,
      name: product.name,
      price: product.price
});

// OR with request auto-detection
await Cart.update(itemId, {
      quantity,
      name: product.name,
      price: product.price
}, req);

```
### Remove
```ts
await Cart.owner(sessionId).remove(itemId);

// OR with request auto-detection
await Cart.remove(itemId, req);
```
>Just swap `Cart` with `Wishlist` or `SaveForLater` — methods remain identical.

### isEmpty

```ts
/**
 * Check if the cart is empty.
 *
 * @return boolean
 */
await Cart.owner(sessionId).isEmpty();
await Cart.isEmpty(req);

```
### countItems

```ts
/**
 * Get the number of distinct items in the cart (ignores quantity).
 *
 * @return number
 */
await Cart.owner(sessionId).countItems();
await Cart.countItems(req);
```

### countTotalQuantity

```ts
/**
 * Get the total quantity of all items in the cart.
 * (e.g., 2 of Product A + 3 of Product B = 5)
 *
 * @return number
 */
await Cart.owner(sessionId).countTotalQuantity();
await Cart.countTotalQuantity(req);
```
### incrementQuantity

```ts
/**
 * Increase the quantity of a specific cart item by a given value.
 *
 * @param value - Number to increment the quantity by (default is 1)
 * @returns Updated cart document
 */
await Cart.owner(sessionId).item(itemId).incrementQuantity(2);
await Cart.item(itemId).incrementQuantity(2, req);
```

### decrementQuantity

```ts
/**
 * Decrease the quantity of a specific cart item by a given value.
 * If the resulting quantity is 0 or less, the item will be removed.
 *
 * @param value - Number to decrement the quantity by (default is 1)
 * @returns Updated cart document
 */
await Cart.owner(sessionId).item(itemId).decrementQuantity(1);
await Cart.item(itemId).decrementQuantity(1, req);
```

### updateQuantity

```ts
/**
 * Update the quantity of a specific cart item.
 *
 * - Pass a number: sets the absolute quantity.
 * - Pass an object with `relative: true`: adjusts quantity by the given value.
 * - If the resulting quantity is 0 or less, the item will be removed.
 *
 * @param input - Either a number or an object with `relative` and `quantity`
 * @returns Updated cart document
 */
await Cart.owner(sessionId).item(itemId).updateQuantity(5); 
// sets quantity to 5

await Cart.item(itemId).updateQuantity({ relative: true, quantity: 2 }, req); 
// increases quantity by +2

await Cart.item(itemId).updateQuantity({ relative: true, quantity: -3 }, req); 
// decreases quantity by -3
```
### getItemSubTotal

```ts
/**
 * Get the subtotal of a specific cart item before cart-level modifiers.
 * This includes the base price × quantity + any item-level modifiers.
 *
 * @returns number - subtotal of the item
 */
await Cart.owner(sessionId).item(itemId).getItemSubTotal();
await Cart.item(itemId).getItemSubTotal(req);
```
### getItemTotal
```ts
/**
 * Get the total of a specific cart item after applying all item-level modifiers.
 *
 * @returns number - final total of the item
 */
await Cart.owner(sessionId).item(itemId).getItemTotal();
await Cart.item(itemId).getItemTotal(req);
```
### getItemCount

```ts
/**
 * Get the total number of unique items in the cart.
 *
 * @returns number - count of distinct items in the cart
 */
const count = await Cart.owner(sessionId).getItemCount();
console.log(count); 
// Example: 3 (if cart has 3 distinct products)
```

### getTotalQuantity
```ts
/**
 * Get the total quantity of all items in the cart.
 *
 * @returns number - sum of quantities of all items
 */
await Cart.owner(userId).getTotalQuantity();
await Cart.getTotalQuantity(req);
```

### getItemQuantity
```ts
/**
 * Get the quantity of a specific item in the cart by its itemId.
 *
 * @param itemId - The ID of the item to check
 * @returns number - quantity of the specified item, 0 if not found
 */
await Cart.owner(userId).getItemQuantity(itemId);
await Cart.getItemQuantity(itemId, req);
```


### moveTo: Move Items Between Lists

```ts
/**
 * You can easily move items between Cart, SaveForLater, and Wishlist.
 * If the item already exists in the target, quantities are merged.
 *
 * @param target - 'cart' or 'save_for_later' or 'wishlist'
 * @returns Updated target cart document
 */
// Move item from Cart → SaveForLater
const movedToSFL = await Cart.owner(userId).item(itemId).moveTo('save_for_later');
const movedToSFL1 = await Cart.item(itemId).moveTo('save_for_later', req);

// Move item from SaveForLater → Cart
const movedToCart = await SaveForLater.owner(userId).item(itemId).moveTo('cart');
const movedToCart1 = await SaveForLater.item(itemId).moveTo('cart', req);

// Move item from Cart → Wishlist
const movedToWishlist = await Cart.owner(userId).item(itemId).moveTo('wishlist', req);
const movedToWishlist1 = await Cart.item(itemId).moveTo('wishlist');

// Move item from Wishlist → Cart
const movedFromWishlist = await Wishlist.owner(userId).item(itemId).moveTo('cart');
const movedFromWishlist1 = await Wishlist.item(itemId).moveTo('cart', req);
```

- Keeps the same itemId, attributes, and associated model when moving.
- Automatically removes the item from the source list after moving.

### getCartDetails
```ts
/**
 * Get full details of the cart including items, totals, and modifiers.
 *
 * @returns object - cart details with userId, sessionId, items, totals, and applied modifiers
 */
await Cart.owner(userId).getCartDetails();
await Cart.getCartDetails(req);

```

### clear
```ts
/**
 * Removes all items and modifiers from the cart.
 *
 * @returns I_Cart - the updated (now-empty) cart document
 * @throws Error if the cart is not found
 */
await Cart.owner(userId).clear();
await Cart.clear(req);
```

## Modifiers

Cartino supports **modifiers**, which allow you to apply discounts, fees, or other adjustments to **items** or the **entire cart**. Modifiers provide flexibility for promotions, extra services, and custom pricing logic.

There are **two types of modifiers**:

---

### 1. Item-Level Modifiers
Modifiers applied to **specific cart items**.

- **Examples:** `"10% Off"`, `"Gift Wrap"`, `"Extra Warranty"`.
- **Usage:**

### applyItemModifier
```ts
/**
 * Apply a pricing modifier (e.g., discount, tax, shipping) to a specific cart item.
 *
 * Supports value formats like flat amount (e.g., -100, 100) or percentage (e.g., -10%, 10%).
 * If target is not provided, it defaults to 'subtotal'.
 * If order is not provided, it is auto-incremented based on existing modifiers.
 *
 * @param modifier - Modifier to apply (requires type and value; name is optional)
 * @returns I_Cart - updated cart with the modifier applied
 * @throws Error if cart or item not found, or modifier is invalid/duplicate
 */
await Cart.owner(userId).item(itemId).applyItemModifier({ type: 'gift', value: 100 });
await Cart
      .item(itemId)
      .applyItemModifier({
        name: 'GST',
        type: 'TAX',
        value: 600,
        order: 3, // optional
        target: 'total', // optional
        metadata: {
          source: 'tax',
          campaignId: 'add'
        } // optional
      }, req);

await Cart
    .item(itemId)
    .applyItemModifier({
      type: 'coupon',
      value: -1000
    }, req);

await Cart
    .item(itemId)
    .applyItemModifier({
      type: 'BLACK_FRIDAY',
      type: 'coupon',
      value: '-10%'
    },req);

```

### applyModifierToAllItems
```ts
/**
 * Apply a pricing modifier (e.g., discount, tax) to all items in the cart.
 *
 * If the modifier's `order` is not provided, it will be auto-incremented per item.
 *
 * @param modifier - Modifier definition to apply (must include type and value; target is optional and defaults to "subtotal")
 * @returns I_Cart - updated cart with the modifier applied to all items
 * @throws Error if cart not found, or modifier is invalid
 */
await Cart.applyModifierToAllItems({ type: 'discount', name: '10% Off', value: '-10%' }, req);
await Cart.owner(userId).applyModifierToAllItems({ type: 'tax', name: 'GST', value: '5%' });
```

### removeItemModifier
```ts
/**
 * Remove a specific modifier from a cart item by its name.
 * 
 * @param modifierName - The name of the modifier to remove
 * @returns I_Cart - updated cart document after removal
 * @throws Error if cart, item, or modifier not found
 */
await Cart.item(itemId).removeItemModifier('Discount', req);
await Cart.owner(userId).item(itemId).removeItemModifier('Tax');
```

### clearItemModifiers
```ts
/**
 * Remove all modifiers from a specific cart item.
 *
 * @returns I_Cart - updated cart document after clearing modifiers
 * @throws Error if cart or item not found
 */
await Cart.item(itemId).clearItemModifiers(req);
await Cart.owner(userId).item(itemId).clearItemModifiers();
```
### getItemModifiers
```ts
/**
 * Retrieve all modifiers applied to a specific cart item.
 *
 * @returns I_CartModifier[] - array of modifiers for the item
 * @throws Error if cart or item not found
 */
await Cart.item(itemId).getItemModifiers(req);
await Cart.owner(userId).item(itemId).getItemModifiers();
```

### getItemModifierByName
```ts
/**
 * Get one or more modifiers by name(s) for the current item.
 *
 * @param nameOrNames - Single name or array of names
 * @returns I_CartModifier | I_CartModifier[] | undefined - matching modifier(s)
 * @throws Error if cart or item not found
 */

// Single modifier by name
const discountModifier = await Cart.item(itemId).getItemModifierByName('Discount', req);
const discountModifierOwner = await Cart.owner(userId).item(itemId).getItemModifierByName('Discount');

// Multiple modifiers by array of names
const modifiers = await Cart.item(itemId).getItemModifierByName(['Discount', 'Tax'], req);
const modifiersOwner = await Cart.owner(userId).item(itemId).getItemModifierByName(['Discount', 'Tax']);
```

### getItemModifierByType
```ts
/**
 * Get all modifiers by type(s) for the current item.
 *
 * @param typeOrTypes - Single type or array of types (e.g., 'discount', 'tax')
 * @returns Array of matching modifiers
 * @throws Error if cart or item not found
 */
await Cart.item(itemId).getItemModifiersByType('discount',req);
await Cart.owner(userId).item(itemId).getItemModifiersByType(['discount', 'tax']);
```

### hasItemModifier
```ts
/**
 * Check if the item has at least one modifier matching the given name and/or type.
 *
 * @param filter - Object containing:
 *   - `name`: string or array of strings to match modifier names
 *   - `type`: string or array of strings to match modifier types
 *   - `match`: 'any' (default) to match either `name` or `type`, or 'all' to require both in same modifier
 * @returns boolean
 *
 * @example
 * await Cart.item(itemId).hasItemModifier({ name: "discount" }, req);
 * await Cart.item(itemId).hasItemModifier({ type: "tax" });
 * await Cart.item(itemId).hasItemModifier({ name: ["discount","offer"] }, req);
 * await Cart.item(itemId).hasItemModifier({ name: "discount", type: "tax", match: "any" }, req);
 * await Cart.item(itemId).hasItemModifier({ name: "discount", type: "tax", match: "all" }, req);
 */
await Cart.item(itemId).hasItemModifier({ name: "discount" }, req);
await Cart.owner(userId).item(itemId).hasItemModifier({ type: ["tax","fee"] }, req);
```

### reorderItemModifiers
```ts
/**
 * Reorder the modifiers of a specific cart item based on the provided modifier names.
 *
 * Any modifiers not included in the `names` array will be appended at the end in original order.
 * Must be chained after `.owner(userId).item(itemId)` to set the context.
 *
 * @param names - Array of modifier names specifying the desired order.
 * @returns boolean - true if reorder was successful
 * @throws Error if cart or item not found
 *
 */
await Cart.item(itemId).reorderItemModifiers(['Discount', 'Tax', 'Shipping'], req);
await Cart.owner(userId).item(itemId).reorderItemModifiers(['Coupon']);

```

### updateItemModifier
```ts
/**
 * Updates a specific modifier on the selected cart item by name.
 *
 * Allows partial updates to any field of a modifier (e.g., value, type, operator, metadata).
 * Ensures the cart and item exist before applying the updates.
 *
 * @param name - The name of the modifier to update.
 * @param modifier - A partial object containing fields to update.
 * @returns cart - Updated cart document
 * @throws Error if the cart, item, or modifier is not found, or if the update is invalid.
 *
 * @example
 * // Update discount value
 * await Cart.owner(userId).item(itemId).updateItemModifier("Discount", { value: "-20%" });
 *
 * // Change type and target
 * await Cart.item(itemId).updateItemModifier("Tax", { type: "tax", target: "total" }, req);
 *
 * // Update metadata
 * await Cart.owner(userId).item(itemId).updateItemModifier("Coupon", { metadata: { appliedBy: "admin" } });
 */
await Cart.item(itemId).updateItemModifier("Discount", { value: "-50" }, req);
await Cart.owner(userId).item(itemId).updateItemModifier("Tax", { value: "18%", target: "subtotal" });

```

### evaluateItemModifiers

Returns a detailed summary including subtotal, total, difference, and applied modifier breakdown.

```ts
await Cart.owner(userId).item(itemId).evaluateItemModifiers();
await Cart.item(itemId).evaluateItemModifiers(req);
```

| Field               | Type                    | Description                                     |
| ------------------- | ----------------------- | ----------------------------------------------- |
| `name`              | `string`                | Modifier name                                   |
| `type`              | `string`                | Modifier type (discount, tax, shipping, etc.)   |
| `operator`          | `'add' | 'subtract'`   | Operation applied                               |
| `value`             | `string | number`      | Raw modifier value (e.g. `"-10%"`, `"+20"`)     |
| `differenceAmount`  | `number`                | Absolute impact of this modifier                |
| `differencePercent` | `number`                | Percentage impact relative to original subtotal |
| `isFlat`            | `boolean`               | True if flat value                              |
| `isPercent`         | `boolean`               | True if percentage-based                        |
| `target`            | `'subtotal' \| 'total'` | Whether modifier applies before or after total  |
| `order?`            | `number`                | Order of application                            |


### 2. Cart-Level Modifiers
Modifiers applied to the entire cart.

- **Examples:** `"Black Friday Discount"`, `"Shipping Fee"`.

- **Usage:**

### applyModifier
```ts

/**
 * Apply a modifier (discount, tax, fee, coupon, etc.) at the **cart level**.
 *
 * Cart-level modifiers affect the entire cart instead of individual items.
 * Each modifier is validated, normalized, and auto-assigned an order if missing.
 * Duplicate modifiers (same name + type) are not allowed.
 *
 * @param modifier - Modifier object to apply. Must include:
 *   - name   {string}             Unique identifier (e.g., "Discount10").
 *   - type   {string}             Modifier type (e.g., "discount", "tax", "fee").
 *   - value  {string | number}    Modifier value (supports flat or percentage).
 *                                 Example: 100, -50, "10%", "-5%".
 *   - target {"subtotal"|"total"} (optional) Defaults to "subtotal".
 *   - order  {number}             (optional) Application order, auto-incremented if missing.
 *   - metadata : any key value pair
 */

// Apply a 10% discount at cart level
await Cart.owner(userId).applyModifier({
  type: "discount",
  value: "10%"
});

// Apply a fixed shipping fee
await Cart.owner(userId).applyModifier({
  type: "fee",
  value: 50
});

// Trying to apply the same modifier again will throw an error
await Cart.applyItemModifier({
        name: 'GST',
        type: 'TAX',
        value: '600',
        order: 3,
        target: 'total',
        metadata: {
          source: 'tax',
          campaignId: 'add'
        //any key value
        }
      }, req);

```

### removeModifier
```ts
//remove modifer by name
await Cart.owner(userId).removeModifier('GST');
await Cart.removeModifier('GST', req);
```

### removeModifierByType
```ts
// remove modifier by tye
await Cart.owner(userId).removeModifier('tax');
await Cart.removeModifier('tax', req);
```

### clearModifiers
```ts
// clear all modifiers on cart level
await Cart.owner(userId).clearModifiers();
await Cart.clearModifiers(req);
```

### getModifiers
```ts
// get all applied modifiers
await Cart.owner(userId).getModifiers();
await Cart.getModifiers(req);
```

### getModifier
```ts
// get modifier(s) by name
await Cart.owner(userId).getModifier('GST');
await Cart.getModifier('GST', req);

// multiple names
await Cart.owner(userId).getModifier(['GST', 'Discount']);
await Cart.getModifier(['GST', 'Discount'], req);
```

### getModifierByType
```ts
// get modifier(s) by type
await Cart.owner(userId).getModifierByType('tax');
await Cart.getModifierByType('tax', req);

// multiple types
await Cart.owner(userId).getModifierByType(['tax', 'discount']);
await Cart.getModifierByType(['tax', 'discount'], req);
```

### hasModifier
```ts
// check if modifier exists by name
await Cart.owner(userId).hasModifier({ name: 'discount' });
await Cart.hasModifier({ name: 'discount' }, req);

// check if modifier exists by type
await Cart.owner(userId).hasModifier({ type: 'shipping' });
await Cart.hasModifier({ type: 'shipping' }, req);

// multiple names
await Cart.owner(userId).hasModifier({ name: ['coupon', 'gift'] });

// name + type with 'any' (default)
await Cart.owner(userId).hasModifier({ name: 'tax', type: 'service' });

// name + type with 'all' (must match same modifier)
await Cart.owner(userId).hasModifier({ name: 'tax', type: 'service', match: 'all' });
```

### reorderModifiers
```ts
// reorder modifiers by names (others remain in original order)
await Cart.owner(userId).reorderModifiers(['Tax', 'Shipping']);
await Cart.reorderModifiers(['Tax', 'Shipping'], req);
```

### updateModifier
```ts
// update modifier by name
await Cart.owner(userId).updateModifier('Tax', { value: 20 });
await Cart.updateModifier('Tax', { value: 20 }, req);

await Cart.updateModifier('SHPPING', {
      value: '200',
      type: 'shipping',
      target: 'total',
      order: 2,
      metadata: { key:'value' }
    }, req);

```

### evaluateModifiers
```ts
// calculate subtotal, total & applied modifiers
await Cart.owner(userId).evaluateModifiers();
await Cart.evaluateModifiers(req);

/**
{
    "subtotal": 450,
    "total": 450,
    "differenceAmount": 0,
    "differencePercent": 0,
    "appliedModifiers": []
}
*/

```
### getSubTotal
```ts
// get subtotal after item-level modifiers
await Cart.owner(userId).getSubTotal();
await Cart.getSubTotal(req);
```

### getSubTotal
```ts
// get subtotal after item-level modifiers
await Cart.owner(userId).getSubTotal();
await Cart.getSubTotal(req);
```

### getTotal
```ts
// get final total after cart-level modifiers
await Cart.owner(userId).getTotal();
await Cart.getTotal(req);
```

### getItemCount
```ts
// get number of distinct items in cart
await Cart.owner(userId).getItemCount();
await Cart.getItemCount(req);
```

### getTotalQuantity
```ts
// get total quantity of all items
await Cart.owner(userId).getTotalQuantity();
await Cart.getTotalQuantity(req);

```

### getItemQuantity
```ts
// get quantity of a specific item
await Cart.owner(userId).getItemQuantity(itemId);
await Cart.getItemQuantity(itemId, req);

```

### getCartDetails
```ts
// get full cart summary (userId, sessionId, totals, modifiers, etc.)
const details = await Cart.owner(userId).getCartDetails();
const details = await Cart.getCartDetails(req);
//Success: 200
{
    "sessionId": null,
    "summary": {
        "originalSubtotal": 450,
        "modifiedSubtotal": 450,
        "originalTotal": 1550,
        "finalTotal": 1550,
        "totalDifference": 0,
        "totalDifferencePercent": 0,
        "totalItems": 9,
        "totalUniqueItems": 4,
        "totalModifiersCount": 2,
        "isDiscountApplied": false,
        "finalTotalRounded": 1550
    },
    "items": [
        {
            "itemId": "68d2989f039eddcd6036f583",
            "name": "My prod 5",
            "quantity": 3,
            "price": 50,
            "originalSubtotal": 150,
            "modifiersApplied": [],
            "finalTotal": 150
        },
        {
            "itemId": "68d29894039eddcd6036f581",
            "name": "My prod 3",
            "quantity": 2,
            "price": 50,
            "originalSubtotal": 100,
            "modifiersApplied": [],
            "finalTotal": 100
        },
        {
            "itemId": "68d2988d039eddcd6036f580",
            "name": "My prod 2",
            "quantity": 2,
            "price": 50,
            "originalSubtotal": 100,
            "modifiersApplied": [
                {
                    "name": "COUPON",
                    "type": "TAX",
                    "order": 3,
                    "target": "total",
                    "value": "500",
                    "effect": {
                        "before": 100,
                        "after": 600,
                        "differenceAmount": 500,
                        "differencePercent": 500
                    }
                },
                {
                    "name": "GST",
                    "type": "TAX",
                    "order": 3,
                    "target": "total",
                    "value": "600",
                    "effect": {
                        "before": 600,
                        "after": 1200,
                        "differenceAmount": 600,
                        "differencePercent": 100
                    }
                }
            ],
            "finalTotal": 1200
        },
        {
            "itemId": "68d29835039eddcd6036f57f",
            "name": "My prod 1",
            "quantity": 2,
            "price": 50,
            "originalSubtotal": 100,
            "modifiersApplied": [],
            "finalTotal": 100
        }
    ],
    "cartLevelModifiersApplied": [],
    "calculationTimeline": [
        {
            "stage": "item-modifier",
            "itemId": "68d2988d039eddcd6036f580",
            "itemName": "My prod 2",
            "target": "total",
            "modifierName": "COUPON",
            "modifierType": "TAX",
            "before": 100,
            "after": 600,
            "differenceAmount": 500,
            "differencePercent": 500
        },
        {
            "stage": "item-modifier",
            "itemId": "68d2988d039eddcd6036f580",
            "itemName": "My prod 2",
            "target": "total",
            "modifierName": "GST",
            "modifierType": "TAX",
            "before": 600,
            "after": 1200,
            "differenceAmount": 600,
            "differencePercent": 100
        }
    ]
}
```

---

## License

MIT © [inertiapixel](https://github.com/inertiapixel)

---

## Related Projects

- [`@inertiapixel/nextjs-auth`](https://github.com/inertiapixel/nextjs-auth) — Frontend auth package for React/Next.js
- [`@inertiapixel/nodejs-auth`](https://github.com/inertiapixel/nodejs-auth) — Backend auth package for Nodejs / Express Js / TypeScript
- [`@inertiapixel/react-icons`](https://github.com/inertiapixel/react-icons) — React icons set


**Crafted in India by [InertiaPixel](https://www.inertiapixel.com/) 🇮🇳**
