"use strict";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import QueryString from "qs";

import { UpdateUserDto, UserProps } from "@/types/user.types";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
} from "@/services/users-service";
import { useAuth } from "@/providers/auth-provider";

export const useUsers = (page: number, pageSize: number, query?: unknown) => {
  const { jwt: token } = useAuth();
  const queryClient = useQueryClient();
  const authToken = token ?? "";

  const queryString = QueryString.stringify(
    { filters: query },
    { encodeValuesOnly: true }
  );

  const usersQuery = useQuery<{ users: UserProps[]; total: number }, Error>({
    queryKey: ["users", page, pageSize, query],
    queryFn: () => fetchUsers(authToken, page, pageSize, queryString),
    enabled: !!token,
  });

  const createUserMutation = useMutation({
    mutationFn: (user: {
      email: string;
      name: string;
      password: string;
      phone?: string;
      role: { id: number };
    }) => createUser(authToken, user),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({
      userId,
      updatedData,
    }: {
      userId: number;
      updatedData: Partial<UpdateUserDto>;
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
    createUserAsync: createUserMutation.mutateAsync, // можно использовать await и try/catch
    updateUser: updateUserMutation.mutate,
    deleteUser: deleteUserMutation.mutate,
  };
};
