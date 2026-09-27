import { BaseRepository } from './BaseRepository';
import type { Expense, ExpenseCategory } from '../../types';

class ExpenseRepositoryClass extends BaseRepository<Expense> {
  constructor() { super('expenses'); }

  async findByCategory(category: ExpenseCategory): Promise<Expense[]> {
    return (await this.findAll()).filter(e => e.category === category);
  }

  async findByMonth(year: number, month: number): Promise<Expense[]> {
    return (await this.findAll()).filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
  }

  async getTotalForMonth(year: number, month: number): Promise<number> {
    return (await this.findByMonth(year, month)).reduce((s, e) => s + e.amount, 0);
  }

  async getCategoryBreakdown(year: number, month: number): Promise<
    Array<{ category: ExpenseCategory; total: number; count: number }>
  > {
    const expenses = await this.findByMonth(year, month);
    const map = new Map<ExpenseCategory, { total: number; count: number }>();
    for (const e of expenses) {
      const cur = map.get(e.category) ?? { total: 0, count: 0 };
      map.set(e.category, { total: cur.total + e.amount, count: cur.count + 1 });
    }
    return [...map.entries()]
      .map(([category, d]) => ({ category, ...d }))
      .sort((a, b) => b.total - a.total);
  }

  async findForVehicle(vehicleId: string): Promise<Expense[]> {
    return (await this.findAll()).filter(e => e.vehicleId === vehicleId);
  }

  async search(query: string): Promise<Expense[]> {
    const q = query.toLowerCase();
    return (await this.findAll()).filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      (e.merchantName ?? '').toLowerCase().includes(q) ||
      (e.description ?? '').toLowerCase().includes(q),
    );
  }
}

export const ExpenseRepository = new ExpenseRepositoryClass();
