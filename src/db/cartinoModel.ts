// cartino/src/db/cartinoModel.ts
import { Model } from 'mongoose';
import { I_Cart } from '../types/cartModel';

let CartModel: Model<I_Cart>;

export const setCartModel = (model: Model<I_Cart>) => {
  CartModel = model;
};

export const getCartModel = () => {
  if (!CartModel) {
    throw new Error('CartModel is not initialized. Call initCartino({ model }) first.');
  }
  return CartModel;
};
