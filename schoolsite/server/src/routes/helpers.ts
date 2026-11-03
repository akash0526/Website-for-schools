import type { RequestHandler } from 'express';
import { z } from 'zod';
import type { ListQuery } from '../domain/ports.js';
import { pageSchema } from '../validation/schemas.js';
export const wrap =
  (handler: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
export function pagination(req: Parameters<RequestHandler>[0]): ListQuery<any> {
  const { page, limit } = pageSchema.parse(req.query);
  const status = z
    .enum(['draft', 'published'])
    .optional()
    .parse(req.query.status || undefined);
  const search = z.string().max(150).optional().parse(req.query.search);
  return {
    page,
    limit,
    filters: [
      ...(status ? [{ field: 'status', op: 'eq' as const, value: status }] : []),
      ...(search ? [{ field: 'title', op: 'ilike' as const, value: search }] : []),
    ],
  };
}
export const routeId = (value: unknown) => z.string().uuid().parse(value);
