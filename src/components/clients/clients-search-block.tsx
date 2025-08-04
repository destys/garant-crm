/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useEffect, useRef } from "react";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";

interface ClientSearchBlockProps {
    onChange: (filters: Record<string, any>) => void;
}

const FormSchema = z.object({
    search: z.string().optional(),
});

export const ClientSearchBlock = ({ onChange }: ClientSearchBlockProps) => {
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            search: "",
        },
    });

    const searchValue = useWatch({ control: form.control, name: "search" });
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            const trimmed = searchValue?.trim();

            if (!trimmed || trimmed.length < 2) {
                onChange({});
                return;
            }

            onChange({
                $or: [
                    { title: { $containsi: trimmed } },
                    { client: { phone: { $containsi: trimmed } } },
                ],
            });
        }, 1000);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchValue, onChange]);

    const handleReset = () => {
        form.setValue("search", "");
        onChange({});
    };

    return (
        <Form {...form}>
            <form
                onSubmit={(e) => e.preventDefault()}
                className="flex gap-2 w-full sm:w-auto relative"
            >
                <FormField
                    control={form.control}
                    name="search"
                    render={({ field }) => (
                        <FormItem className="max-sm:flex-auto">
                            <FormControl>
                                <Input placeholder="Поиск" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button
                    type="button"
                    variant="ghost"
                    onClick={handleReset}
                    className="!p-0 size-4 absolute top-1/2 right-2 -translate-y-1/2"
                >
                    <XIcon className="w-4 h-4" />
                </Button>
            </form>
        </Form>
    );
};