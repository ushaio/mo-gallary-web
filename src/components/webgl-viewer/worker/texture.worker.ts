// @ts-nocheck
/// <reference lib="webworker" />

let originalImage = null

const TILE_SIZE = 512

const WORKER_SIMPLE_LOD_LEVELS = [
  { scale: 0.25 },
  { scale: 0.5 },
  { scale: 1 },
  { scale: 2 },
  { scale: 4 },
]

self.onmessage = async (e) => {
  const { type, payload } = e.data
  console.info('[Worker] Received message:', type, payload)

  switch (type) {
    case 'load-image': {
      const { url } = payload
      try {
        console.info('[Worker] Fetching image:', url)
        const response = await fetch(url, { mode: 'cors' })
        const blob = await response.blob()
        originalImage = await createImageBitmap(blob)

        console.info('[Worker] Image decoded, posting init-done')
        self.postMessage({ type: 'init-done' })

        const lodLevel = 1
        const lodConfig = WORKER_SIMPLE_LOD_LEVELS[lodLevel]
        const finalWidth = Math.max(1, Math.round(originalImage.width * lodConfig.scale))
        const finalHeight = Math.max(1, Math.round(originalImage.height * lodConfig.scale))

        const initialLODBitmap = await createImageBitmap(originalImage, {
          resizeWidth: finalWidth,
          resizeHeight: finalHeight,
          resizeQuality: 'medium',
        })

        console.info('[Worker] Initial LOD created, posting image-loaded')
        self.postMessage(
          {
            type: 'image-loaded',
            payload: {
              imageBitmap: initialLODBitmap,
              imageWidth: originalImage.width,
              imageHeight: originalImage.height,
              lodLevel,
            },
          },
          [initialLODBitmap],
        )
      } catch (error) {
        console.error('[Worker] Error loading image:', error)
        self.postMessage({ type: 'load-error', payload: { error } })
      }
      break
    }
    case 'init': {
      originalImage = payload.imageBitmap
      self.postMessage({ type: 'init-done' })
      break
    }
    case 'create-tile': {
      if (!originalImage) {
        console.warn('Worker has not been initialized with an image.')
        return
      }

      const { x, y, lodLevel, lodConfig, imageWidth, imageHeight, key } = payload

      try {
        const { cols, rows } = getTileGridSize(imageWidth, imageHeight, lodLevel, lodConfig)

        const sourceWidth = imageWidth / cols
        const sourceHeight = imageHeight / rows
        const sourceX = x * sourceWidth
        const sourceY = y * sourceHeight

        const actualSourceWidth = Math.min(sourceWidth, imageWidth - sourceX)
        const actualSourceHeight = Math.min(sourceHeight, imageHeight - sourceY)

        const targetWidth = Math.min(TILE_SIZE, Math.ceil(actualSourceWidth * lodConfig.scale))
        const targetHeight = Math.min(TILE_SIZE, Math.ceil(actualSourceHeight * lodConfig.scale))

        if (targetWidth <= 0 || targetHeight <= 0) {
          return
        }

        const canvas = new OffscreenCanvas(targetWidth, targetHeight)
        const ctx = canvas.getContext('2d')

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = lodConfig.scale >= 1 ? 'high' : 'medium'

        ctx.drawImage(
          originalImage,
          sourceX,
          sourceY,
          actualSourceWidth,
          actualSourceHeight,
          0,
          0,
          targetWidth,
          targetHeight,
        )

        const imageBitmap = canvas.transferToImageBitmap()
        self.postMessage({ type: 'tile-created', payload: { key, imageBitmap, lodLevel } }, [imageBitmap])
      } catch (error) {
        console.error('Error creating tile in worker:', error)
        self.postMessage({ type: 'tile-error', payload: { key, error } })
      }
      break
    }
  }
}

function getTileGridSize(imageWidth, imageHeight, _lodLevel, lodConfig) {
  const scaledWidth = imageWidth * lodConfig.scale
  const scaledHeight = imageHeight * lodConfig.scale

  const cols = Math.ceil(scaledWidth / TILE_SIZE)
  const rows = Math.ceil(scaledHeight / TILE_SIZE)

  return { cols, rows }
}
