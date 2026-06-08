import { Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import { TenantAwareRepository } from '../repositories/base.repository';

export class BaseService<T extends Document> {
  constructor(protected repository: TenantAwareRepository<T>) {}

  async create(companyId: string, data: Partial<T>): Promise<T> {
    return this.repository.create(companyId, data);
  }

  async getAll(companyId: string, filter?: FilterQuery<T>): Promise<T[]> {
    return this.repository.find(companyId, filter);
  }

  async getById(companyId: string, id: string): Promise<T | null> {
    return this.repository.findById(companyId, id);
  }

  async update(companyId: string, id: string, update: UpdateQuery<T>): Promise<T | null> {
    return this.repository.update(companyId, { _id: id } as FilterQuery<T>, update);
  }

  async delete(companyId: string, id: string): Promise<boolean> {
    return this.repository.delete(companyId, { _id: id } as FilterQuery<T>);
  }
}
