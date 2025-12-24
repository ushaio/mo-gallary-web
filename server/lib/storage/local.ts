/**
 * Local Storage Provider
 *
 * Stores images on the local filesystem
 */

import { writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import {
  StorageProvider,
  StorageConfig,
  UploadFileInput,
  UploadResult,
  StorageError,
} from './types'

export class LocalStorageProvider implements StorageProvider {
  private basePath: string
  private baseUrl: string

  constructor(private config: StorageConfig) {
    this.basePath =
      config.localBasePath || path.join(process.cwd(), 'public', 'uploads')
    this.baseUrl = config.localBaseUrl || '/uploads'
    this.ensureDirectory()
  }

  validateConfig(): void {
    // Local storage requires no special config
  }

  private async ensureDirectory(): Promise<void> {
    if (!existsSync(this.basePath)) {
      await mkdir(this.basePath, { recursive: true })
    }
  }

  async upload(
    file: UploadFileInput,
    thumbnail?: UploadFileInput
  ): Promise<UploadResult> {
    try {
      await this.ensureDirectory()

      // Ensure subfolder exists if specified
      if (file.path) {
        const subfolderPath = path.join(this.basePath, file.path)
        if (!existsSync(subfolderPath)) {
          await mkdir(subfolderPath, { recursive: true })
        }
      }

      // Upload original
      const filePath = this.buildFilePath(file.filename, file.path)
      await writeFile(filePath, file.buffer)

      const result: UploadResult = {
        url: this.getUrl(file.filename, file.path),
        key: file.filename,
      }

      // Upload thumbnail
      if (thumbnail) {
        const thumbPath = this.buildFilePath(
          thumbnail.filename,
          thumbnail.path
        )
        await writeFile(thumbPath, thumbnail.buffer)
        result.thumbnailUrl = this.getUrl(thumbnail.filename, thumbnail.path)
        result.thumbnailKey = thumbnail.filename
      }

      return result
    } catch (error) {
      console.error('Local storage error:', error)
      throw new StorageError(
        'Failed to save to local storage',
        'LOCAL_WRITE_FAILED',
        error
      )
    }
  }

  async delete(key: string, thumbnailKey?: string): Promise<void> {
    try {
      const filePath = path.join(this.basePath, key)
      if (existsSync(filePath)) {
        await unlink(filePath)
      }

      if (thumbnailKey) {
        const thumbPath = path.join(this.basePath, thumbnailKey)
        if (existsSync(thumbPath)) {
          await unlink(thumbPath)
        }
      }
    } catch (error) {
      console.error('Failed to delete local file:', error)
      // Don't throw - deletion is best-effort
    }
  }

  getUrl(filename: string, subfolder?: string): string {
    const parts = [this.baseUrl]
    if (subfolder) parts.push(subfolder)
    parts.push(filename)
    return parts.join('/').replace(/\/+/g, '/')
  }

  private buildFilePath(filename: string, subfolder?: string): string {
    let targetPath = this.basePath
    if (subfolder) {
      targetPath = path.join(targetPath, subfolder)
    }
    return path.join(targetPath, filename)
  }
}
