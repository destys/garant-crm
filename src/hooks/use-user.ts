import { useQuery } from "@tanstack/react-query";

import { UserProps } from "@/types/user.types";
import { getUserById } from "@/services/users-service";
import { useAuth } from "@/providers/auth-provider";

export const useUser = (userId: number | null) => {
  const { jwt } = useAuth();
  const authToken = jwt ?? "";

  // Кэшируем на 2 минуты — пользователи редко меняются
  const query = useQuery<UserProps, Error>({
    queryKey: ["user", userId],
    queryFn: () => {
      if (!userId) throw new Error("User ID is required");
      return getUserById(authToken, userId);
    },
    enabled: !!jwt && !!userId,
    staleTime: 1000 * 60 * 2, // 2 минуты
  });

  return query; // здесь внутри есть refetch
};
