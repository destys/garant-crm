"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { useOrderFilterStore } from "@/stores/order-filters-store";

const FormSchema = z.object({
    search: z.string().min(2, {
        message: "Поисковой запрос должен быть более 3-х символов.",
    }),
});

export const SearchBlock = () => {

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            search: "",
        },
    });

    function onSubmit(data: z.infer<typeof FormSchema>) {
        const { filters: currentFilters, setFilters } = useOrderFilterStore.getState();
        setFilters({
            ...currentFilters,
            search: data.search,
        });

        toast("Фильтры обновлены", {
            description: `Поиск: ${data.search}`,
        });
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex gap-2 w-full sm:w-auto"
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
                <Button type="submit">
                    <SearchIcon />
                </Button>
            </form>
        </Form>
    );
};