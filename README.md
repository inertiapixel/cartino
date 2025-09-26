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

```bash
import { Cartino, cartinoMiddleware } from './lib/cartino';

app.use(cartinoMiddleware);
```

Merge guest cart with authenticated user (call after login success):
```bash
await Cartino.mergeCart(req, res, user._id);
```

Detach user session (call after logout):
```bash
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
```bash
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
```bash
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
  },
  associatedModel: {
    modelName: "Product",
    data: product, // keep product data linked
  } //associating of model with cart is optional
});

```

#### 2. Without Owner (Auto-pick from session req.cartino)

```bash
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
  },
  associatedModel: {
    modelName: "Product",
    data: product,
  }
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
```bash
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
```bash
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
```bash
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
```bash
await Cart.owner(sessionId).remove(itemId, req);

// OR with request auto-detection
await Cart.remove(itemId, req);
```
>Just swap `Cart` with `Wishlist` or `SaveForLater` — methods remain identical.

## Move Items Between Lists

You can easily move items between Cart, SaveForLater, and Wishlist.

```bash
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

## Get Cart Details
```bash
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
