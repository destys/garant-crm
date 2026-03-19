import crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";

function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

const MANGO_API_URL = "https://app.mango-office.ru/vpbx/queries/recording/post";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recordingId: string }> }
) {
  try {
    const { recordingId } = await params;

    if (!recordingId) {
      return NextResponse.json(
        { error: "Recording ID is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.MANGO_API_KEY || process.env.MANGO_VPBX_API_KEY;
    const apiSalt =
      process.env.MANGO_API_SALT ||
      process.env.MANGO_API_SECRET ||
      process.env.MANGO_API_SKEY;

    if (!apiKey || !apiSalt) {
      console.error("Mango API credentials not configured");
      return NextResponse.json(
        { error: "Mango API not configured" },
        { status: 500 }
      );
    }

    const jsonBody = JSON.stringify({
      recording_id: recordingId,
      action: "play",
    });
    const sign = sha256Hex(apiKey + jsonBody + apiSalt);

    const formData = new URLSearchParams();
    formData.append("vpbx_api_key", apiKey);
    formData.append("sign", sign);
    formData.append("json", jsonBody);

    const response = await fetch(MANGO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
      redirect: "follow",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Mango API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Recording not available", details: errorText },
        { status: response.status >= 400 ? response.status : 404 }
      );
    }

    const contentType = response.headers.get("Content-Type") || "audio/mpeg";
    const audioBuffer = await response.arrayBuffer();

    if (audioBuffer.byteLength < 1000) {
      const text = new TextDecoder().decode(audioBuffer);
      console.error("Mango returned small response:", text);
      return NextResponse.json(
        { error: "Recording not ready or unavailable" },
        { status: 404 }
      );
    }

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": contentType.includes("audio")
          ? contentType
          : "audio/mpeg",
        "Content-Length": String(audioBuffer.byteLength),
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error fetching recording:", error);
    return NextResponse.json(
      { error: "Failed to fetch recording" },
      { status: 500 }
    );
  }
}
