/**
 * Cloudflare R2 Storage Provider
 *
 * Stores images in Cloudflare R2 (S3-compatible object storage)
 * Serves them via R2 public bucket URL or custom domain
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import {
  StorageProvider,
  StorageConfig,
  UploadFileInput,
  UploadResult,
  StorageError,
} from './types'

export class R2StorageProvider implements StorageProvider {
  private client: S3Client
  private bucket: string
  private publicUrl: string
  private basePath: string

  constructor(private config: StorageConfig) {
    this.validateConfig()

    this.client = new S3Client({
      region: 'auto',
      endpoint: config.r2Endpoint!,
      credentials: {
        accessKeyId: config.r2AccessKeyId!,
        secretAccessKey: config.r2SecretAccessKey!,
      },
    })

    this.bucket = config.r2Bucket!
    this.publicUrl = config.r2PublicUrl || ''
    this.basePath = config.r2Path || ''
  }

  validateConfig(): void {
    if (!this.config.r2AccessKeyId) {
      throw new StorageError(
        'R2 Access Key ID is required',
        'R2_ACCESS_KEY_MISSING'
      )
    }

    if (!this.config.r2SecretAccessKey) {
      throw new StorageError(
        'R2 Secret Access Key is required',
        'R2_SECRET_KEY_MISSING'
      )
    }

    if (!this.config.r2Bucket) {
      throw new StorageError('R2 Bucket name is required', 'R2_BUCKET_MISSING')
    }

    if (!this.config.r2Endpoint) {
      throw new StorageError('R2 Endpoint is required', 'R2_ENDPOINT_MISSING')
    }

    if (!this.config.r2PublicUrl) {
      throw new StorageError(
        'R2 Public URL is required for serving files',
        'R2_PUBLIC_URL_MISSING'
      )
    }
  }

  async upload(
    file: UploadFileInput,
    thumbnail?: UploadFileInput
  ): Promise<UploadResult> {
    try {
      // Build file key
      const fileKey = this.buildKey(file.filename, file.path)

      // Upload original and thumbnail in parallel
      const uploadPromises: Promise<void>[] = [
        this.uploadToR2(fileKey, file.buffer, file.contentType),
      ]

      let thumbKey: string | undefined
      if (thumbnail) {
        thumbKey = this.buildKey(thumbnail.filename, thumbnail.path)
        uploadPromises.push(
          this.uploadToR2(thumbKey, thumbnail.buffer, thumbnail.contentType)
        )
      }

      // Wait for all uploads to complete
      await Promise.all(uploadPromises)

      const result: UploadResult = {
        url: this.getUrl(fileKey),
        key: fileKey,
      }

      if (thumbnail && thumbKey) {
        result.thumbnailUrl = this.getUrl(thumbKey)
        result.thumbnailKey = thumbKey
      }

      return result
    } catch (error: any) {
      console.error('R2 upload error:', error)
      throw new StorageError(
        `Failed to upload to R2: ${error.message}`,
        'R2_UPLOAD_FAILED',
        error
      )
    }
  }

  async delete(key: string, thumbnailKey?: string): Promise<void> {
    try {
      // Delete original file
      await this.deleteFromR2(key)

      // Delete thumbnail if provided
      if (thumbnailKey) {
        await this.deleteFromR2(thumbnailKey)
      }
    } catch (error) {
      console.error(`Failed to delete from R2: ${key}`, error)
      // Don't throw - deletion is best-effort
    }
  }

  getUrl(key: string): string {
    const baseUrl = this.publicUrl.replace(/\/+$/, '')
    return `${baseUrl}/${key}`
  }

  private buildKey(filename: string, subfolder?: string): string {
    const parts: string[] = []
    if (this.basePath) parts.push(this.basePath)
    if (subfolder) parts.push(subfolder)
    parts.push(filename)
    // Remove leading slashes and duplicate slashes
    return parts.join('/').replace(/\/+/g, '/').replace(/^\/+/, '')
  }

  private async uploadToR2(
    key: string,
    buffer: Buffer,
    contentType: string
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })

    await this.client.send(command)
  }

  private async deleteFromR2(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })

    await this.client.send(command)
  }
}
