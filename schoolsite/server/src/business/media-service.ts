import type { MediaAsset } from '../domain/models.js';
import type { MediaStorage } from '../domain/ports.js';
import { AppError } from '../middleware/errors.js';
import { mediaSchema } from '../validation/schemas.js';

export class MediaService {
  constructor(private storage: MediaStorage) {}
  async trustedAsset(raw: unknown, existing?: MediaAsset | null): Promise<MediaAsset | null> {
    if (raw === null || raw === undefined) return null;
    const media = mediaSchema.parse(raw);
    if (existing && media.url === existing.url && media.fileId === existing.fileId)
      return { ...existing, alt: media.alt };
    if (this.storage.mode === 'imagekit') {
      if (media.provider !== 'imagekit' || !media.fileId)
        throw new AppError(
          422,
          'UNVERIFIED_IMAGE',
          'Upload this image through the school media uploader first.',
        );
      const verified = await this.storage.verifyUpload(media.fileId);
      return { ...verified, alt: media.alt };
    }
    if (
      media.provider !== 'local' &&
      !(media.provider === 'external' && media.url.startsWith('/images/'))
    )
      throw new AppError(422, 'UNVERIFIED_IMAGE', 'Use the demo image uploader.');
    return media;
  }
  async prepareFields<T extends object>(input: T, existing?: Partial<T>): Promise<T> {
    const result = { ...input };
    for (const key of ['coverImage', 'heroImage', 'aboutImage', 'logo', 'image'] as const) {
      if (key in input)
        Object.assign(result, {
          [key]: await this.trustedAsset(
            input[key as keyof T],
            existing?.[key as keyof T] as MediaAsset | null,
          ),
        });
    }
    return result;
  }
}
