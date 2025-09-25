// src/cli/initCartModel.ts
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';

export async function runInitCommand() {
  console.log('\nWelcome to Inertia Pixel Cartino Init CLI\n');

  const { modelPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'modelPath',
      message: 'Where should the CartModel.ts file be created?',
      default: 'src/models'
    }
  ]);

  const targetModelDir = path.resolve(process.cwd(), modelPath);
  const cartModelPath = path.join(targetModelDir, 'CartModel.ts');

  const libDir = path.resolve(process.cwd(), 'src/lib');
  const cartinoFilePath = path.join(libDir, 'cartino.ts');

  // Ensure model directory exists
  if (!fs.existsSync(targetModelDir)) {
    fs.mkdirSync(targetModelDir, { recursive: true });
    console.log(`Created directory: ${modelPath}`);
  }

  // ---- CartModel.ts ----
  if (fs.existsSync(cartModelPath)) {
    const { shouldReplace } = await inquirer.prompt([
      {
        type: 'list',
        name: 'shouldReplace',
        message: 'CartModel.ts already exists. Do you want to replace it?',
        choices: ['Yes', 'No'],
        default: 'No',
      }
    ]);

    if (shouldReplace === 'Yes') {
      writeCartModel(cartModelPath);
    } else {
      console.log('❌ Skipped CartModel.ts');
    }
  } else {
    writeCartModel(cartModelPath);
  }

  // ---- src/lib/cartino.ts ----
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
    console.log(`Created directory: src/lib`);
  }

  if (fs.existsSync(cartinoFilePath)) {
    const { shouldReplaceLib } = await inquirer.prompt([
      {
        type: 'list',
        name: 'shouldReplaceLib',
        message: 'cartino.ts already exists in src/lib. Replace it?',
        choices: ['Yes', 'No'],
        default: 'No',
      }
    ]);

    if (shouldReplaceLib === 'Yes') {
      writeCartinoFile(cartinoFilePath);
    } else {
      console.log('❌ Skipped cartino.ts');
    }
  } else {
    writeCartinoFile(cartinoFilePath);
  }

  // Final message
  console.log(`\nSetup complete!`);
  console.log(`You can now read the docs & usage guide here:`);
  console.log(`https://www.npmjs.com/package/@inertiapixel/cartino\n`);
}

function writeCartModel(filePath: string) {
  const template = `
import mongoose, { Schema, Types } from 'mongoose';
import { I_Cart } from '@your-scope/cartino';

/**
 * target: 'total': // this modifiers will be applied to cart's subtotal when getSubTotal() is called.
 * target: 'total'; //this modifiers will be applied to cart's total when getTotal() is called.
 * type: 'shipping' | 'tax' | 'discount' | 'wrapping' | 'custom' | 'sale' | 'promo' | etc...;
 */

const ModifierSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    value: { type: String, required: true },
    target: { type: String, enum: ['total', 'subtotal'], default: 'subtotal' },
    order: { type: Number },
    metadata: Schema.Types.Mixed,
  },
  { _id: false }
);

const CartItemSchema = new Schema(
  {
    itemId: { type: Types.ObjectId, required: true },
    name: { type: String },
    quantity: { type: Number, default: 1, min: 1 },
    price: { type: Number, required: true },
    attributes: { type: Schema.Types.Mixed },
    modifiers: [ModifierSchema],
    associatedModel: {
      modelName: { type: String },
      data: { type: Schema.Types.Mixed },
    }
  },
  { _id: false }
);

const CartSchema = new Schema<I_Cart>(
  {
    userId: { type: Types.ObjectId, default: null },
    sessionId: { type: String, default: null },
    instance: {
      type: String,
      enum: ['cart', 'wishlist', 'save_for_later'],
      default: 'cart',
    },
    items: [CartItemSchema],
    modifiers: [ModifierSchema],
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const CartModel = mongoose.model<I_Cart>('Cart', CartSchema);
`.trim();

  fs.writeFileSync(filePath, template);
  console.log(`✔ CartModel.ts created at ${filePath}`);
}

function writeCartinoFile(filePath: string) {
  const template = `
import {
  createCartinoMiddleware,
  Cart,
  Wishlist,
  SaveForLater,
  Cartino
} from '@your-scope/cartino';

import { CartModel } from '@/models/CartModel';

export const cartinoMiddleware = createCartinoMiddleware(CartModel);

export {
  Cart,
  Wishlist,
  SaveForLater,
  Cartino,
};
`.trim();

  fs.writeFileSync(filePath, template);
  console.log(`✔ cartino.ts created at ${filePath}`);
}
