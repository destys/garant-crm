"use client";

import { BanknoteArrowDownIcon, BanknoteArrowUpIcon } from "lucide-react";
import { useParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MasterEdit } from "@/components/masters/master-edit";
import { MasterLeads } from "@/components/masters/master-leads";
import { MasterAccounting } from "@/components/masters/master-accounting";
import { useUser } from "@/hooks/use-user";
import { useModal } from "@/providers/modal-provider";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";

const MasterPage = () => {
  const params = useParams();
  const { id } = params;
  const { data } = useUser(id ? +id : null);
  const { openModal } = useModal();
  const { user, roleId } = useAuth();

  if (!data) return null;

  return (
    <div>
      <div className="flex md:justify-between flex-col md:flex-row md:items-center gap-4 mb-8">
        <div>
          <h1 className="flex-auto">Сотрудник: {data.name}</h1>
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
      <Tabs id="master-page" defaultValue="edit">
        <div className="flex items-center gap-8 lg:gap-16 mb-6">
          <TabsList className="flex-auto">
            <TabsTrigger value="edit">Редактирование</TabsTrigger>
            <TabsTrigger value="leads">Заявки в работе</TabsTrigger>
            <TabsTrigger value="accounting">Расчеты</TabsTrigger>
          </TabsList>
          {roleId === 3 && (
            <div className="flex gap-2">
              <Button
                variant={"positive"}
                onClick={() => {
                  openModal("manualIncomeOutcome", {
                    title: "Добавить приход",
                    props: { type: "income", agent: user?.name, masterId: id },
                  });
                }}
              >
                <BanknoteArrowUpIcon />
              </Button>
              <Button
                variant={"destructive"}
                onClick={() => {
                  openModal("manualIncomeOutcome", {
                    title: "Добавить списание",
                    props: { type: "outcome", agent: user?.name, masterId: id },
                  });
                }}
              >
                <BanknoteArrowDownIcon />
              </Button>
            </div>
          )}
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

export default MasterPage;
