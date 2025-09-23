// src/services/WishlistService.ts
import { Types } from 'mongoose';
import { BaseService } from './BaseService';

export class WishlistService extends BaseService {
  protected instance = 'wishlist' as const;

  private constructor(ownerId: string | Types.ObjectId) {
    super(ownerId);
  }

  static owner(ownerId: string | Types.ObjectId): WishlistService {
    return new WishlistService(ownerId);
  }
}
