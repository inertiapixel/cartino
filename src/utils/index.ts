import { I_Cart, I_CartModifier } from "../types/cartModel";

export interface I_TimelineStep {
  stage: "item-modifier" | "cart-modifier";
  itemId?: string;
  itemName?: string;
  target: "subtotal" | "total" | undefined;
  modifierName: string | undefined;
  modifierType: string;
  before: number;
  after: number;
  differenceAmount: number;
  differencePercent: number;
}


/**
 * Format a number to fixed decimal places.
 * Always returns a number (not a string).
 */
const toFixedNumber = (value: number, decimals = 2): number => {
  return parseFloat(value.toFixed(decimals));
};

const applyModifier = (current: number, modifier: I_CartModifier) => {
  const before = current;
  let after = before;

  const isPercent =
    typeof modifier.value === "string" && modifier.value.trim().endsWith("%");
  const numericValue =
    typeof modifier.value === "number"
      ? modifier.value
      : parseFloat(modifier.value);

  if (isPercent) {
    after = before + (before * numericValue) / 100;
  } else {
    after = before + numericValue;
  }

  return {
    before,
    after,
    differenceAmount: toFixedNumber(after - before),
    differencePercent: toFixedNumber(((after - before) / before) * 100)
  };
};

export const _getCartDetails = (cart: I_Cart) => {
  const timeline: I_TimelineStep[] = [];

  const items = cart.items.map((item) => {
    const originalSubtotal = item.price * item.quantity;
    let subtotal = originalSubtotal;
    let total = subtotal;

    const sortedModifiers = (item.modifiers || [])
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const modifiersApplied = sortedModifiers.map((mod) => {
      const targetBase = mod.target === "total" ? total : subtotal;
      const effect = applyModifier(targetBase, mod);

      // Push to timeline
      timeline.push({
        stage: "item-modifier",
        itemId: item.itemId.toString(),
        itemName: item.name,
        target: mod.target,
        modifierName: mod.name,
        modifierType: mod.type,
        before: effect.before,
        after: effect.after,
        differenceAmount: effect.differenceAmount,
        differencePercent: effect.differencePercent
      });

      if (mod.target === "total") {
        total = effect.after;
      } else {
        subtotal = effect.after;
        total = subtotal;
      }

      return {
        name: mod.name,
        type: mod.type,
        order: mod.order,
        target: mod.target,
        value: mod.value,
        effect
      };
    });

    return {
      itemId: item.itemId.toString(),
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      originalSubtotal,
      modifiersApplied,
      finalTotal: total
    };
  });

  // Cart-level modifiers
  const originalSubtotal = items.reduce((sum, it) => sum + it.originalSubtotal, 0);
  const originalTotal = items.reduce((sum, it) => sum + it.finalTotal, 0);

  let cartSubtotal = originalSubtotal;
  let cartTotal = originalTotal;

  const sortedCartModifiers = (cart.modifiers || [])
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const cartLevelModifiersApplied = sortedCartModifiers.map((mod) => {
    const targetBase = mod.target === "total" ? cartTotal : cartSubtotal;
    const effect = applyModifier(targetBase, mod);

    // Push to timeline
    timeline.push({
      stage: "cart-modifier",
      target: mod.target,
      modifierName: mod.name,
      modifierType: mod.type,
      before: effect.before,
      after: effect.after,
      differenceAmount: effect.differenceAmount,
      differencePercent: effect.differencePercent
    });

    if (mod.target === "total") {
      cartTotal = effect.after;
    } else {
      cartSubtotal = effect.after;
      cartTotal = cartSubtotal;
    }

    return {
      name: mod.name,
      type: mod.type,
      order: mod.order,
      target: mod.target,
      value: mod.value,
      effect
    };
  });

  const summary = {
    originalSubtotal,
    modifiedSubtotal: cartSubtotal,
    originalTotal,
    finalTotal: cartTotal,
    totalDifference: toFixedNumber(cartTotal - originalTotal),
    totalDifferencePercent: toFixedNumber(
      ((cartTotal - originalTotal) / originalTotal) * 100
    ),
    totalItems: items.reduce((sum, it) => sum + it.quantity, 0),
    totalUniqueItems: items.length,
    totalModifiersCount:
      items.reduce((sum, it) => sum + it.modifiersApplied.length, 0) +
      cartLevelModifiersApplied.length,
    isDiscountApplied: [...items.flatMap(it => it.modifiersApplied), ...cartLevelModifiersApplied]
      .some(mod => (typeof mod.value === 'string' && mod.value.startsWith('-')) || (typeof mod.value === 'number' && mod.value < 0)),
    finalTotalRounded: toFixedNumber(cartTotal)
  };

  return {
    summary,
    items,
    cartLevelModifiersApplied,
    calculationTimeline: timeline
  };
};

