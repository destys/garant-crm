"use strict";

import { useQuery } from "@tanstack/react-query";

import { UserProps } from "@/types/user.types";
import { getUserById } from "@/services/users-service";
import { useAuth } from "@/providers/auth-provider";

export const useUser = (userId: number | null) => {
  const { jwt } = useAuth();
  const authToken = jwt ?? "";

  return useQuery<UserProps, Error>({
    queryKey: ["user", userId],
    queryFn: () => {
      if (!userId) throw new Error("User ID is required");
      return getUserById(authToken, userId);
    },
    enabled: !!jwt && !!userId,
  });
};
