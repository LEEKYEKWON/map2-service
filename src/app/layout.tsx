import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import Header from '@/components/Header';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Map2 - 네이버 지도 연동 위치정보 서비스",
  description: "네이버 지도에서 찾을 수 없는 유동적인 위치정보를 제공하는 지도 서비스",
  keywords: "지도, 버스킹, 커뮤니티, 레슨, 실시간이벤트, 나요기, 공유텃밭, 핫스팟",
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
