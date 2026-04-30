// Routing Middleware (framework-agnostic) — Basic Auth gate.
// 위치: project root (Vercel 가 source root 의 middleware.js 만 함수로 등록).
// public/ 안에 두면 outputDirectory 의 정적 자산으로 처리되어 인식 X.
// 환경 변수: SITE_USER, SITE_PASS (Vercel project Settings → Environment Variables).

export const config = { matcher: '/((?!_next|favicon).*)' };

export default function middleware(req) {
  const USER = process.env.SITE_USER || 'admin';
  const PASS = process.env.SITE_PASS || 'changeme';
  const auth = req.headers.get('authorization');
  const expected = 'Basic ' + btoa(USER + ':' + PASS);
  if (auth !== expected) {
    return new Response('Authentication required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="major-study"' }
    });
  }
}
