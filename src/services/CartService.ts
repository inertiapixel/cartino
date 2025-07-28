// src/services/CartService.ts
import { BaseService } from './BaseService';
import { Types } from 'mongoose';

export class CartService extends BaseService {
  protected instance = 'cart' as const;

  private constructor(ownerId: string | Types.ObjectId) {
    super(ownerId);
  }

  static owner(ownerId: string | Types.ObjectId): CartService {
    return new CartService(ownerId);
  }
}
