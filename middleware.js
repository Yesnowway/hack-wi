import { blockedIps } from './blocked-ips.js';

export async function middleware(request) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '0.0.0.0';
  if (blockedIps.includes(ip)) {
    return new Response('🚫 Access Denied – Your IP is blocked', { status: 403 });
  }
  return fetch(request);
}

export const config = {
  matcher: ['/(.*)'],
};
