import crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";

function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

const MANGO_SMS_URL = "https://app.mango-office.ru/vpbx/commands/sms";

const MANGO_ERROR_CODES: Record<number, string> = {
  1000: "Успешно",
  3100: "Неверные параметры команды",
  3330: "Внутренний номер сотрудника не найден в ВАТС. Проверьте MANGO_FROM_EXTENSION в .env",
  4300: "SMS-сообщение отправить не удалось",
  4301: "Отправка SMS запрещена настройками ВАТС",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, text } = body;

    if (!phone || !text) {
      return NextResponse.json(
        { error: "Phone and text are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.MANGO_API_KEY || process.env.MANGO_VPBX_API_KEY;
    const apiSalt =
      process.env.MANGO_API_SALT ||
      process.env.MANGO_API_SECRET ||
      process.env.MANGO_API_SKEY;
    const fromExtension = process.env.MANGO_FROM_EXTENSION;

    if (!apiKey || !apiSalt) {
      console.error("Mango API credentials not configured");
      return NextResponse.json(
        { error: "Mango API not configured" },
        { status: 500 }
      );
    }

    if (!fromExtension) {
      console.error("MANGO_FROM_EXTENSION not configured");
      return NextResponse.json(
        { error: "Не настроен внутренний номер для отправки SMS (MANGO_FROM_EXTENSION)" },
        { status: 500 }
      );
    }

    const commandId = `sms-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const normalizedPhone = phone.replace(/\D/g, "");

    const jsonBody = JSON.stringify({
      command_id: commandId,
      from_extension: fromExtension,
      to_number: normalizedPhone,
      text: text,
    });

    const sign = sha256Hex(apiKey + jsonBody + apiSalt);

    const formData = new URLSearchParams();
    formData.append("vpbx_api_key", apiKey);
    formData.append("sign", sign);
    formData.append("json", jsonBody);

    const response = await fetch(MANGO_SMS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const responseText = await response.text();

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    if (!response.ok) {
      console.error("Mango SMS API error:", response.status, responseText);
      return NextResponse.json(
        {
          success: false,
          error: "Ошибка отправки SMS",
          details: responseData,
        },
        { status: response.status }
      );
    }

    if (responseData.result && responseData.result !== 1000) {
      const errorMessage =
        MANGO_ERROR_CODES[responseData.result] ||
        `Ошибка Mango: код ${responseData.result}`;
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          code: responseData.result,
          details: responseData,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      commandId,
      response: responseData,
    });
  } catch (error) {
    console.error("Error sending SMS:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send SMS" },
      { status: 500 }
    );
  }
}
