import { BaseRepository } from './BaseRepository';
import type { Asset } from '../../types';

class AssetRepositoryClass extends BaseRepository<Asset> {
  constructor() { super('assets'); }

  async findByCategory(category: Asset['category']): Promise<Asset[]> {
    return (await this.findAll()).filter(a => a.category === category);
  }

  async findWithExpiringWarranty(withinDays = 60): Promise<Asset[]> {
    const cutoff = Date.now() + withinDays * 86400_000;
    return (await this.findAll()).filter(a => {
      if (!a.warrantyExpiryDate) return false;
      const t = new Date(a.warrantyExpiryDate).getTime();
      return t > Date.now() && t <= cutoff;
    });
  }

  async getTotalPurchaseValue(): Promise<number> {
    return (await this.findAll()).reduce((s, a) => s + (a.purchasePrice ?? 0), 0);
  }

  async search(query: string): Promise<Asset[]> {
    const q = query.toLowerCase();
    return (await this.findAll()).filter(a =>
      a.name.toLowerCase().includes(q) ||
      (a.brand ?? '').toLowerCase().includes(q) ||
      (a.model ?? '').toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q),
    );
  }
}

export const AssetRepository = new AssetRepositoryClass();
