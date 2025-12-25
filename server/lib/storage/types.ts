/**
 * Storage Provider Types and Interfaces
 *
 * Provides a unified interface for different storage backends
 * (local filesystem, GitHub, Cloudflare R2, etc.)
 */

export interface UploadFileInput {
  buffer: Buffer
  filename: string
  path?: string
  contentType: string
}

export interface UploadResult {
  url: string
  key: string
  thumbnailUrl?: string
  thumbnailKey?: string
}

export interface StorageConfig {
  provider: 'local' | 'github' | 'r2'

  // Local filesystem config
  localBasePath?: string
  localBaseUrl?: string

  // GitHub config
  githubToken?: string
  githubRepo?: string
  githubPath?: string
  githubBranch?: string
  githubAccessMethod?: 'raw' | 'jsdelivr' | 'pages'
  githubPagesUrl?: string

  // R2 config (for future implementation)
  r2AccessKeyId?: string
  r2SecretAccessKey?: string
  r2Bucket?: string
  r2Endpoint?: string
}

export interface StorageProvider {
  /**
   * Upload a file and optionally its thumbnail
   */
  upload(
    file: UploadFileInput,
    thumbnail?: UploadFileInput
  ): Promise<UploadResult>

  /**
   * Delete a file from storage
   */
  delete(key: string, thumbnailKey?: string): Promise<void>

  /**
   * Get the public URL for a file
   */
  getUrl(key: string): string

  /**
   * Validate provider configuration
   */
  validateConfig(): void
}

export class StorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'StorageError'
  }
}
