import { NextResponse } from "next/server";

import { API_URL } from "@/constants";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const loginRes = await fetch(`${API_URL}/api/auth/local`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: email, password }),
    });

    let loginData;
    try {
      loginData = await loginRes.json();
    } catch (err) {
      const raw = await loginRes.text();
      console.error("JSON parse error:", err, "Raw:", raw);
      return NextResponse.json(
        { message: "Strapi вернул не-JSON" },
        { status: 502 }
      );
    }

    if (!loginRes.ok) {
      return NextResponse.json(
        { message: loginData?.error?.message || "Неверный логин или пароль" },
        { status: 401 }
      );
    }

    const jwt = loginData.jwt;
    let fullUser = loginData.user;
    let roleName = fullUser?.role?.name;
    let roleId = fullUser?.role?.id;

    // если нет роли — добираем из /users/me
    if (!roleName || !roleId) {
      const meRes = await fetch(`${API_URL}/api/users/me?populate=role`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });

      if (meRes.ok) {
        fullUser = await meRes.json();
        roleName = fullUser?.role?.name;
        roleId = fullUser?.role?.id;
      } else {
        console.warn("Cannot fetch /users/me:", await meRes.text());
      }
    }

    if (!jwt) {
      return NextResponse.json(
        { message: "Strapi не вернул JWT" },
        { status: 502 }
      );
    }

    const res = NextResponse.json({
      ok: true,
      role: roleName ?? null,
      roleId: roleId ?? null,
      user: {
        id: fullUser.id,
        username: fullUser.username,
        email: fullUser.email,
        role: fullUser.role,
      },
    });

    res.cookies.set("garant_token", jwt, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    if (roleName) {
      res.cookies.set("user_role", roleName, {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }

    if (roleId) {
      res.cookies.set("user_role_id", String(roleId), {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }

    return res;
  } catch (err) {
    console.error("API /api/login fatal:", err);
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
