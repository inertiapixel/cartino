// cartino/src/index.ts
import './types/http';
import { CartService } from './services/CartService';
import { SaveForLaterService } from './services/SaveForLaterService';
import { WishlistService } from './services/WishlistService';
import { I_Cart } from './types/cartModel';

export { createCartinoMiddleware } from './middleware/middleware';
export const Cart = CartService;
export const Wishlist = WishlistService;
export const SaveForLater = SaveForLaterService;
export type { I_Cart };

/**
 * 
  import { Cart, Wishlist, SaveForLater } from 'cartino';

  //add
  await Cart.owner('session_123').add({ ... });
  await Wishlist.owner(user._id).add({ ... });
  await SaveForLater.owner(user._id).add({ ... });

  //remove
  await Cart.owner('user_or_session_id').remove('item_id');
  await Wishlist.owner('abc123').remove('item_id');
  await SaveForLater.owner('xyz456').remove('item_id');

 *await Cart.owner('user_or_session_id').removeAllItem();

 *await Cart.owner('user_or_session_id').item(itemId).addItemModifier();
 *await Cart.owner('user_or_session_id').item(itemId).removeItemModifier($modifierName);
 *await Cart.owner('user_or_session_id').item(itemId).clearItemModifiers(); //this will delete all modifiers which is added on items, it will not touch cart modifiers.
 *await Cart.owner('user_or_session_id').removeCartModifier($modifierName);
 *await Cart.owner('user_or_session_id').clearCartModifiers(); //this will delete all modifiers which is added on cart, it will not touch item modifiers.

 *await Cart.owner('user_or_session_id').

  //update
  await Cart.owner('user_or_session_id').update('item_id');
  await Wishlist.owner('abc123').update('item_id');
  await SaveForLater.owner('xyz456').update('item_id');

  await Cart.owner('cart_123').update(
     itemId,
    name: string;
    quantity: number;
    price: number;
    attributes?: Record<string, unknown>;
    associatedModel?: AssociatedModel;
  );

    Note: except itemId, all other values are optional

    =============QUANTITY===========

    1. Increment Quantity (relative)
    // Increment by 1 (default)
    await CartService.owner(userId).item(itemId).incrementQuantity();

    // Increment by 2
    await CartService.owner(userId).item(itemId).incrementQuantity(2);

    // Guest cart increment
    await CartService.owner({ sessionId }).item(itemId).incrementQuantity();

    2. Decrement Quantity (relative)
    // Decrement by 1
    await CartService.owner(userId).item(itemId).decrementQuantity();

    // Decrement by 3
    await CartService.owner(userId).item(itemId).decrementQuantity(3);

    // Guest cart decrement
    await CartService.owner({ sessionId }).item(itemId).decrementQuantity();

    3. Auto-remove item if quantity falls to 0 or below
    // If current quantity = 2, this will remove the item from cart
    await CartService.owner(userId).item(itemId).decrementQuantity(2);


    4. Update quantity

    updateQuantity(2) → behaves as set quantity = 2

    updateQuantity({ relative: true, quantity: 1 }) → behaves as increment by 1

    updateQuantity({ relative: true, quantity: -2 }) → behaves as decrement by 2

    updateQuantity({ relative: false, quantity: 5 }) → behaves as set quantity = 5


    5. Error handling (when item/cart not found)

    try {
      await CartService.owner(userId).item('invalid-id').decrementQuantity();
    } catch (err) {
      console.error(err.message); // "Cart item not found"
    }

    ======
    =============getContent===========
   const { items, getPriceSum } = await Cart.owner(userId).getContent();

    items.forEach(item => {
      console.log('Product ID:', item.itemId);
      console.log('Qty:', item.quantity);
      console.log('Price:', item.price);

      if (item.hasAttribute('size')) {
        console.log('Size:', item.getAttribute('size'));
      } else {
        console.log('Size: not selected');
      }

      if (item.hasAttribute('sku')) {
        console.log('Sku:', item.getAttribute('sku'));
      } else {
        console.log('Sku: not selected');
      }

    });

    console.log('Total:', getPriceSum);

    ======================applyItemModifier usecase======================

    Use Case 1: Flat Discount on Subtotal (default)

    await CartService
    .owner(userId)
    .item(itemId)
    .applyItemModifier({
      type: 'discount',
      value: -100
    });

    Use Case 2: Percentage Discount (auto target: subtotal)

    await CartService
    .owner(userId)
    .item(itemId)
    .applyItemModifier({
      type: 'discount',
      value: '-10%'
    });

    Use Case 3: Tax as Percent, explicitly targeting total
    await CartService
      .owner(userId)
      .item(itemId)
      .applyItemModifier({
        name: 'GST',
        type: 'tax',
        value: '18%',
        target: 'total'
      });

      Use Case 4: Shipping as Flat Charge
      await CartService
      .owner(userId)
      .item(itemId)
      .applyItemModifier({
        name: 'Express Shipping',
        type: 'shipping',
        value: 50,
        target: 'total'
      });

      Use Case 5: Custom Order of Execution
      await cartService
      .owner(userId)
      .item(itemId)
      .applyItemModifier({
        type: 'discount',
        value: '-20%',
        order: 1
      });

      Use Case 6: Add Modifier with Metadata
      await cartService
      .owner(userId)
      .item(itemId)
      .applyItemModifier({
        name: 'Summer Offer',
        type: 'discount',
        value: '-15%',
        metadata: {
          source: 'campaign',
          campaignId: 'SUMMER2025'
        }
      });

      Use Case 7: Invalid Modifier (Missing Type or Value)
      await cartService.owner(userId).item(itemId).applyItemModifier({
        name: 'Missing Stuff'
      });
    ======================end of applyItemModifier=======================

    cartService.owner(userId).item(itemId).removeItemModifier(modifierName)

    cartService.owner(userId).item(itemId).clearItemModifiers()

    cartService.owner(userId).item(itemId).getItemModifiers(itemId)

    cartService.owner(userId).item(itemId).getItemModifierByName(name)
    or
    cartService.owner(userId).item(itemId).getItemModifierByName([name1,name2])

    cartService.owner(userId).item(itemId).getItemModifiersByType(type)
    or
    cartService.owner(userId).item(itemId).getItemModifiersByType([type1,type2])

    await cartService.item(itemId).hasItemModifier({ name: "discount" }); // true or false
    await cartService.item(itemId).hasItemModifier({ type: "tax" }); // true or false
    await cartService.item(itemId).hasItemModifier({ name: ["discount", "tax"] }); // true if matches all
    await cartService.item(itemId).hasItemModifier({ name: "discount", type: "tax" }); // true if either matches 'any' default
    await cartService.item(itemId).hasItemModifier({ name: "discount", type: "tax", match: "any" });
    await cartService.item(itemId).hasItemModifier({ name: "discount", type: "tax", match: "all" });


    await cartService.item(itemId).reorderItemModifiers(['Coupon', 'Shipping']) //pass modifier name

    await cartService.item(itemId).updateItemModifier('shipping', {
      value: '50',
      type: 'flat',
      operator: 'add',
      metadata: { region: 'north' }
    });

    await cartService.item(itemId).evaluateItemModifiers() //get sub total and total after appliying all modifiers

    await cartService.item(itemId).getSubTotal()
    await cartService.item(itemId).getTotal()

   await cartService.owner().isItemModifierValid(itemId, modifierName)

    Cart.owner(ownerId).isEmpty()

    isEmpty()
    countItems()
    countTotalQuantity() return integer | throw



    =======)))))))))==========Merge Guest Cart with Auth Cart=======)))))))))==========
    On login, transfer items from guest cart (cookie/localstorage ID)

    Smart merge logic to prevent duplicates
    =======)))))))))==========end=======)))))))))==========

    ====moveTo====
    const result = await Cart.owner(userId).item(itemId).moveTo('save_for_later');
    const result = await Cart.owner(userId).item(itemId).moveTo('cart');

    ===============Cart level methods for modifiers========

    const result = await Cart.owner(userId).applyModifier
    const result = await Cart.owner(userId).removeModifier(modifier name)
    const result = await Cart.owner(userId).removeModifierByType(modifier type)
    const result = await Cart.owner(userId).clearModifiers()
    const result = await Cart.owner(userId).getModifiers()
    const result = await Cart.owner(userId).getModifier() // string or array
    const result = await Cart.owner(userId).getModifiersByType() //string or array
    
    const result = await Cart.owner(userId).hasModifier({ name: "discount" });
    const result = await Cart.owner(userId).hasModifier({ type: "shipping" });
    const result = await Cart.owner(userId).hasModifier({ name: ["coupon", "gift"] });
    const result = await Cart.owner(userId).hasModifier({ name: "tax", type: "service", match: "any" });
    const result = await Cart.owner(userId).hasModifier({ name: "tax", type: "service", match: "all" });

    const result = await Cart.owner(userId).reorderModifiers();
    const result = await Cart.owner(userId).updateModifier(name,[data])

    Cart.owner(userId).evaluateModifiers()

    =============== end of art level methods for modifiers========

    ======= Cart function =======
    const result = await Cart.owner(userId).getContent()
    const result = await Cart.owner(userId).getItemCount()
    const result = await Cart.owner(userId).getTotal()
    const result = await Cart.owner(userId).getSubTotal()

    const result = await Cart.owner(userId).getTotalQuantity //get total item qty
    const result = await Cart.owner(userId).getItemQuantity(itemId)

    const result = await Cart.owner(userId).getCartDetails()

    ======= end of Cart function =======

    =========HOOKS=======
    Hooks

    cart.created
    cart.adding
    cart.added
    cart.updating
    cart.updated
    cart.removing
    cart.removed
    cart.clearing
    cart.cleared
    =========end of HOOKS=======

*/ 
