# WebGL Viewer 加载策略说明

## 📋 当前实现：HTMLImage + crossOrigin

### 代码位置
`src/components/webgl-viewer/engine/WebGLImageViewerEngine.ts`

### 实现方式

```typescript
// 在主线程使用 <img> 标签加载
private loadMainImage(url: string): Promise<ImageBitmap> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'  // ← 关键：启用匿名跨域
    
    img.onload = async () => {
      const imageBitmap = await createImageBitmap(img)
      resolve(imageBitmap)
    }
    
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${url}`))
    }
    
    img.src = url
  })
}
```

### 优点
- ✅ **绕过 CORS**：浏览器豁免 `<img>` 标签的 CORS 限制
- ✅ **无需后端配置**：不需要在 R2、S3 等配置 CORS
- ✅ **兼容性更好**：所有浏览器都支持
- ✅ **立即生效**：无需等待 CDN 配置更改

### 缺点
- ❌ **逻辑不同**：与 Afilmory 的 Worker fetch 方案不同
- ❌ **主线程阻塞**：虽然异步，但仍在主线程处理
- ⚠️ **可能有性能差异**：`<img>` 和 `fetch()` 的缓存策略不同

---

## 🔄 替代实现：Worker fetch（Afilmory 方案）

### 代码示例

```typescript
// 在 Worker 中使用 fetch 加载
const TextureWorkerRaw = `
self.onmessage = async (e) => {
  const { type, payload } = e.data
  
  switch (type) {
    case 'load-image': {
      const { url } = payload
      
      try {
        console.info('[Worker] Fetching image:', url)
        const response = await fetch(url, { mode: 'cors' })  // ← 关键
        const blob = await response.blob()
        originalImage = await createImageBitmap(blob)
        
        // 创建 LOD 并返回
        self.postMessage({ type: 'image-loaded', payload: {...} })
      } catch (error) {
        console.error('[Worker] Error loading image:', error)
      }
      break
    }
    
    case 'create-tile': {
      // 瓦片创建逻辑
      break
    }
  }
}
`
```

### Engine 修改

```typescript
async loadImage(url: string, ...): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    this.loadImageResolve = resolve
    this.loadImageReject = reject

    // 发送 URL 给 Worker，Worker 负责 fetch
    this.worker?.postMessage({
      type: 'load-image',
      payload: { url },
    })
  })
}

private handleWorkerMessage(e: MessageEvent) {
  const { type, payload } = e.data

  if (type === 'image-loaded') {
    const { imageBitmap, imageWidth, imageHeight } = payload
    const texture = this.createWebGLTexture(imageBitmap)
    // ...
  }
}
```

### 优点
- ✅ **逻辑相同**：完全匹配 Afilmory 的实现
- ✅ **后台处理**：不阻塞主线程
- ✅ **性能更好**：Worker 中的 `fetch()` 可能更好的缓存策略
- ✅ **统一架构**：便于维护和升级

### 缺点
- ❌ **需要 CORS 配置**：R2、S3 等必须配置正确的 CORS 头
- ❌ **配置依赖**：不配置就无法工作
- ❌ **更复杂**：需要理解 CORS 原理

---

## 🔧 R2 CORS 配置（使用 Worker fetch 方案）

### 方法 1：使用 Wrangler CLI（推荐）

```bash
# 安装 Wrangler
npm install -g wrangler

# 配置 R2 CORS 策略
npx wrangler r2 bucket cors put mo-gallery-photos \
  --account-id YOUR_ACCOUNT_ID \
  --access-key YOUR_ACCESS_KEY \
  --allowed-origins="https://dev.mo-gallery.shaio.top,https://mo-gallery.shaio.top,https://*.shaio.top" \
  --allowed-methods="GET,HEAD" \
  --allowed-headers="*" \
  --expose-headers="Content-Length,Content-Type,ETag" \
  --max-age=3600

# 验证配置
npx wrangler r2 bucket cors get mo-gallery-photos \
  --account-id YOUR_ACCOUNT_ID \
  --access-key YOUR_ACCESS_KEY
