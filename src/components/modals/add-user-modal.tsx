// components/modals/ConfirmModal.tsx
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useUsers } from "@/hooks/use-users";

const formSchema = z
  .object({
    name: z.string().min(3, "Введите ФИО"),
    position: z.string().optional(),
    phone: z.string().min(10, "Введите корректный телефон"),
    email: z.string().email("Введите корректный email"),
    role: z.string(),
    password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
    confirm_password: z.string().min(6, "Повторите пароль"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Пароли должны совпадать",
    path: ["confirm_password"], // ошибка будет отображена под полем "подтверждение пароля"
  });

type MasterFormValues = z.infer<typeof formSchema>;

export const AddUserModal = ({ close }: { close: () => void }) => {
  const { createUser } = useUsers(1, 1);
  const [loading, setLoading] = useState(false);
  const form = useForm<MasterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      role: "1",
      password: "",
      confirm_password: "",
      position: "",
    },
  });

  const onSubmit = async (data: MasterFormValues) => {
    const payload = {
      email: data.email,
      name: data.name,
      password: data.password,
      phone: data.phone,
      position: data.position,
      role: { id: +data.role },
    };

    try {
      setLoading(true);
      await createUser(payload);

      toast.success("Пользователь создан");
      close();
    } catch (e) {
      console.error("Ошибка создания пользователя:", e);
      toast.error("Ошибка создания пользователя");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* ФИО */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ФИО</FormLabel>
                <FormControl>
                  <Input placeholder="Иванов Иван Иванович" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Телефон */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Телефон</FormLabel>
                <FormControl>
                  <Input
                    placeholder="+7 (999) 123-45-67"
                    mask="+7 (000) 000-00-00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="example@mail.ru" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Пароль */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Пароль</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Мин 6 символов"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Повторить пароль */}
          <FormField
            control={form.control}
            name="confirm_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Повторите пароль</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Мин 6 символов"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Роль */}
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Роль</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value.toString()}
                >
                  <FormControl className="w-full">
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите роль" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Мастер</SelectItem>
                    <SelectItem value="4">Менеджер</SelectItem>
                    <SelectItem value="3">Администратор</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Должность */}
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Должность</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Должность" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Кнопка */}
          <Button type="submit" className="md:col-span-2" disabled={loading}>
            {loading ? <Loader2Icon className="animate-spin" /> : "Сохранить"}
          </Button>
        </form>
      </Form>
    </div>
  );
};
