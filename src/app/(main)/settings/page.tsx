'use client';

import { Separator } from "@/components/ui/separator";
import { SettingsWidget } from "@/components/settings/settings-widget";

export default function SettingsPage() {
    return (
        <div className="space-y-10">
            <h1 className="text-2xl font-bold">Настройки</h1>

            <SettingsWidget
                label="Причины отказа"
                settingKey="reasons_for_refusal"
                placeholder="Введите причину (можно через |)"
            />

            <Separator />

            <SettingsWidget
                label="Типы техники"
                settingKey="types_of_equipment"
                placeholder="Введите тип техники (можно через |)"
            />

            <Separator />

            <SettingsWidget
                label="Статьи доходов"
                settingKey="income_categories"
                placeholder="Введите причину (можно через |)"
            />

            <Separator />

            <SettingsWidget
                label="Статьи расходов"
                settingKey="outcome_categories"
                placeholder="Введите причину (можно через |)"
            />
        </div>
    );
}