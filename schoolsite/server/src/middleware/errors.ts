import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { MulterError } from 'multer';

export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}
export class DataError extends Error {
  constructor(message = 'The database could not complete this request.') {
    super(message);
  }
}
export const notFound = (label = 'Record'): never => {
  throw new AppError(404, 'NOT_FOUND', `${label} not found.`);
};
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Please check the highlighted fields.',
        details: error.flatten(),
      },
    });
    return;
  }
  if (error instanceof AppError) {
    res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    });
    return;
  }
  if (error instanceof MulterError) {
    res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
      error: {
        code: error.code,
        message:
          error.code === 'LIMIT_FILE_SIZE'
            ? 'This image is too large.'
            : 'Upload one image using the file field.',
      },
    });
    return;
  }
  if (error?.type === 'entity.too.large') {
    res.status(413).json({ error: { code: 'TOO_LARGE', message: 'Request is too large.' } });
    return;
  }
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Invalid JSON request.' } });
    return;
  }
  console.error(
    JSON.stringify({
      level: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }),
  );
  res.status(error instanceof DataError ? 503 : 500).json({
    error: {
      code: 'SERVER_ERROR',
      message:
        error instanceof DataError ? error.message : 'Something went wrong. Please try again.',
    },
  });
};
