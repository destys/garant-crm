import { Suspense } from "react";
import { Loader2Icon } from "lucide-react";

import { CashboxContent } from "@/components/cashbox/cashbox-content";

const CashboxPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-96">
          <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CashboxContent />
    </Suspense>
  );
};

export default CashboxPage;
