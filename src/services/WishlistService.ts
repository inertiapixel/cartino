// src/services/WishlistService.ts
import { BaseService } from './BaseService';
import { Types } from 'mongoose';

export class WishlistService extends BaseService {
  protected instance = 'wishlist' as const;

  private constructor(ownerId: string | Types.ObjectId) {
    super(ownerId);
  }

  static owner(ownerId: string | Types.ObjectId): WishlistService {
    return new WishlistService(ownerId);
  }
}
