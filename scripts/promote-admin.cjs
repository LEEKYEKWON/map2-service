/**
 * One-off: promote a user to ADMIN by email.
 * Usage: node scripts/promote-admin.cjs <email>
 */
const { PrismaClient } = require('@prisma/client')

const email = process.argv[2]
if (!email) {
  console.error('Usage: node scripts/promote-admin.cjs <email>')
  process.exit(1)
}

async function main() {
  const prisma = new PrismaClient()
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      console.error('No user found for email:', email)
      process.exit(1)
    }
    const updated = await prisma.user.update({
      where: { email },
      data: {
        role: 'ADMIN',
        isBusker: true,
        isBusiness: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBusker: true,
        isBusiness: true
      }
    })
    console.log('Updated:', JSON.stringify(updated, null, 2))
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
