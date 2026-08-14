import { type OrderStatus } from "@/types/db";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: OrderStatus;
}

const statusConfig: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "ghost" }> = {
  pending: {
    label: "Pending",
    variant: "outline",
  },
  confirmed: {
    label: "Confirmed",
    variant: "secondary",
  },
  baking: {
    label: "Baking",
    variant: "outline",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    variant: "secondary",
  },
  delivered: {
    label: "Delivered",
    variant: "default",
  },
  cancelled: {
    label: "Cancelled",
    variant: "destructive",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
