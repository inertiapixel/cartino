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

  const targetDir = path.resolve(process.cwd(), modelPath);

  // Ensure directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`📁 Created directory: ${modelPath}`);
  }

  const filePath = path.join(targetDir, 'CartModel.ts');

  // Handle existing file
  if (fs.existsSync(filePath)) {
    const { shouldReplace } = await inquirer.prompt([
      {
        type: 'list',
        name: 'shouldReplace',
        message: 'CartModel.ts already exists. Do you want to replace it?',
        choices: ['Yes', 'No'],
        default: 'No',
      }
    ]);
    
    if (shouldReplace === 'No') {
      console.log('❌ Operation cancelled. File not replaced.');
      return;
    }
  }

  // Load template from external file (if you move it to `templates` later)
  const template = `
import mongoose, { Schema, Types } from 'mongoose';
import { I_Cart } from '@your-scope/cartino';

/**
 * target: 'total': // this condition will be applied to cart's subtotal when getSubTotal() is called.
 * target: 'total'; //this condition will be applied to cart's total when getTotal() is called.
 * type: 'shipping' | 'tax' | 'discount' | 'wrapping' | 'custom' | 'sale' | 'promo' | etc...;
 */

const ConditionSchema = new Schema(
  {
    name: { type: String, required: tru },
    type: { type: String, required: true },
    value: { type: Number, required: true },
    operator: { type: String, enum: ['add', 'subtract'], default: 'add' },
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
    attributes: { type: Schema.Types.Mixed }, // allows any dynamic keys
    // conditions: [ConditionSchema],
    associatedModel: {
      modelName: { type: String },
      data: { type: Schema.Types.Mixed }, // allows full raw object (e.g., Product, Service, etc.)
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
      enum: ['cart', 'wishlist', 'saved_for_later'],
      default: 'cart',
    },
    items: [CartItemSchema],
    conditions: [ConditionSchema],
    metadata: Schema.Types.Mixed, //could be store ip, origin, browser etc.
  },
  { timestamps: true }
);

export const CartModel = mongoose.model<I_Cart>('Cart', CartSchema);
`.trim();

  fs.writeFileSync(filePath, template);
  console.log(`✅ Success! CartModel.ts ${fs.existsSync(filePath) ? 'replaced' : 'created'} at ${filePath}`);
}
