import type { ZodType } from 'zod';
import type { Entity } from '../domain/models.js';
import type { ListQuery, Repository } from '../domain/ports.js';
import { notFound } from '../middleware/errors.js';
import { editableFields } from '../validation/schemas.js';

export class ContentService<T extends Entity, Input> {
  constructor(
    protected repository: Repository<T>,
    protected schema: ZodType<Input>,
    protected label: string,
    protected prepare: (
      input: Input,
      existing?: T,
    ) => Promise<Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>> = async (input) =>
      input as Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>,
  ) {}
  list(query?: ListQuery<T>) {
    return this.repository.list(query);
  }
  async get(id: string) {
    const item = await this.repository.findById(id);
    if (!item) notFound(this.label);
    return item;
  }
  async create(raw: unknown) {
    const input = this.schema.parse(raw);
    return this.repository.create(
      (await this.prepare(input)) as Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
    );
  }
  async update(id: string, raw: unknown) {
    const existing = await this.get(id);
    const input = this.schema.parse(editableFields({ ...existing, ...(raw as object) }));
    const values = await this.prepare(input, existing ?? undefined);
    const updated = await this.repository.update(id, values);
    if (!updated) notFound(this.label);
    return updated;
  }
  async remove(id: string) {
    await this.get(id);
    await this.repository.delete(id);
  }
}
