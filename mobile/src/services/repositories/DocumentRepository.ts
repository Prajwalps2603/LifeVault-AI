import { BaseRepository } from './BaseRepository';
import type { Document } from '../../types';

class DocumentRepositoryClass extends BaseRepository<Document> {
  constructor() { super('documents'); }

  async findByType(documentType: Document['documentType']): Promise<Document[]> {
    return (await this.findAll()).filter(d => d.documentType === documentType);
  }

  async findExpiringSoon(withinDays = 60): Promise<Document[]> {
    const cutoff = Date.now() + withinDays * 86400_000;
    return (await this.findAll()).filter(d => {
      if (!d.expiryDate) return false;
      const t = new Date(d.expiryDate).getTime();
      return t > Date.now() && t <= cutoff;
    });
  }

  async findNeedsReview(): Promise<Document[]> {
    return (await this.findAll()).filter(d => d.status === 'NEEDS_REVIEW');
  }

  async findForEntity(entityId: string): Promise<Document[]> {
    return (await this.findAll()).filter(d => d.relatedEntityId === entityId);
  }

  async search(query: string): Promise<Document[]> {
    const q = query.toLowerCase();
    return (await this.findAll()).filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.documentType.toLowerCase().includes(q) ||
      (d.notes ?? '').toLowerCase().includes(q),
    );
  }
}

export const DocumentRepository = new DocumentRepositoryClass();
