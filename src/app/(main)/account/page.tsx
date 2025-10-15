"use client";

import { useEffect, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MasterEdit } from "@/components/masters/master-edit";
import { MasterLeads } from "@/components/masters/master-leads";
import { MasterAccounting } from "@/components/masters/master-accounting";
import { useUser } from "@/hooks/use-user";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";

const VALID_TABS = ["edit", "leads", "accounting"] as const;

const AccountPage = () => {
  const { user } = useAuth();
  const { data } = useUser(user?.id ? +user.id : null);

  const [activeTab, setActiveTab] = useState<string>("edit");

  // При монтировании проверяем hash
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (hash && VALID_TABS.includes(hash as never)) {
        setActiveTab(hash);
      }
    }
  }, []);

  // При переключении таба обновляем hash в url
  const handleTabChange = (val: string) => {
    setActiveTab(val);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${val}`);
    }
  };

  if (!data) return null;

  return (
    <div>
      <div className="flex md:justify-between flex-col md:flex-row md:items-center gap-4 mb-8">
        <div>
          <h1 className="flex-auto">{data.name}</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <p>Баланс:</p>
            <p
              className={cn(
                "text-xl font-bold text-green-500",
                data.balance < 0 && "text-red-500"
              )}
            >
              {data.balance || 0} ₽
            </p>
          </div>
        </div>
      </div>

      <Tabs id="account-tabs" value={activeTab} onValueChange={handleTabChange}>
        <div className="flex items-center gap-8 lg:gap-16 mb-6">
          <TabsList className="flex-auto">
            <TabsTrigger value="edit">Редактирование</TabsTrigger>
            <TabsTrigger value="leads">Заявки в работе</TabsTrigger>
            <TabsTrigger value="accounting">Расчеты</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit">
          <MasterEdit data={data} />
        </TabsContent>
        <TabsContent value="leads">
          <MasterLeads data={data} />
        </TabsContent>
        <TabsContent value="accounting">
          <MasterAccounting data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountPage;
