import { NextResponse } from "next/server";

import { API_URL } from "@/constants";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const res = await fetch(`${API_URL}/api/auth/local`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { message: data?.error?.message || "Ошибка авторизации" },
        { status: 401 }
      );
    }
    // data.jwt, data.user.role.name
    const response = NextResponse.json({ ok: true });
    response.cookies.set("garant_token", data.jwt, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 дней
    });
    response.cookies.set("user_role", data.user.role.name, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch {
    return NextResponse.json({ message: "Ошибка сервера" }, { status: 500 });
  }
}
