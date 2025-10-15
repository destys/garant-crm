import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Публичные пути, не требующие токена.
 * Если пользователь уже авторизован — редиректим с /login на /
 */
const PUBLIC_PATHS = ["/login"];

/**
 * Матрица доступа по roleId.
 * Строки: точное совпадение или префикс (КРОМЕ "/").
 * RegExp: любая логика.
 * roleId = 3 — доступ ко всем страницам.
 */
const ROLE_ACCESS: Record<number, (string | RegExp)[]> = {
  // 1 — мастер
  1: [
    "/", // только главная!
    "/orders",
    "/account",
    /^\/orders(\/.*)?$/,
    // добавляй нужные страницы явно, напр. "/orders" или /^\/orders(\/.*)?$/
  ],
  // 4 — менеджер
  4: [
    "/",
    "/orders",
    "/accounting",
    "/account",
    "/cashbox",
    /^\/orders(\/.*)?$/,
    "/clients",
    "/reports",
    /^\/reports(\/.*)?$/,
    /^\/settings\/(?:profile|notifications)$/,
  ],
  // 2: [...],
};

/** Нормализация пути (убираем хвостовые слэши, кроме корня) */
function normalizePath(p: string) {
  if (!p) return "/";
  const n = p.replace(/\/+$/g, "");
  return n === "" ? "/" : n;
}

/** Совпадение правила с путём */
function matchesRule(pathname: string, rule: string | RegExp) {
  const path = normalizePath(pathname);

  if (typeof rule === "string") {
    const r = normalizePath(rule);
    if (r === "/") {
      // корень — только точное совпадение
      return path === "/";
    }
    // точное совпадение или префикс с сегментом
    return path === r || path.startsWith(`${r}/`);
  }

  return rule.test(path);
}

/** Проверка доступа для конкретной роли */
function isAllowed(pathname: string, roleId: number | null): boolean {
  if (roleId === 3) return true; // админ — всё можно
  if (!roleId) return false;
  const rules = ROLE_ACCESS[roleId];
  if (!rules || rules.length === 0) return false;
  return rules.some((rule) => matchesRule(pathname, rule));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("garant_token")?.value ?? null;
  const roleIdCookie = request.cookies.get("user_role_id")?.value ?? null;
  const roleId = roleIdCookie ? Number(roleIdCookie) : null;

  // Публичные пути доступны без токена. Если уже авторизован — уводим на главную.
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    if (token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Остальные страницы — только с токеном
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Нет roleId — считаем сессию некорректной
  if (!roleId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Ролевая проверка
  if (!isAllowed(pathname, roleId)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

/**
 * Исключаем ассеты/системные пути/API
 */
export const config = {
  matcher: ["/((?!_next|favicon.ico|public|api).*)"],
};
