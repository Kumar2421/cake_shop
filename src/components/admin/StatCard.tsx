import { type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  delta?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
}: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-ink-muted">{label}</p>
          <p className="mt-3 text-3xl font-bold text-ink tabular-nums">
            {value}
          </p>
          {delta !== undefined && (
            <p
              className={cn(
                "mt-2 text-xs font-medium flex items-center gap-1",
                delta.isPositive
                  ? "text-brand-green-text"
                  : "text-brand-red-dark"
              )}
            >
              <span>{delta.isPositive ? "+" : "−"}</span>
              <span className="tabular-nums">{Math.abs(delta.value).toLocaleString("en-IN")}</span>
              <span className="text-ink-muted">vs last 30 days</span>
            </p>
          )}
        </div>
        {Icon && (
          <div className="flex-shrink-0 rounded-lg bg-brand-pink-tint p-3 text-brand-red">
            <Icon className="size-5" />
          </div>
        )}
      </div>
    </Card>
  );
}
