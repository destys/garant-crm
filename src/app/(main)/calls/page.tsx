"use client";

import { CallsContent } from "@/components/calls/calls-content";
import { useAuth } from "@/providers/auth-provider";

export default function CallsPage() {
  const { roleId } = useAuth();

  if (roleId !== 3) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">У вас нет доступа к этой странице</p>
      </div>
    );
  }

  return <CallsContent />;
}
