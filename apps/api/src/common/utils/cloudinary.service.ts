import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private readonly config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.config.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Upload a buffer (or base64 data URL) to Cloudinary.
   * Returns the secure URL plus metadata useful for storage.
   */
  async uploadImage(
    file: Buffer | string,
    folder = 'goinzeschool',
  ): Promise<{ url: string; publicId: string; format: string; bytes: number }> {
    const result = (await cloudinary.uploader.upload(file as any, {
      folder,
      resource_type: 'auto',
    })) as UploadApiResponse | UploadApiErrorResponse;
    if ('error' in result) {
      throw new Error(`Cloudinary upload failed: ${result.error.message}`);
    }
    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
    };
  }

  /** Remove a previously-uploaded asset by its public id. */
  async destroy(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId).catch(() => undefined);
  }
}
