// cartino/src/index.ts
import { Model } from 'mongoose';
import { I_Cart } from './types/cartModel';
import { setCartModel } from './db/cartinoModel';
import { CartService } from './services/CartService';
import { WishlistService } from './services/WishlistService';
import { SavedForLaterService } from './services/SavedForLaterService';

// Initialize the Cartino module with your Mongoose model
export function initCartino({ model }: { model: Model<I_Cart> }) {
  setCartModel(model);
}

// Expose the services with a clean, chainable API
export const Cart = CartService;
export const Wishlist = WishlistService;
export const SavedForLater = SavedForLaterService;

// Export types
export type { I_Cart };

/**
 * 
  import { Cart, Wishlist, SavedForLater } from 'cartino';

  //add
  await Cart.owner('session_123').add({ ... });
  await Wishlist.owner(user._id).add({ ... });
  await SavedForLater.owner(user._id).add({ ... });

  //remove
  await Cart.owner('user_or_session_id').remove('item_id');
  await Wishlist.owner('abc123').remove('item_id');
  await SavedForLater.owner('xyz456').remove('item_id');

  //update
  await Cart.owner('user_or_session_id').update('item_id');
  await Wishlist.owner('abc123').update('item_id');
  await SavedForLater.owner('xyz456').update('item_id');

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

    
*/