import { BaseRepository } from './BaseRepository';
import type { Reminder } from '../../types';

class ReminderRepositoryClass extends BaseRepository<Reminder> {
  constructor() { super('reminders'); }

  async findPending(): Promise<Reminder[]> {
    return (await this.findAll()).filter(r => !r.isCompleted);
  }

  async findCompleted(): Promise<Reminder[]> {
    return (await this.findAll()).filter(r => r.isCompleted);
  }

  async findUpcoming(withinDays = 30): Promise<Reminder[]> {
    const cutoff = Date.now() + withinDays * 86400_000;
    return (await this.findAll()).filter(r => {
      if (r.isCompleted) return false;
      const t = new Date(r.dueDate).getTime();
      return t >= Date.now() && t <= cutoff;
    });
  }

  async markComplete(id: string): Promise<Reminder | null> {
    return this.update(id, {
      isCompleted: true,
      completedAt: new Date().toISOString(),
    });
  }

  async search(query: string): Promise<Reminder[]> {
    const q = query.toLowerCase();
    return (await this.findAll()).filter(r =>
      r.title.toLowerCase().includes(q) ||
      (r.description ?? '').toLowerCase().includes(q),
    );
  }
}

export const ReminderRepository = new ReminderRepositoryClass();
