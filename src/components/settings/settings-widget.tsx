'use client';

import { useState } from "react";
import { TrashIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/hooks/use-settings";

interface SettingsWidgetProps {
    label: string;
    settingKey: "reasons_for_refusal" | "types_of_equipment" | "income_categories" | "outcome_categories";
    placeholder: string;
}

export const SettingsWidget = ({
    label,
    settingKey,
    placeholder,
}: SettingsWidgetProps) => {
    const { settings, updateSettings } = useSettings();
    const [inputValue, setInputValue] = useState("");

    if (!settings) return null;

    const items = settings[settingKey];

    const handleDelete = (index: number) => {
        const updated = items
            .filter((_, i) => i !== index)
            .map(({ title }) => ({ title }));
        updateSettings({ [settingKey]: updated });
    };

    const handleAdd = () => {
        if (!inputValue.trim()) return;

        const cleaned = items.map(({ title }) => ({ title }));

        const newItems = inputValue
            .split("|")
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
            .map((title) => ({ title }));

        if (newItems.length === 0) return;

        const updated = [...cleaned, ...newItems];
        updateSettings({ [settingKey]: updated });
        setInputValue("");
    };

    return (
        <section>
            <h2 className="text-xl font-semibold mb-4">{label}</h2>

            <div className="flex gap-2 mb-4">
                <Input
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                />
                <Button onClick={handleAdd}>Добавить</Button>
            </div>

            <div className="flex flex-wrap gap-2">
                {items.map((item, i) => (
                    <div
                        key={i}
                        className="flex gap-3 items-center border p-1 rounded text-xs"
                    >
                        {item.title}
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(i)}
                            className="!p-1 size-5"
                        >
                            <TrashIcon className="size-3" />
                        </Button>
                    </div>
                ))}
            </div>
        </section>
    );
};