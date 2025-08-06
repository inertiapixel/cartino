import { Document } from "mongoose";
import { I_Cart, I_CartItem } from "../types/cartModel";
import { EvaluatedModifier } from "../types/modifier";

export const _getSubTotal = (items: I_CartItem[]): number => {
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity;
      return sum + itemTotal;
    }, 0);
  
    return parseFloat(subtotal.toFixed(2));
};  

export function isMongooseDocument(mod: unknown): mod is Document {
    return (
      typeof mod === 'object' &&
      mod !== null &&
      'toObject' in mod &&
      typeof (mod as Document).toObject === 'function'
    );
}
  
export const _evaluateCartModifiers = (
    cart: I_Cart
  ): {
    total: number;
    subtotal: number;
    modifiers: EvaluatedModifier[];
    differenceAmount: number;
    differencePercent: number;
  } => {
    const items = cart.items || [];
    const modifiers = cart.modifiers || [];
  
    const subtotal = _getSubTotal(items);
  
    let total = subtotal;
    const evaluatedModifiers: EvaluatedModifier[] = [];
  
    const sorted = [...modifiers].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  
    for (const mod of sorted) {
      const value = typeof mod.value === 'string' ? mod.value.trim() : mod.value.toString();
      const operator = value.startsWith('-') ? 'subtract' : 'add';
      const isPercent = value.includes('%');
      const isFlat = !isPercent;
  
      const numericValue = parseFloat(value.replace('%', '').replace('+', '').replace('-', ''));
      if (isNaN(numericValue)) continue;
  
      const amount = parseFloat(
        (isPercent ? (total * numericValue) / 100 : numericValue).toFixed(2)
      );
  
      const finalAmount = operator === 'subtract' ? -amount : amount;
      total = parseFloat((total + finalAmount).toFixed(2));
  
      const differenceAmount = parseFloat(Math.abs(amount).toFixed(2));
      const differencePercent =
        subtotal !== 0 ? parseFloat(((differenceAmount / subtotal) * 100).toFixed(2)) : 0;
      
      const baseModifier = isMongooseDocument(mod) ? mod.toObject() : mod;

      evaluatedModifiers.push({
        ...baseModifier,
        evaluation: {
          differenceAmount,
          differencePercent,
          isFlat,
          isPercent,
          target: mod.target ?? 'subtotal',
        },
      });
    }
  
    const differenceAmount = parseFloat((subtotal - total).toFixed(2));
    const differencePercent =
      subtotal !== 0 ? parseFloat(((differenceAmount / subtotal) * 100).toFixed(2)) : 0;
  
    return {
      total,
      subtotal,
      modifiers: evaluatedModifiers,
      differenceAmount,
      differencePercent,
    };
  };