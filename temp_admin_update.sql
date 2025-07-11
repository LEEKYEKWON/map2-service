-- 특정 사용자를 관리자로 변경하는 SQL 스크립트
-- 사용법: 본인의 이메일 주소로 변경 후 실행

-- 예시: test@example.com 사용자를 관리자로 변경
UPDATE User SET role = 'ADMIN' WHERE email = 'test@example.com';

-- 모든 사용자 목록 확인
SELECT id, email, name, role, isBusker, isBusiness FROM User;

-- 특정 사용자의 권한 확인
-- SELECT id, email, name, role, isBusker, isBusiness FROM User WHERE email = 'your-email@example.com'; 