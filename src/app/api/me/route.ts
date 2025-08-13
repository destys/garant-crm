import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { API_URL } from "@/constants";

export async function GET() {
  try {
    const jwt = (await cookies()).get("garant_token")?.value;
    if (!jwt) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const meRes = await fetch(`${API_URL}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${jwt}` },
      cache: "no-store",
    });

    if (!meRes.ok) {
      const raw = await meRes.text();
      console.warn("GET /api/me -> /users/me failed:", raw);
      return NextResponse.json(
        { message: "Failed to load user" },
        { status: 502 }
      );
    }

    const me = await meRes.json();

    const roleName = me?.role?.name ?? null;
    const roleId = me?.role?.id ?? null;

    return NextResponse.json({
      ok: true,
      role: roleName,
      roleId,
      user: {
        id: me.id,
        username: me.username,
        email: me.email,
        role: me.role,
        name: me.name,
        balance: me.balance,
        phone: me.phone,
      },
    });
  } catch (e) {
    console.error("API /api/me fatal:", e);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
