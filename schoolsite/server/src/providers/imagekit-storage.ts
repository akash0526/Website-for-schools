import { createHmac, randomUUID } from 'node:crypto';
import type { Config } from '../config/env.js';
import type { MediaAsset, MediaStorage, UploadInput } from '../domain/ports.js';
import { AppError } from '../middleware/errors.js';
import { IMAGE_MIME_TYPES, MAX_IMAGE_PIXELS, validateImage } from './local-storage.js';

export class ImageKitStorage implements MediaStorage {
  readonly mode = 'imagekit' as const;
  constructor(private config: Config) {}
  private headers() {
    return {
      Authorization: `Basic ${Buffer.from(`${this.config.imagekitPrivateKey}:`).toString('base64')}`,
    };
  }
  private async request(path: string, options: RequestInit = {}) {
    let response: Response;
    try {
      response = await fetch(`https://api.imagekit.io/v1${path}`, {
        ...options,
        headers: { ...this.headers(), ...options.headers },
        signal: AbortSignal.timeout(20000),
      });
    } catch {
      throw new AppError(
        502,
        'IMAGE_PROVIDER_UNAVAILABLE',
        'Image storage is temporarily unavailable. Please try again.',
      );
    }
    if (!response.ok)
      throw new AppError(
        502,
        'IMAGE_PROVIDER_ERROR',
        'The image provider could not complete this request.',
      );
    return response;
  }
  async getUploadPlan() {
    const token = randomUUID(),
      expire = Math.floor(Date.now() / 1000) + 300;
    const signature = createHmac('sha1', this.config.imagekitPrivateKey)
      .update(token + expire)
      .digest('hex');
    return {
      mode: 'direct' as const,
      uploadUrl: 'https://upload.imagekit.io/api/v1/files/upload',
      publicKey: this.config.imagekitPublicKey,
      folder: this.config.imagekitFolder,
      token,
      expire,
      signature,
      maxBytes: this.config.maxUploadBytes,
      allowedMimeTypes: IMAGE_MIME_TYPES,
    };
  }
  async verifyUpload(fileId: string): Promise<MediaAsset> {
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(fileId))
      throw new AppError(422, 'INVALID_FILE_ID', 'Invalid image reference.');
    const response = await this.request(`/files/${encodeURIComponent(fileId)}/details`);
    const file = await response.json();
    if (
      file.fileId !== fileId ||
      file.type !== 'image' ||
      !IMAGE_MIME_TYPES.includes(file.mimeType) ||
      file.size > this.config.maxUploadBytes ||
      !file.width ||
      !file.height ||
      file.width * file.height > MAX_IMAGE_PIXELS ||
      file.width > 16000 ||
      file.height > 16000 ||
      !String(file.filePath || '').startsWith(`${this.config.imagekitFolder}/`) ||
      !String(file.url || '').startsWith('https://')
    ) {
      throw new AppError(
        422,
        'UPLOAD_REJECTED',
        'This file is not a valid image in this school’s upload folder, or it exceeds the size limit.',
      );
    }
    return {
      url: file.url,
      thumbnailUrl: file.thumbnailUrl || file.url,
      provider: 'imagekit',
      fileId: file.fileId,
      width: file.width,
      height: file.height,
      alt: String(file.name || '')
        .replace(/\.[^.]+$/, '')
        .slice(0, 250),
    };
  }
  async upload(input: UploadInput) {
    const type = await validateImage(input, this.config.maxUploadBytes);
    const form = new FormData();
    form.append(
      'file',
      new Blob([new Uint8Array(input.buffer)], { type: type.mime }),
      `${randomUUID()}.${type.ext}`,
    );
    form.append('fileName', `${randomUUID()}.${type.ext}`);
    form.append('folder', this.config.imagekitFolder);
    form.append('useUniqueFileName', 'true');
    form.append('overwriteFile', 'false');
    const response = await this.request('/files/upload', { method: 'POST', body: form });
    const file = await response.json();
    return this.verifyUpload(file.fileId);
  }
  async delete(fileId: string) {
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(fileId)) return;
    const asset = await this.verifyUpload(fileId);
    if (asset.fileId)
      await this.request(`/files/${encodeURIComponent(fileId)}`, { method: 'DELETE' });
  }
}
