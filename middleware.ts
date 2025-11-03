import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { i18n } from '@/i18n.config';

function getLocale(request: NextRequest): string {
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    negotiatorHeaders[key] = value;
  });

  // @ts-ignore locales are readonly
  const locales: string[] = i18n.locales;

  // ดึงภาษาจาก header แล้ว normalize (_ → -)
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();
  const normalizedLanguages = languages
    .filter(Boolean)
    .map((lang) => lang.replace('_', '-'));

  let locale: string;
  try {
    // match locale ที่ browser ส่งมากับที่ config ไว้
    locale = matchLocale(normalizedLanguages, locales, i18n.defaultLocale);
  } catch {
    // fallback ถ้า locale ไม่ถูกต้อง
    locale = i18n.defaultLocale;
  }

  return locale;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ตรวจว่ามี locale ใน path แล้วหรือยัง
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  if (pathnameIsMissingLocale) {
    const locale = getLocale(request) || i18n.defaultLocale;

    // redirect ไป path ที่มี locale prefix เช่น /en, /fr
    const redirectUrl = new URL(
      `/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`,
      request.url
    );

    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  // ignore api/_next/fav
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
