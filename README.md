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
- [Installation & Setup](#installation-and-setup)
- [Environment Variables](#environment-variables)
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

## Installation & Setup

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

## Modifiers

Cartino supports **modifiers**, which allow you to apply discounts, fees, or other adjustments to **items** or the **entire cart**. Modifiers provide flexibility for promotions, extra services, and custom pricing logic.

There are **two types of modifiers**:

---

### 1. Item-Level Modifiers
Modifiers applied to **specific cart items**.

- **Examples:** `"10% Off"`, `"Gift Wrap"`, `"Extra Warranty"`.
- **Usage:**

```ts
// Apply modifier
await Cart.item(itemId).applyItemModifier({
      name: 'Shipping Cost',
      value: -200,
      type: 'shipping',
      target: 'total',
      order: 2,
      metadata: { region: 'North America', key_1:'value 1' }
    }, req);

// Remove a modifier
await Cart.item(itemId).removeItemModifier("Shipping Cost");

// Update a modifier
await Cart.item(itemId).updateItemModifier("Gift Wrap", { name: "Premium Gift Wrap" });

// Reorder modifiers
await Cart.item(itemId).reorderItemModifiers(["Gift Wrap", "10% Off"]);

// Get modifiers
const modifiers = await Cart.item(itemId).getItemModifiers();
const specificModifier = await Cart.item(itemId).getItemModifierByName("Gift Wrap");
const hasModifier = await Cart.item(itemId).hasItemModifier({ type: "discount", name: "10% Off" });
```

### 2. Cart-Level Modifiers
Modifiers applied to the entire cart.

- **Examples:** `"Black Friday Discount"`, `"Shipping Fee"`.

- **Usage:**
```ts
await Cart.applyModifier({ type: "discount", name: "Black Friday 20%" });
// Remove a modifier
await Cart.removeModifier("Black Friday 20%");

// Remove by type
await Cart.removeModifierByType("shipping");

// Clear all modifiers
await Cart.clearModifiers();

// Reorder modifiers
await Cart.reorderModifiers(["Black Friday 20%", "Express Shipping"]);

// Get modifiers
const modifiers = await Cart.getModifiers();
const specificModifiers = await Cart.getModifier(["Black Friday 20%", "Express Shipping"]);
const hasDiscount = await Cart.hasModifier({ type: "discount" });
const tax = await Cart.owner(userId).getModifierByType('tax');
const taxes = await Cart.owner(userId).getModifierByType(['TAX 1', 'TAX 2']);

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
