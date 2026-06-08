import { Document, FilterQuery, UpdateQuery } from 'mongoose';
import { TenantAwareRepository, FindOptions } from '../repositories/base.repository';

export class BaseService<T extends Document> {
  constructor(protected repository: TenantAwareRepository<T>) {}

  async create(companyId: string, data: Partial<T>): Promise<T> {
    return this.repository.create(companyId, data);
  }

  async getAll(companyId: string, filter?: FilterQuery<T>, options?: FindOptions): Promise<T[]> {
    return this.repository.find(companyId, filter, options);
  }

  async getById(companyId: string, id: string, projection?: any): Promise<T | null> {
    return this.repository.findById(companyId, id, projection);
  }

  async count(companyId: string, filter?: FilterQuery<T>): Promise<number> {
    return this.repository.count(companyId, filter);
  }

  async update(companyId: string, id: string, update: UpdateQuery<T>): Promise<T | null> {
    return this.repository.update(companyId, { _id: id } as FilterQuery<T>, update);
  }

  async delete(companyId: string, id: string): Promise<boolean> {
    return this.repository.delete(companyId, { _id: id } as FilterQuery<T>);
  }
}
