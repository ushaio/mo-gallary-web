# 器材筛选功能设计方案

## 背景

当前照片库的器材筛选是从照片数据中动态提取的，存在以下问题：
1. 需要等照片加载完才能显示筛选选项
2. 没有镜头筛选
3. 数据不规范，同一设备可能因 EXIF 格式不同而显示为多个选项

## 最终方案

### 筛选条件
- **相机筛选** - 基于 Camera 表
- **镜头筛选** - 基于 Lens 表
- **移除焦段筛选** - 焦段保留在 Photo 表中，但不作为筛选条件

### 数据库结构

创建两个新表：`Camera` 和 `Lens`，并在 `Photo` 表中添加外键关联。

```prisma
model Camera {
  id        String   @id @default(uuid())
  make      String   // 品牌，如 "Canon", "Sony", "Nikon"（已标准化）
  model     String   // 型号，如 "EOS R5", "A7M4"
  createdAt DateTime @default(now())
  
  photos    Photo[]
  
  @@unique([make, model])
  @@index([make])
}

model Lens {
  id        String   @id @default(uuid())
  make      String?  // 品牌，如 "Canon", "Sony", "Sigma"（已标准化）
  model     String   // 型号，如 "RF 50mm F1.2L USM"
  createdAt DateTime @default(now())
  
  photos    Photo[]
  
  @@unique([make, model])
  @@index([make])
}

model Photo {
  // ... 现有字段 ...
  
  // 新增外键关联
  cameraId  String?
  lensId    String?
  
  camera    Camera?  @relation(fields: [cameraId], references: [id])
  lens      Lens?    @relation(fields: [lensId], references: [id])
  
  // 保留原有 EXIF 字段用于存储原始数据
  cameraMake   String?
  cameraModel  String?
  lensModel    String?  // 原 lens 字段重命名
  focalLength  String?  // 保留，但不用于筛选
  // ...
}
```

### 品牌名称标准化

在创建器材记录时，自动标准化品牌名称：

```typescript
function normalizeMake(make: string): string {
  const normalized = make.trim()
  // 首字母大写，其余小写
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase()
}

// 常见品牌映射
const BRAND_MAP: Record<string, string> = {
  'CANON': 'Canon',
  'SONY': 'Sony',
  'NIKON': 'Nikon',
  'FUJIFILM': 'Fujifilm',
  'PANASONIC': 'Panasonic',
  'OLYMPUS': 'Olympus',
  'LEICA': 'Leica',
  'SIGMA': 'Sigma',
  'TAMRON': 'Tamron',
  'ZEISS': 'Zeiss',
}
```

### API 设计

#### 1. 获取器材列表（公开 API，用于筛选下拉）

```
GET /api/cameras
Response: { success: true, data: Camera[] }

GET /api/lenses
Response: { success: true, data: Lens[] }
```

#### 2. 照片上传时自动匹配/创建器材

在 `hono/photos.ts` 的上传逻辑中：
1. 从 EXIF 提取 cameraMake 和 cameraModel
2. 标准化品牌名称
3. 查找或创建 Camera 记录
4. 从 EXIF 提取 lens 信息
5. 查找或创建 Lens 记录
6. 将 cameraId 和 lensId 关联到 Photo

### 前端筛选

#### PhotosTab 组件修改

1. 组件加载时调用 `/api/cameras` 和 `/api/lenses` 获取筛选选项
2. 添加相机、镜头两个筛选下拉
3. 移除焦段筛选
4. 筛选逻辑基于 cameraId 和 lensId

### 数据迁移

需要编写迁移脚本，将现有照片的 cameraMake/cameraModel 和 lens 字段数据迁移到新表：

1. 遍历所有照片
2. 根据 cameraMake + cameraModel 创建或查找 Camera 记录（标准化品牌名称）
3. 根据 lens 字段创建或查找 Lens 记录
4. 更新 Photo 的 cameraId 和 lensId

## 实现步骤

1. [x] 设计器材表结构
2. [ ] 创建数据库迁移（添加 Camera、Lens 表和 Photo 外键）
3. [ ] 创建器材 API（GET /api/cameras, GET /api/lenses）
4. [ ] 修改照片上传逻辑，自动匹配或创建器材记录
5. [ ] 编写数据迁移脚本，处理现有照片数据
6. [ ] 更新 PhotosTab 组件，使用独立的器材 API
7. [ ] 添加镜头筛选，移除焦段筛选
8. [ ] 添加 i18n 翻译（admin.lens）

## 注意事项

1. **向后兼容**：保留原有的 cameraMake、cameraModel 字段，用于存储原始 EXIF 数据
2. **字段重命名**：Photo.lens 重命名为 Photo.lensModel，避免与关联字段冲突
3. **数据规范化**：在创建器材记录时，自动标准化品牌名称
4. **性能优化**：器材列表可以缓存，因为变化不频繁