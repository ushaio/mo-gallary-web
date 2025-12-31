import sharp from 'sharp'

/**
 * Extract dominant colors from an image buffer
 * @param buffer - Image buffer
 * @param count - Number of colors to extract (default: 5)
 * @returns Array of hex color strings
 */
export async function extractDominantColors(
  buffer: Buffer,
  count: number = 5
): Promise<string[]> {
  try {
    // Resize to small size for faster processing
    const { data, info } = await sharp(buffer)
      .resize(40, 40, { fit: 'cover' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const colorCounts: Record<string, number> = {}

    // Sample every pixel
    for (let i = 0; i < data.length; i += 3) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      // Quantize colors to reduce noise (bins of 32)
      // Use bin center for representation
      const rQ = Math.floor(r / 32) * 32 + 16
      const gQ = Math.floor(g / 32) * 32 + 16
      const bQ = Math.floor(b / 32) * 32 + 16

      // Clamp values to 0-255
      const rC = Math.min(255, Math.max(0, rQ))
      const gC = Math.min(255, Math.max(0, gQ))
      const bC = Math.min(255, Math.max(0, bQ))

      const hex = `#${((1 << 24) + (rC << 16) + (gC << 8) + bC)
        .toString(16)
        .slice(1)}`

      colorCounts[hex] = (colorCounts[hex] || 0) + 1
    }

    // Sort by frequency and return top colors
    const sorted = Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map((c) => c[0])

    return sorted
  } catch (error) {
    console.error('Failed to extract dominant colors:', error)
    return []
  }
}
