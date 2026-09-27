import { BaseRepository } from './BaseRepository';
import type { Receipt } from '../../types';

class ReceiptRepositoryClass extends BaseRepository<Receipt> {
  constructor() { super('receipts'); }

  async findByCategory(category: Receipt['category']): Promise<Receipt[]> {
    return (await this.findAll()).filter(r => r.category === category);
  }

  async findByMonth(year: number, month: number): Promise<Receipt[]> {
    return (await this.findAll()).filter(r => {
      const d = new Date(r.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
  }

  async search(query: string): Promise<Receipt[]> {
    const q = query.toLowerCase();
    return (await this.findAll()).filter(r =>
      r.merchantName.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      (r.notes ?? '').toLowerCase().includes(q),
    );
  }
}

export const ReceiptRepository = new ReceiptRepositoryClass();
