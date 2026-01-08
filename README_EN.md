<div align="center">

# 📸 MO Gallery

**A modern, feature-rich photo gallery application with integrated backend**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Hono](https://img.shields.io/badge/Hono-API-orange?style=flat-square)](https://hono.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

English | [中文](README.md)

</div>

---

## ✨ Features

### 📷 Photo Gallery
- **Multiple View Modes** - Grid, Masonry (waterfall), and Timeline views with smooth transitions
- **EXIF Data Extraction** - Automatically extracts camera, lens, aperture, shutter speed, ISO, and more
- **Dominant Color Extraction** - Automatically extracts primary colors from images for beautiful placeholders
- **Album Management** - Organize photos into albums with cover images
- **Batch Upload** - Upload multiple photos with progress tracking and album selection
- **Photo Pagination** - Efficient pagination for large photo collections
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices

### 📖 Stories / Narratives
- Create photo stories by combining multiple images
- **Milkdown WYSIWYG Editor** - Typora-like Markdown editing experience
- Beautiful story presentation layout
- Photo management within stories (add/remove/reorder photos)
- Support for cover photo selection

### ✍️ Blog System
- **Milkdown WYSIWYG Editor** - What-you-see-is-what-you-get Markdown editing
- Slash command menu (type "/" to quickly insert content)
- Drag handle for paragraph reordering
- Toolbar formatting support
- One-click photo insertion from gallery
- Publish/draft status management

### 👥 Friend Links (They Page)
- Showcase your friends and their websites
- Customizable avatars and descriptions
- Admin management interface for friend links
- Beautiful card-based display layout

### 💬 Comment System
- **Linux DO OAuth Integration** - Seamless authentication with Linux DO accounts
- Comment moderation in admin panel
- Display Linux DO usernames and trust levels
- Optional: Restrict comments to Linux DO users only

### 🔐 Admin Dashboard
- **Photo Management** - Comprehensive photo management with filtering and pagination
- **Reusable Photo Selector** - Modal component for selecting photos across the app
- **Album Management** - Create, edit, and organize albums
- **Story Management** - Create and manage photo stories with photo selection and ordering
- **Friend Links Management** - Add, edit, and remove friend links
- **Blog Editor** - Milkdown WYSIWYG editor
- **System Settings** - Configure site title, description, social links, and more
- **Comment Moderation** - Review and manage user comments
- **Activity Logs** - Track admin actions and system events

### 🏠 Homepage
- **Dynamic Hero Section** - Random hero images from your gallery
- **Particle Effects** - Beautiful animated particle background
- **Auto Carousel** - Automatic image slideshow
- **Scroll Animations** - Smooth scroll-triggered animations

### 🌍 Internationalization
- Chinese (中文) and English support
- Easy to extend for more languages
- Comprehensive i18n coverage across all pages

### 🎨 Theming
- Dark and Light mode support
- Smooth theme transitions
- System preference detection
- Consistent styling across all components

### ☁️ Multiple Storage Backends
- **Local Storage** - Store files on local filesystem
- **GitHub** - Use GitHub repository as storage
- **Cloudflare R2** - S3-compatible object storage

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript 5 |
| **API** | Hono.js |
| **Database ORM** | Prisma |
| **Styling** | Tailwind CSS 4 |
| **Animation** | Framer Motion |
| **Database** | PostgreSQL (dev/prod) |
| **Image Processing** | Sharp, ExifReader |
| **Markdown Editor** | Milkdown (Crepe) |
| **Authentication** | JWT, Linux DO OAuth |
| **State Management** | React Context |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- PostgreSQL

### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/mo-gallery.git
cd mo-gallery

# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env
# Edit .env file with your settings

# Initialize database
pnpm run prisma:dev

# Start development server
pnpm run dev
```

Visit `http://localhost:3000` to see your gallery!

### Minimal Environment Variables

```env
# Database
DATABASE_URL="postgre:xxx"
DIRECT_URL="postgre:xxx"

# JWT Secret (change in production!)
JWT_SECRET="your-secret-key"

# Admin credentials (for initial seed)
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"
```

---

## ⚙️ Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection URL | `file:./dev.db` or PostgreSQL URL |
| `DIRECT_URL` | Direct database URL (for migrations) | Same as DATABASE_URL |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_USERNAME` | Admin username for seed | `admin` |
| `ADMIN_PASSWORD` | Admin password for seed | `admin123` |
| `NEXT_PUBLIC_ADMIN_LOGIN_URL` | Hidden admin login path | - |
| `SITE_TITLE` | Site title | `MO GALLERY` |
| `CDN_DOMAIN` | CDN domain for assets | - |

### Linux DO OAuth (Optional)

| Variable | Description |
|----------|-------------|
| `LINUXDO_CLIENT_ID` | OAuth Client ID |
| `LINUXDO_CLIENT_SECRET` | OAuth Client Secret |
| `LINUXDO_REDIRECT_URI` | Callback URL (e.g., `https://your-domain.com/login/callback`) |
| `LINUXDO_COMMENTS_ONLY` | Restrict comments to Linux DO users (`true`/`false`) |

---

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Start with PostgreSQL
docker-compose up -d

# View logs
docker-compose logs -f
```

### Manual Docker Build

```bash
# Build image
docker build -t mo-gallery .

# Run container
docker run -p 3000:3000 --env-file .env mo-gallery
```

---

## ▲ Vercel Deployment

1. **Fork** this repository
2. **Import** the project in Vercel
3. **Configure** environment variables (see `.env.example`)
4. **Set** build command to `pnpm run build:vercel`
5. **Use** Neon or Supabase as your database

> ⚠️ **Note**: Local storage is not supported on Vercel. Use GitHub or R2 storage instead.

### Database Options for Vercel

- **[Neon](https://neon.tech/)** - Serverless PostgreSQL (recommended)
- **[Supabase](https://supabase.com/)** - PostgreSQL with additional features
- **[PlanetScale](https://planetscale.com/)** - MySQL-compatible serverless database

---

## 📁 Project Structure

```
mo-gallery-web/
├── prisma/                  # Database schema and migrations
│   ├── schema.prisma        # Prisma model definitions
│   ├── seed.ts              # Database seeding script
│   └── migrations/          # Migration history
├── server/lib/              # Server-side utilities
│   ├── db.ts                # Prisma client singleton
│   ├── jwt.ts               # JWT utilities
│   ├── exif.ts              # EXIF extraction
│   ├── colors.ts            # Dominant color extraction
│   └── storage/             # Storage abstraction layer
│       ├── types.ts         # Interface definitions
│       ├── factory.ts       # Factory function
│       ├── local.ts         # Local storage implementation
│       ├── github.ts        # GitHub storage implementation
│       └── r2.ts            # R2 storage implementation
├── hono/                    # API routes (Hono.js)
│   ├── index.ts             # Route aggregation
│   ├── auth.ts              # Authentication & Linux DO OAuth
│   ├── photos.ts            # Photo management with pagination
│   ├── albums.ts            # Album management
│   ├── stories.ts           # Stories/Narratives
│   ├── blogs.ts             # Blog posts
│   ├── comments.ts          # Comments with user info
│   ├── friends.ts           # Friend links management
│   ├── settings.ts          # System settings
│   └── middleware/          # Auth middleware
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API entry point (Hono integration)
│   │   ├── admin/           # Admin dashboard pages
│   │   │   ├── photos/      # Photo management
│   │   │   ├── albums/      # Album management
│   │   │   ├── friends/     # Friend links management
│   │   │   ├── settings/    # System settings
│   │   │   └── logs/        # Activity logs
│   │   ├── gallery/         # Public gallery page
│   │   ├── story/           # Story pages
│   │   ├── blog/            # Blog pages
│   │   ├── they/            # Friend links page
│   │   └── login/           # Login pages (admin & OAuth callback)
│   ├── components/          # React components
│   │   ├── MilkdownEditor.tsx    # WYSIWYG Markdown editor
│   │   ├── MilkdownViewer.tsx    # Read-only Markdown renderer
│   │   ├── admin/           # Admin-specific components
│   │   │   ├── PhotoSelectorModal.tsx  # Reusable photo selector
│   │   │   ├── PhotoDetailPanel.tsx    # Photo detail editing
│   │   │   └── AdminSidebar.tsx        # Admin navigation
│   │   ├── gallery/         # Gallery view components
│   │   │   ├── GridView.tsx
│   │   │   ├── MasonryView.tsx
│   │   │   └── TimelineView.tsx
│   │   └── ui/              # Common UI components
│   ├── contexts/            # React Context providers
│   │   ├── AuthContext.tsx          # Authentication state
│   │   ├── ThemeContext.tsx         # Theme management
│   │   ├── LanguageContext.tsx      # i18n state
│   │   ├── SettingsContext.tsx      # Site settings
│   │   └── UploadQueueContext.tsx   # Upload queue management
│   └── lib/                 # Frontend utilities
│       ├── api.ts           # API client with auth
│       ├── i18n.ts          # Internationalization strings
│       └── utils.ts         # Helper functions
└── public/                  # Static assets
```

---

## 📝 Development Commands

```bash
# Development
pnpm run dev           # Start development server
pnpm run build         # Build for production
pnpm run start         # Start production server
pnpm run lint          # Run ESLint

# Database
pnpm run prisma:dev      # Create and apply migrations (development)
pnpm run prisma:deploy   # Apply migrations (production)
pnpm run prisma:generate # Generate Prisma client
pnpm run prisma:seed     # Initialize admin account
pnpm run prisma:studio   # Open Prisma Studio
```

---

## 🔄 Recent Updates

### 2026-01-01
- ✨ **Milkdown Editor** - Integrated WYSIWYG Markdown editor with Slash commands, drag handles, and toolbar
- 📖 **MilkdownViewer** - New read-only Markdown rendering component with consistent styling
- 📸 **Photo Selector** - Reusable photo selection modal with filtering and album support
- 🖼️ **Photo Management Enhancement** - Album selection during upload, improved photo grid UI
- 📄 **Photo Pagination** - Efficient pagination, improved story photo management
- 👥 **Friend Links** - Added friend links management and public display page (`/they`)
- 🔐 **Linux DO OAuth** - Integrated Linux DO account binding and authentication
- 🏠 **Homepage Enhancement** - Dynamic particle effects, auto carousel, random hero images
- 🌐 **i18n Updates** - Comprehensive internationalization for all new features
- 🐛 **Bug Fixes** - Fixed mobile menu state, login page Suspense wrapper

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ by MO Gallery Contributors**

[Report Bug](https://github.com/yourusername/mo-gallery/issues) · [Request Feature](https://github.com/yourusername/mo-gallery/issues)

</div>