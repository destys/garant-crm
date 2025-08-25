"use client";

import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
    value?: number;               // 1..5
    onChange?: (v: number) => void;
    size?: number;               // опционально, размер иконок
};

export const RatingStars = ({ value = 1, onChange, size = 20 }: Props) => {
    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => {
                const n = i + 1;
                const filled = n <= value;
                return (
                    <button
                        key={n}
                        type="button"
                        aria-label={`Оценка ${n}`}
                        onClick={() => onChange && onChange(n)}
                        className="p-0.5"
                    >
                        <Star
                            className={cn(
                                "transition-colors",
                                filled ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                            )}
                            style={{ width: size, height: size }}
                        />
                    </button>
                );
            })}
        </div>
    );
};