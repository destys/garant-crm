import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("garant_token")?.value;

  // Разрешаем доступ к /login без токена
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    if (token) {
      // Если уже авторизован — редирект на главную
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Для всех остальных страниц — только с токеном
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // TODO: здесь можно добавить валидацию токена через Strapi, если нужно
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|public|api).*)"],
};
