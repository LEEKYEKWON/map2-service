import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('시드 데이터를 생성합니다...')

  // 기존 데이터 삭제
  await prisma.buskingEvent.deleteMany()
  await prisma.user.deleteMany()

  // 관리자 계정
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@map2.com',
      name: '관리자',
      password: adminPassword,
      role: 'ADMIN',
      isBusker: false,
      isBusiness: false
    }
  })

  // 버스커 계정
  const buskerPassword = await bcrypt.hash('busker123', 12)
  const busker = await prisma.user.create({
    data: {
      email: 'busker@map2.com',
      name: '거리의 음악가',
      password: buskerPassword,
      role: 'USER',
      isBusker: true,
      isBusiness: false
    }
  })

  // 자영업자 계정
  const businessPassword = await bcrypt.hash('business123', 12)
  const business = await prisma.user.create({
    data: {
      email: 'business@map2.com',
      name: '카페사장',
      password: businessPassword,
      role: 'USER',
      isBusker: false,
      isBusiness: true
    }
  })

  // 일반 사용자 계정
  const userPassword = await bcrypt.hash('user123', 12)
  const user = await prisma.user.create({
    data: {
      email: 'user@map2.com',
      name: '일반사용자',
      password: userPassword,
      role: 'USER',
      isBusker: false,
      isBusiness: false
    }
  })

  // 버스킹 이벤트 데이터
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(19, 0, 0, 0)

  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  nextWeek.setHours(15, 30, 0, 0)

  await prisma.buskingEvent.createMany({
    data: [
      {
        name: '홍대 거리 기타 공연',
        dateTime: tomorrow,
        description: '어쿠스틱 기타로 감성적인 음악을 들려드립니다. 함께 즐겨요!',
        imageUrl: 'https://via.placeholder.com/300x200/8B5CF6/FFFFFF?text=Guitar+Performance',
        latitude: 37.5563,
        longitude: 126.9236,
        userId: busker.id
      },
      {
        name: '강남역 버스킹 공연',
        dateTime: nextWeek,
        description: '트로트부터 발라드까지! 신나는 라이브 공연을 준비했습니다.',
        imageUrl: 'https://via.placeholder.com/300x200/10B981/FFFFFF?text=Live+Show',
        latitude: 37.4979,
        longitude: 127.0276,
        userId: busker.id
      }
    ]
  })

  console.log('✅ 시드 데이터 생성 완료!')
  console.log('테스트 계정:')
  console.log('- 관리자: admin@map2.com / admin123')
  console.log('- 버스커: busker@map2.com / busker123')
  console.log('- 자영업자: business@map2.com / business123')
  console.log('- 일반사용자: user@map2.com / user123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 