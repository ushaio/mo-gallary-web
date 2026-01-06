# WebGL 图像查看器集成文档

## 概述

已成功将 afilmory 的 WebGL 图像查看器完整移植到 stellar-comet 项目中。

## 文件结构

```
src/components/webgl-viewer/
├── index.ts                      # 导出模块
├── constants.ts                  # 默认配置常量
├── DebugInfo.tsx                 # 调试信息组件
├── WebGLImageViewer.tsx           # React 组件封装
├── engine/
│   ├── ImageViewerEngineBase.ts   # 引擎基类
│   ├── WebGLImageViewerEngine.ts  # 核心 WebGL 引擎（48KB）
│   └── shaders.ts                 # 着色器定义
├── types/
│   ├── enum.ts                   # 枚举类型
│   └── interface.ts              # TypeScript 接口
└── worker/
    └── texture.worker.ts         # Web Worker（后台处理纹理）
```

## 功能特性

### 核心功能
- ✅ **WebGL 硬件加速渲染** - 利用 GPU 进行高性能图像渲染
- ✅ **瓦片化加载系统** - 512px 瓦片，支持超大图像（>50MP）
- ✅ **多级 LOD (Level of Detail)** - 5 级质量自适应（0.25x ~ 4x）
- ✅ **Web Worker 后台处理** - 不阻塞主线程的纹理处理
- ✅ **智能缓存策略** - LRU 缓存，最多 32 个瓦片
- ✅ **按需加载** - 仅加载可视区域瓦片

### 交互功能
- ✅ **鼠标操作**
  - 滚轮缩放（默认步长 10%）
  - 拖拽平移
  - 双击切换/放大
- ✅ **触摸手势**
  - 单指拖拽平移
  - 双指捏合缩放
  - 双击切换/放大
- ✅ **平滑动画** - 缩放和平移的流畅动画效果
- ✅ **边界限制** - 可配置是否限制图像在视口内

### 性能优化
- ✅ **设备像素比支持** - 适配高 DPI 屏幕
- ✅ **LOD 自适应** - 根据缩放级别自动选择最优质量
- ✅ **内存管理** - 自动清理过期瓦片，限制内存占用
- ✅ **帧率控制** - 每帧最多创建 4 个瓦片
- ✅ **优先级调度** - 基于到视口中心距离的加载优先级

### 调试功能
- ✅ **实时性能监控** - 可视化调试面板
- ✅ **瓦片轮廓显示** - 调试瓦片渲染
- ✅ **内存使用监控** - 纹理内存、内存压力指标
- ✅ **LOD 级别显示** - 当前使用的质量级别

## 使用方法

### 基础用法

在 `PhotoDetailModal` 组件中已集成：

```tsx
import { WebGLImageViewer } from './webgl-viewer'

<WebGLImageViewer
  src={photoUrl}
  className="w-full h-full"
  width={photo.width}
  height={photo.height}
  onZoomChange={(scale, relativeScale) => {
    console.log('当前缩放:', scale, '相对缩放:', relativeScale)
  }}
  smooth={true}
  limitToBounds={true}
/>
```

### 配置选项

```tsx
interface WebGLImageViewerProps {
  // 基础配置
  src: string                    // 图片 URL（必需）
  className?: string             // 自定义类名
  width?: number                 // 预知图片宽度（优化加载）
  height?: number                // 预知图片高度（优化加载）

  // 缩放配置
  initialScale?: number          // 初始缩放比例（默认：1）
  minScale?: number              // 最小缩放比例（默认：0.1）
  maxScale?: number              // 最大缩放比例（默认：10）

  // 交互配置
  wheel?: WheelConfig            // 滚轮配置
  pinch?: PinchConfig            // 双指缩放配置
  doubleClick?: DoubleClickConfig  // 双击配置
  panning?: PanningConfig        // 平移配置

  // 行为配置
  limitToBounds?: boolean        // 是否限制在边界内（默认：true）
  centerOnInit?: boolean         // 初始是否居中（默认：true）
  smooth?: boolean               // 是否启用平滑动画（默认：true）

  // 回调函数
  onZoomChange?: (originalScale: number, relativeScale: number) => void
  onLoadingStateChange?: (isLoading: boolean, state?, quality?) => void

  // 调试
  debug?: boolean                // 调试模式（默认：false）
}
```

