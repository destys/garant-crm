import { Loader2Icon } from "lucide-react";
import { Suspense } from "react";

import { OrdersContent } from "@/components/orders/orders-content";

const OrdersPage = () => {
  return (
    <Suspense fallback={<Loader2Icon className="animate-spin" />}>
      <OrdersContent />
    </Suspense>
  );
};

export default OrdersPage;