```

### 方法 2：通过 Cloudflare Dashboard

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 导航到：**R2 → 选择 Bucket → Settings → CORS Policy**
3. 点击 **Edit** 或 **Create** CORS Policy
4. 添加以下规则：

```json
[
  {
    "AllowedOrigins": [
      "https://dev.mo-gallery.shaio.top",
      "https://mo-gallery.shaio.top",
      "https://*.shaio.top",
      "*"  // 测试时可以用
    ],
    "AllowedMethods": [
      "GET",
      "HEAD",
      "OPTIONS"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "Content-Length",
      "Content-Type",
      "ETag",
      "Last-Modified"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

### 方法 3：通过 Terraform（如果是基础设施即代码）

```hcl
# Cloudflare R2 CORS 配置
resource "cloudflare_r2_bucket_cors_configuration" "mo_gallery" {
  bucket = cloudflare_r2_bucket.photos.id
  cors_configurations {
    allowed_origins = [
      "https://dev.mo-gallery.shaio.top",
      "https://mo-gallery.shaio.top",
      "*"
    ]
    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    allowed_headers = ["*"]
    expose_headers = ["Content-Length", "Content-Type"]
    max_age_seconds = 3600
  }
}
```

### 方法 4：AWS S3（如果使用 S3）

```bash
# 使用 AWS CLI
aws s3api put-bucket-cors \
  --bucket mo-gallery-photos \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedOrigins": [
        "https://dev.mo-gallery.shaio.top",
        "https://mo-gallery.shaio.top"
      ],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["Content-Length", "Content-Type"],
      "MaxAgeSeconds": 3600
    }]
  }'
```

---

## 📊 方案对比总结

| 特性 | HTMLImage 方案 | Worker fetch 方案 |
|------|-----------------|------------------|
| CORS 绕过 | ✅ 自动 | ⚠️ 需要配置 |
| 后端依赖 | ❌ 无需 | ✅ 需要 R2 CORS |
| 逻辑一致性 | ⚠️ 不同 | ✅ 与 Afirmory 相同 |
| 主线程阻塞 | ⚠️ 轻微 | ✅ 完全后台 |
| 配置难度 | ✅ 简单 | ⚠️ 需要理解 CORS |
| 兼容性 | ✅ 所有浏览器 | ⚠️ 取决于 CORS 配置 |

---

## 💡 推荐策略

### 短期（当前阶段）：继续使用 HTMLImage 方案

**原因**：
1. ✅ 立即解决所有 CORS 问题
2. ✅ 不需要修改 R2 配置
3. ✅ 快速上线，不影响用户

**建议**：
- 保持当前实现
- 添加详细注释说明两种方案
- 作为文档记录

---

### 长期（优化阶段）：切换到 Worker fetch 方案

**条件**：
1. 配置 R2 CORS 策略
2. 测试验证跨域请求正常
3. 有时间进行全面测试

**步骤**：
1. 在 R2 配置正确的 CORS 策略
2. 创建新的分支切换方案
3. 测试各种场景（不同 CDN、不同浏览器）
4. 合并到主分支

---

## 🔍 为什么 Afirmory 没问题？

可能的原因：

### 1. R2 CORS 已正确配置

Afirmory 的 R2 Bucket 配置了完整的 CORS 策略：

```json
{
  "AllowedOrigins": ["https://*.afilmory.art", "https://*.afilmory.com"],
  "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
  "AllowedHeaders": ["*"],
  "ExposeHeaders": ["Content-Length", "Content-Type"],
  "MaxAgeSeconds": 3600
}
```

### 2. 使用了 API 代理

Afirmory 可能通过自己的 API 代理图片请求：

```
浏览器 → Afilmory API → R2 Bucket
         (同域)
```

这样避免了跨域问题。

### 3. 域名结构不同

Afirmory 可能使用：
- API：`api.afilmory.art`
- 图片：`cdn.afilmory.art`

如果两者在同一个主域，即使子域不同，某些浏览器也可能豁免 CORS。

---

## 📝 切换指南

如果想从 HTMLImage 切换到 Worker fetch：

### 步骤 1：配置 R2 CORS

```bash
# 使用 wrangler 配置
npx wrangler r2 bucket cors put mo-gallery-photos \
  --allowed-origins="https://dev.mo-gallery.shaio.top,https://*.shaio.top" \
  --allowed-methods="GET,HEAD,OPTIONS" \
  --allowed-headers="*" \
  --expose-headers="Content-Length,Content-Type" \
  --max-age=3600
```

### 步骤 2：修改 WebGLImageViewerEngine.ts

```typescript
// 1. 移除 loadMainImage() 方法
// 删除这段代码：
private loadMainImage(url: string): Promise<ImageBitmap> {
  // ...
}

// 2. 修改 loadImage() 方法
async loadImage(url: string, preknownWidth?: number, preknownHeight?: number): Promise<void> {
  // 移除对 loadMainImage() 的调用
  // 改为直接发送消息给 Worker：
  this.worker?.postMessage({
    type: 'load-image',
    payload: { url },
  })
}

// 3. 修改 Worker 代码
const TextureWorkerRaw = `
// 添加 'load-image' case
case 'load-image': {
  const { url } = payload
  try {
    const response = await fetch(url, { mode: 'cors' })
    const blob = await response.blob()
    originalImage = await createImageBitmap(blob)
    // ...
  } catch (error) {
    console.error('[Worker] Error loading image:', error)
  }
  break
}
`
```

### 步骤 3：测试验证

1. 清除浏览器缓存
2. 打开开发者工具，查看 Network 标签
3. 切换照片，检查是否还有 CORS 错误
4. 查看图片请求的响应头，确认 CORS 正常工作

---

## 🎯 总结

| 方案 | 适合场景 | 优先级 |
|------|----------|--------|
| **HTMLImage** | 快速上线、无需配置 | 🔥 短期 |
| **Worker fetch** | 长期优化、逻辑统一 | ⭐ 长期 |

**当前状态**：✅ 使用 HTMLImage 方案（解决所有 CORS 问题）
**未来计划**：🔄 可选择切换到 Worker fetch（需 R2 CORS 配置）

---

## 📚 参考资料

- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [MDN: HTMLImage.crossOrigin](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/crossOrigin)
- [Cloudflare R2 CORS](https://developers.cloudflare.com/r2/data-access/s3-api/#cors)
- [AWS S3 CORS](https://docs.aws.amazon.com/AmazonS3/latest/userguide/enabling-cors-examples.html)
- [Afirmory WebGL Viewer](https://github.com/Afirmory/Afirmory/tree/main/packages/webgl-viewer)