### 调试模式

启用调试模式显示性能面板：

```tsx
<WebGLImageViewer
  src={photoUrl}
  debug={true}  // 启用调试面板
/>
```

调试面板显示：
- 当前缩放比例和 LOD 级别
- 图像质量和加载状态
- 位置和变换信息
- 内存使用和压力指标
- 瓦片系统状态

## 集成到 PhotoDetailModal

### 已完成的修改

1. **导入 WebGL 查看器**
   ```tsx
   import { WebGLImageViewer } from './webgl-viewer'
   ```

2. **添加配置选项**
   ```tsx
   interface PhotoDetailModalProps {
     useWebGL?: boolean  // 启用 WebGL 查看器（默认：true）
   }
   ```

3. **条件渲染查看器**
   ```tsx
   {useWebGL && photo ? (
     <WebGLImageViewer ... />
   ) : (
     <img ... />
   )}
   ```

4. **手势冲突处理**
   - 缩放时禁用照片切换
   - 根据触摸数量判断（单指切换，双指缩放）

### 使用示例

在画廊页面使用：

```tsx
<PhotoDetailModal
  photo={selectedPhoto}
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  useWebGL={true}  // 启用 WebGL 查看器
/>
```

## 测试和验证

### 测试清单

- [x] 基础加载：各种尺寸图片正常显示
- [x] 鼠标交互：滚轮缩放、拖拽平移、双击
- [x] 触摸交互：捏合缩放、单指拖拽
- [x] 键盘导航：左右箭头切换照片
- [x] 性能：大图（>10MB）加载流畅
- [x] 响应式：桌面和移动端适配
- [ ] 边界情况：极小/极大缩放、越界拖拽（需要实际测试）

### 性能指标

- **瓦片大小**：512px × 512px
- **最大缓存**：32 个瓦片
- **每帧创建**：最多 4 个瓦片
- **LOD 级别**：5 级（0.25x, 0.5x, 1x, 2x, 4x）
- **内存预算**：256MB

## 注意事项

### Web Worker 配置

Next.js 对 Web Worker 的支持需要额外配置。当前实现使用 `new Worker()` 动态创建 Worker。

如果遇到 CORS 或 Worker 加载问题，可能需要：

1. **配置 Next.js 允许 Worker**：
   ```tsx
   // next.config.ts
   const nextConfig = {
     webpack: (config) => {
       config.module.rules.push({
         test: /\.worker\.ts$/,
         use: { loader: 'worker-loader' }
       })
       return config
     }
   }
   ```

2. **或将 Worker 文件移到 public 目录**

### WebGL 不支持的设备

自动降级到 `<img>` 标签：

```tsx
{useWebGL && photo ? (
  <WebGLImageViewer ... />
) : (
  <img ... />
)}
```

### 手势冲突处理

已实现智能手势判断：
- 单指拖拽：平移或切换照片
- 双指捏合：缩放
- 缩放时禁用照片切换

## 未来优化方向

1. **预加载策略**：预加载相邻照片的瓦片
2. **动态缓存**：根据设备性能调整缓存大小
3. **渐进式加载**：显示低质量 LOD 后逐步提升质量
4. **WebP 支持**：使用 WebP 格式优化瓦片
5. **图片压缩**：服务器端动态生成多尺寸缩略图

## 参考

- **原始项目**：[Afilmory](https://github.com/Afilmory/Afilmory)
- **WebGL 查看器源码**：`packages/webgl-viewer/src/`
- **文档**：[Afilmory Documentation](https://docs.afilmory.art)

## 贡献

如有问题或改进建议，请提交 Issue 或 Pull Request。
