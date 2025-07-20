import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import Header from '@/components/Header';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Map2 - 네이버 지도 기반 실시간 위치정보 서비스",
  description: "버스킹, 커뮤니티, 레슨, 실시간이벤트, 나요기, 핫스팟 등 다양한 실시간 위치정보를 네이버 지도에서 확인하세요. 네이버 지도에서 찾을 수 없는 유동적인 정보를 제공합니다.",
  keywords: "지도, 네이버 지도, 버스킹, 커뮤니티, 레슨, 실시간이벤트, 나요기, 핫스팟, 위치정보, 실시간 지도",
  authors: [{ name: "Map2 Team" }],
  creator: "Map2",
  publisher: "Map2",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://map2-service.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Map2 - 실시간 위치정보 서비스",
    description: "버스킹, 커뮤니티, 레슨 등 다양한 실시간 위치정보를 네이버 지도에서 확인하세요",
    url: 'https://map2-service.vercel.app',
    siteName: 'Map2',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Map2 - 실시간 위치정보 서비스',
    description: '버스킹, 커뮤니티, 레슨 등 다양한 실시간 위치정보를 네이버 지도에서 확인하세요',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'naver-site-verification': '4e6d48a4295fd6ac1779e2773e70b5983dd63084',
    'google-site-verification': 'bCOlrGp2aoNNqEk2iIlfEMQsVtVlU_iK0wnd3hF1s-A',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <AuthProvider>
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
