/**
 * Storage Provider Factory
 *
 * Creates the appropriate storage provider based on configuration
 */

import { StorageProvider, StorageConfig, StorageError } from './types'
import { LocalStorageProvider } from './local'
import { GithubStorageProvider } from './github'

export class StorageProviderFactory {
  static create(config: StorageConfig): StorageProvider {
    switch (config.provider) {
      case 'local':
        return new LocalStorageProvider(config)

      case 'github':
        return new GithubStorageProvider(config)

      case 'r2':
        throw new StorageError(
          'R2 provider not yet implemented',
          'PROVIDER_NOT_IMPLEMENTED'
        )

      default:
        throw new StorageError(
          `Unknown storage provider: ${config.provider}`,
          'UNKNOWN_PROVIDER'
        )
    }
  }
}
