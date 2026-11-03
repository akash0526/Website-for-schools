import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { fileTypeFromBuffer } from 'file-type';
import { imageSize } from 'image-size';
import type { Config } from '../config/env.js';
import type { MediaStorage, UploadInput } from '../domain/ports.js';
import { AppError } from '../middleware/errors.js';

export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_PIXELS = 40_000_000;
export async function validateImage(input: UploadInput, maxBytes: number) {
  if (input.buffer.length > maxBytes)
    throw new AppError(413, 'FILE_TOO_LARGE', 'Please choose a smaller image.');
  const type = await fileTypeFromBuffer(input.buffer);
  if (!type || !IMAGE_MIME_TYPES.includes(type.mime))
    throw new AppError(
      415,
      'UNSUPPORTED_IMAGE',
      'Only real JPEG, PNG, and WebP images are accepted.',
    );
  try {
    const dimensions = imageSize(input.buffer);
    if (
      !dimensions.width ||
      !dimensions.height ||
      dimensions.width * dimensions.height > MAX_IMAGE_PIXELS ||
      dimensions.width > 16000 ||
      dimensions.height > 16000
    )
      throw new Error('Invalid dimensions');
  } catch {
    throw new AppError(
      415,
      'INVALID_IMAGE',
      'Choose a valid image smaller than 40 megapixels and 16,000 pixels per side.',
    );
  }
  return type;
}
export class LocalStorage implements MediaStorage {
  readonly mode = 'local' as const;
  private directory: string;
  constructor(config: Config) {
    this.directory = join(config.dataDirectory, 'uploads');
    this.maxBytes = config.maxUploadBytes;
  }
  private maxBytes: number;
  async getUploadPlan() {
    return {
      mode: 'server' as const,
      uploadUrl: '/api/admin/uploads',
      maxBytes: this.maxBytes,
      allowedMimeTypes: IMAGE_MIME_TYPES,
    };
  }
  async upload(input: UploadInput) {
    const type = await validateImage(input, this.maxBytes);
    await mkdir(this.directory, { recursive: true });
    const name = `${randomUUID()}.${type.ext}`;
    await writeFile(join(this.directory, name), input.buffer, { flag: 'wx' });
    const dimensions = imageSize(input.buffer);
    return {
      url: `/uploads/${name}`,
      provider: 'local' as const,
      fileId: name,
      width: dimensions.width,
      height: dimensions.height,
      alt: basename(input.originalName)
        .replace(/\.[^.]+$/, '')
        .slice(0, 250),
    };
  }
  async verifyUpload(): Promise<never> {
    throw new AppError(400, 'INVALID_UPLOAD_MODE', 'Demo uploads use the server upload endpoint.');
  }
  async delete(fileId: string) {
    if (!/^[a-f0-9-]+\.(jpg|png|webp)$/.test(fileId)) return;
    await unlink(join(this.directory, fileId)).catch(() => undefined);
  }
}
