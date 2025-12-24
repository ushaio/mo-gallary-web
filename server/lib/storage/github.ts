/**
 * GitHub Storage Provider
 *
 * Stores images in a GitHub repository and serves them via:
 * - raw.githubusercontent.com
 * - jsDelivr CDN
 * - GitHub Pages
 */

import { Octokit } from '@octokit/rest'
import {
  StorageProvider,
  StorageConfig,
  UploadFileInput,
  UploadResult,
  StorageError,
} from './types'

export class GithubStorageProvider implements StorageProvider {
  private octokit: Octokit
  private owner: string
  private repo: string
  private basePath: string
  private branch: string
  private accessMethod: 'raw' | 'jsdelivr' | 'pages'
  private pagesUrl?: string

  constructor(private config: StorageConfig) {
    this.validateConfig()

    this.octokit = new Octokit({ auth: config.githubToken })

    // Parse owner/repo from "owner/repo" format
    const [owner, repo] = config.githubRepo!.split('/')
    this.owner = owner
    this.repo = repo

    this.basePath = config.githubPath || 'uploads'
    this.branch = config.githubBranch || 'main'
    this.accessMethod = config.githubAccessMethod || 'jsdelivr'
    this.pagesUrl = config.githubPagesUrl
  }

  validateConfig(): void {
    if (!this.config.githubToken) {
      throw new StorageError(
        'GitHub token is required',
        'GITHUB_TOKEN_MISSING'
      )
    }

    if (!this.config.githubRepo || !this.config.githubRepo.includes('/')) {
      throw new StorageError(
        'GitHub repo must be in format "owner/repo"',
        'GITHUB_REPO_INVALID'
      )
    }

    if (
      this.config.githubAccessMethod === 'pages' &&
      !this.config.githubPagesUrl
    ) {
      throw new StorageError(
        'GitHub Pages URL is required when using pages access method',
        'GITHUB_PAGES_URL_MISSING'
      )
    }
  }

  async upload(
    file: UploadFileInput,
    thumbnail?: UploadFileInput
  ): Promise<UploadResult> {
    try {
      // Build file path
      const filePath = this.buildPath(file.filename, file.path)

      // Upload original file
      await this.uploadToGithub(
        filePath,
        file.buffer,
        `Upload: ${file.filename}`
      )

      const result: UploadResult = {
        url: this.getUrl(filePath),
        key: filePath,
      }

      // Upload thumbnail if provided
      if (thumbnail) {
        const thumbPath = this.buildPath(thumbnail.filename, thumbnail.path)
        await this.uploadToGithub(
          thumbPath,
          thumbnail.buffer,
          `Upload thumbnail: ${thumbnail.filename}`
        )
        result.thumbnailUrl = this.getUrl(thumbPath)
        result.thumbnailKey = thumbPath
      }

      return result
    } catch (error: any) {
      console.error('GitHub upload error:', error)
      throw new StorageError(
        `Failed to upload to GitHub: ${error.message}`,
        'GITHUB_UPLOAD_FAILED',
        error
      )
    }
  }

  async delete(key: string, thumbnailKey?: string): Promise<void> {
    // Note: This method always attempts to delete from GitHub
    // The decision to call this method is made by the caller
    try {
      // Delete original file
      await this.deleteFromGithub(key)

      // Delete thumbnail if provided
      if (thumbnailKey) {
        await this.deleteFromGithub(thumbnailKey)
      }
    } catch (error) {
      console.error(`Failed to delete from GitHub: ${key}`, error)
      // Don't throw - deletion is best-effort
    }
  }

  getUrl(key: string): string {
    switch (this.accessMethod) {
      case 'raw':
        return `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/${key}`

      case 'jsdelivr':
        return `https://cdn.jsdelivr.net/gh/${this.owner}/${this.repo}@${this.branch}/${key}`

      case 'pages':
        const baseUrl = this.pagesUrl!.replace(/\/+$/, '')
        return `${baseUrl}/${key}`

      default:
        return `https://cdn.jsdelivr.net/gh/${this.owner}/${this.repo}@${this.branch}/${key}`
    }
  }

  private buildPath(filename: string, subfolder?: string): string {
    const parts = [this.basePath]
    if (subfolder) parts.push(subfolder)
    parts.push(filename)
    // Remove leading slashes and duplicate slashes
    return parts.join('/').replace(/\/+/g, '/').replace(/^\/+/, '')
  }

  private async uploadToGithub(
    path: string,
    buffer: Buffer,
    message: string
  ): Promise<void> {
    const content = buffer.toString('base64')

    // Check if file exists (to update instead of create)
    let sha: string | undefined
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.branch,
      })

      if (!Array.isArray(data) && 'sha' in data) {
        sha = data.sha
      }
    } catch (error: any) {
      // File doesn't exist (404), that's fine
      if (error.status !== 404) {
        console.error('GitHub getContent error:', error.response?.data || error.message)
        throw error
      }
    }

    // Create or update file
    try {
      await this.octokit.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path,
        message,
        content,
        branch: this.branch,
        ...(sha && { sha }),
      })
    } catch (error: any) {
       console.error('GitHub createOrUpdateFileContents error:', error.response?.data || error.message)

       const msg = error.response?.data?.message || error.message || ''
       if (msg.includes('exists where') && msg.includes('subdirectory')) {
         const conflict = await this.checkPathConflict(path)
         if (conflict) {
           throw new Error(
             `The path '${conflict}' exists as a file in your GitHub repository, preventing directory creation. Please rename or delete this file on GitHub.`
           )
         }
       }
       throw error
    }
  }

  private async checkPathConflict(path: string): Promise<string | null> {
    const parts = path.split('/')
    // Check parts 0 to n-2 (parent directories)
    let currentPath = ''

    // Iterate through all parent directories
    for (let i = 0; i < parts.length - 1; i++) {
        currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i]

        try {
            const { data } = await this.octokit.repos.getContent({
                owner: this.owner,
                repo: this.repo,
                path: currentPath,
                ref: this.branch,
            })

            // If it returns an object (not array) and type is file, it's a conflict
            if (!Array.isArray(data) && data.type === 'file') {
                return currentPath
            }
        } catch (e) {
            // Ignore 404 or other errors during check
        }
    }
    return null
  }

  private async deleteFromGithub(path: string): Promise<void> {
    try {
      // Get file SHA (required for deletion)
      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.branch,
      })

      if ('sha' in data) {
        await this.octokit.repos.deleteFile({
          owner: this.owner,
          repo: this.repo,
          path,
          message: `Delete: ${path}`,
          sha: data.sha,
          branch: this.branch,
        })
      }
    } catch (error: any) {
      if (error.status === 404) {
        console.log(`File not found on GitHub: ${path}`)
        return
      }
      throw error
    }
  }
}
