<p align="center">
  <br/>
  <a href="https://www.inertiapixel.com/" target="_blank"><img width="150px" src="https://www.inertiapixel.com/images/logo-min.svg" /></a>
  <h3 align="center">@inertiapixel/cartino</h3>
  <p align="center">Node.js + Next.js Auth for MERN</p>
  <p align="center">Open Source. Full Stack</p>
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

## License

MIT © [inertiapixel](https://github.com/inertiapixel)

---

## Related Projects

- [`@inertiapixel/nextjs-auth`](https://github.com/inertiapixel/nextjs-auth) — Frontend auth package for React/Next.js
- [`@inertiapixel/nextjs-auth`](https://github.com/inertiapixel/nodejs-auth) — Backend auth package for Nodejs / Express Js / TypeScript
- [`@inertiapixel/react-icons`](https://github.com/inertiapixel/react-icons) — React icons set


**Crafted in India by [InertiaPixel](https://www.inertiapixel.com/) 🇮🇳**
