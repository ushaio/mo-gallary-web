import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME?.trim() || 'admin'
  const adminPlainPassword = process.env.ADMIN_PASSWORD?.trim() || 'admin123'
  const adminPassword = await bcrypt.hash(adminPlainPassword, 10)
  const shouldUpdatePassword = Boolean(process.env.ADMIN_PASSWORD?.trim())

  const admin = await prisma.user.upsert({
    where: { username: adminUsername },
    update: shouldUpdatePassword ? { password: adminPassword } : {},
    create: {
      username: adminUsername,
      password: adminPassword,
    },
  })

  const settings = [
    { key: 'site_title', value: 'MO GALLERY' },
    { key: 'storage_provider', value: 'local' },
    { key: 'cdn_domain', value: '' },
  ]

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }

  console.log(
    `Seed data created successfully (admin: ${admin.username}${
      shouldUpdatePassword ? ', password updated' : ''
    })`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
