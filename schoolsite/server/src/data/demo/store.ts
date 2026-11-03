import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Database } from '../../domain/models.js';
import { createSeedDatabase } from './seed.js';

export class DemoStore {
  private data: Database;
  private writes: Promise<unknown> = Promise.resolve();
  constructor(private file?: string) {
    if (file && existsSync(file)) {
      const saved = JSON.parse(readFileSync(file, 'utf8'));
      if (saved.version !== 1 || !saved.data?.settings || !Array.isArray(saved.data?.events))
        throw new Error('Invalid demo store. Back up and remove server/data/demo.json to reseed.');
      this.data = saved.data;
    } else this.data = createSeedDatabase();
  }
  read(): Database {
    return structuredClone(this.data);
  }
  update<T>(change: (data: Database) => T): Promise<T> {
    const operation = this.writes.then(() => {
      const result = change(this.data);
      if (this.file) {
        mkdirSync(join(this.file, '..'), { recursive: true });
        const temporary = `${this.file}.${randomUUID()}.tmp`;
        writeFileSync(temporary, JSON.stringify({ version: 1, data: this.data }, null, 2));
        renameSync(temporary, this.file);
      }
      return structuredClone(result);
    });
    this.writes = operation.catch(() => undefined);
    return operation;
  }
}
