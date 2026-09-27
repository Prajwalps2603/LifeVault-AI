import { BaseRepository } from './BaseRepository';
import type { Vehicle } from '../../types';

class VehicleRepositoryClass extends BaseRepository<Vehicle> {
  constructor() { super('vehicles'); }

  async search(query: string): Promise<Vehicle[]> {
    const q = query.toLowerCase();
    return (await this.findAll()).filter(v =>
      v.name.toLowerCase().includes(q) ||
      v.brand.toLowerCase().includes(q) ||
      v.registrationNumber.toLowerCase().includes(q) ||
      (v.model ?? '').toLowerCase().includes(q),
    );
  }
}

export const VehicleRepository = new VehicleRepositoryClass();
