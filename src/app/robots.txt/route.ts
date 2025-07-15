import { NextResponse } from 'next/server'

export async function GET() {
  const robots = `User-agent: *
Allow: /

Disallow: /admin/
Disallow: /api/

Sitemap: https://map2.vercel.app/sitemap.xml`

  return new NextResponse(robots, {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
} 