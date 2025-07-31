"use strict";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { UserProps } from "@/types/user.types";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
} from "@/services/users-service";
import { useAuth } from "@/providers/auth-provider";

export const useUsers = (page: number, pageSize: number, query?: string) => {
  const { jwt: token } = useAuth();
  const queryClient = useQueryClient();
  const authToken = token ?? "";

  const usersQuery = useQuery<{ users: UserProps[]; total: number }, Error>({
    queryKey: ["users", page, pageSize, query],
    queryFn: () => fetchUsers(authToken, page, pageSize, query),
    enabled: !!token,
  });

  const createUserMutation = useMutation({
    mutationFn: (user: Partial<UserProps>) => createUser(authToken, user),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({
      userId,
      updatedData,
    }: {
      userId: number;
      updatedData: Partial<UserProps>;
    }) => updateUser(authToken, userId, updatedData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => deleteUser(authToken, userId),
    onSuccess: (_, userId) => {
      queryClient.setQueryData<{ users: UserProps[]; total: number }>(
        ["users"],
        (oldData) => {
          if (!oldData) return { users: [], total: 0 };
          return {
            users: oldData.users.filter((user) => user.id !== userId),
            total: oldData.total - 1,
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  return {
    users: usersQuery.data?.users || [],
    total: usersQuery.data?.total || 0,
    isLoading: usersQuery.isLoading,
    isError: usersQuery.isError,
    error: usersQuery.error,
    createUser: createUserMutation.mutate,
    updateUser: updateUserMutation.mutate,
    deleteUser: deleteUserMutation.mutate,
  };
};
