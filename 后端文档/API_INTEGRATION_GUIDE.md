# MO GALLERY API 对接文档 v1.1

本文档基于 NestJS 后端服务生成，用于指导前端 (Next.js) 进行接口对接。

---

## 1. 基础信息

- **Base URL**: `http://localhost:8787` (开发环境)
- **数据格式**: `application/json`
- **认证方式**: JWT (Bearer Token)
  - 登录后获取 Token，需放在请求头的 `Authorization` 字段中：
  - `Authorization: Bearer <your_token>`

---

## 2. 公共接口 (Public)

### 2.1 获取照片列表
- **URL**: `GET /api/photos`
- **Query 参数**:
  - `category` (可选): 分类名称 (例如: `自然`, `城市`)。若为 `全部` 或不传，则返回所有。
  - `limit` (可选): 返回的照片数量。
- **响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-123",
      "title": "山间晨雾",
      "category": "自然",
      "url": "/uploads/random-name.jpg",
      "width": 3000,
      "height": 4000,
      "isFeatured": false,
      "createdAt": "2025-12-19T05:36:04.000Z"
    }
  ]
}
```

### 2.2 获取精选照片 (首页展示)
- **URL**: `GET /api/photos/featured`
- **说明**: 返回标记为 `isFeatured: true` 的最新 6 张照片。

### 2.3 获取全部分类
- **URL**: `GET /api/categories`
- **响应示例**:
```json
{
  "success": true,
  "data": ["全部", "自然", "城市", "建筑"]
}
```

---

## 3. 认证接口 (Auth)

### 3.1 管理员登录
- **URL**: `POST /api/auth/login`
- **Body**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```
- **响应示例**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 4. 管理端接口 (Admin - 需 Token)

### 4.1 上传照片
- **URL**: `POST /api/admin/photos`
- **Content-Type**: `multipart/form-data`
- **Headers**: `Authorization: Bearer <Token>`
- **FormData 字段**:
  - `file`: 图片文件 (二进制)
  - `title`: 字符串 (标题)
  - `category`: 字符串 (分类)
- **说明**: 系统会自动通过 `sharp` 获取图片的 `width` 和 `height` 并保存。

### 4.2 删除照片
- **URL**: `DELETE /api/admin/photos/:id`
- **Headers**: `Authorization: Bearer <Token>`

### 4.3 获取系统设置
- **URL**: `GET /api/admin/settings`
- **Headers**: `Authorization: Bearer <Token>`
- **响应示例**:
```json
{
  "success": true,
  "data": {
    "site_title": "MO GALLERY",
    "storage_provider": "local",
    "cdn_domain": ""
  }
}
```

### 4.4 修改系统设置
- **URL**: `PATCH /api/admin/settings`
- **Headers**: `Authorization: Bearer <Token>`
- **Body**: (Key-Value 键值对)
```json
{
  "site_title": "我的摄影集",
  "cdn_domain": "https://cdn.example.com"
}
```

---

## 5. 静态资源访问

后端已配置静态目录，前端可以通过以下方式拼接图片 URL：
- **图片路径**: `${BaseURL}${photo.url}`
- **示例**: `http://localhost:8787/uploads/abc12345.jpg`

---

## 6. 状态码参考

| HTTP 状态码 | 含义 |
| :--- | :--- |
| `200/201` | 请求成功 |
| `401` | Token 无效或过期，需跳转至登录页 |
| `403` | 权限不足 |
| `400` | 参数错误 (Validation Error) |
| `500` | 服务器内部错误 |
