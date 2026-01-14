import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/providers/auth-provider";
import { fetchSettings, updateSettings } from "@/services/settings-service";
import { SettingsProps } from "@/types/settings.types";

/**
 * Хук для работы с настройками (single type)
 */
export const useSettings = () => {
  const { jwt: token } = useAuth();
  const queryClient = useQueryClient();
  const authToken = token ?? "";

  // Получение настроек (редко меняются — кэшируем на 5 минут)
  const settingsQuery = useQuery<SettingsProps, Error>({
    queryKey: ["settings"],
    queryFn: () => fetchSettings(authToken),
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 минут
    gcTime: 1000 * 60 * 30, // 30 минут в кэше
  });

  // Обновление настроек
  const updateSettingsMutation = useMutation({
    mutationFn: (updatedData: Partial<SettingsProps>) =>
      updateSettings(authToken, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    isError: settingsQuery.isError,
    error: settingsQuery.error,
    refetch: settingsQuery.refetch,
    updateSettings: updateSettingsMutation.mutate,
  };
};
