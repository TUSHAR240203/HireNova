import { Model, Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';

export class TenantAwareRepository<T extends Document> {
  constructor(protected model: Model<T>) {}

  private getTenantQuery(companyId: string, filter: FilterQuery<T> = {}): FilterQuery<T> {
    return { ...filter, companyId };
  }

  async create(companyId: string, data: Partial<T>): Promise<T> {
    const record = new this.model({ ...data, companyId });
    return record.save();
  }

  async find(
    companyId: string,
    filter: FilterQuery<T> = {},
    projection?: any,
    options?: QueryOptions
  ): Promise<T[]> {
    const tenantQuery = this.getTenantQuery(companyId, filter);
    return this.model.find(tenantQuery, projection, options).exec();
  }

  async findOne(
    companyId: string,
    filter: FilterQuery<T>,
    projection?: any,
    options?: QueryOptions
  ): Promise<T | null> {
    const tenantQuery = this.getTenantQuery(companyId, filter);
    return this.model.findOne(tenantQuery, projection, options).exec();
  }

  async findById(companyId: string, id: string): Promise<T | null> {
    return this.model.findOne({ _id: id, companyId } as FilterQuery<T>).exec();
  }

  async update(
    companyId: string,
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options: QueryOptions = { new: true }
  ): Promise<T | null> {
    const tenantQuery = this.getTenantQuery(companyId, filter);
    return this.model.findOneAndUpdate(tenantQuery, update, options).exec();
  }

  async delete(companyId: string, filter: FilterQuery<T>): Promise<boolean> {
    const tenantQuery = this.getTenantQuery(companyId, filter);
    const result = await this.model.deleteOne(tenantQuery).exec();
    return result.deletedCount > 0;
  }
}
