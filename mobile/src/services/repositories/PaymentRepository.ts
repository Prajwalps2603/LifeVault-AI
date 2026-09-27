import { BaseRepository } from './BaseRepository';
import type { Payment } from '../../types';

class PaymentRepositoryClass extends BaseRepository<Payment> {
  constructor() { super('payments'); }

  async findDueToday(): Promise<Payment[]> {
    const all = await this.findAll();
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(); todayEnd.setHours(23,59,59,999);
    return all.filter(p => {
      if (p.status === 'PAID') return false;
      const d = new Date(p.dueDate).getTime();
      return d >= todayStart.getTime() && d <= todayEnd.getTime();
    });
  }

  async findOverdue(): Promise<Payment[]> {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    return (await this.findAll()).filter(
      p => p.status !== 'PAID' && new Date(p.dueDate) < todayStart,
    );
  }

  async findUpcoming(withinDays = 30): Promise<Payment[]> {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const cutoff = new Date(todayStart);
    cutoff.setDate(cutoff.getDate() + withinDays);
    return (await this.findAll()).filter(p => {
      if (p.status === 'PAID') return false;
      const d = new Date(p.dueDate);
      return d >= todayStart && d <= cutoff;
    });
  }

  async markAsPaid(id: string): Promise<Payment | null> {
    return this.update(id, {
      status: 'PAID',
      paidDate: new Date().toISOString(),
    });
  }

  async getTotalUpcoming(withinDays = 30): Promise<number> {
    return (await this.findUpcoming(withinDays)).reduce((s, p) => s + p.amount, 0);
  }

  async search(query: string): Promise<Payment[]> {
    const q = query.toLowerCase();
    return (await this.findAll()).filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.notes ?? '').toLowerCase().includes(q),
    );
  }
}

export const PaymentRepository = new PaymentRepositoryClass();
