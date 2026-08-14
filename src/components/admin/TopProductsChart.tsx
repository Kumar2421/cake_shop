"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface TopProductsChartProps {
  items: Array<{
    product_id: number | null;
    quantity: number;
    product_name: string;
  }>;
}

export function TopProductsChart({ items }: TopProductsChartProps) {
  const chartData = useMemo(() => {
    if (items.length === 0) return [];

    // Group by product
    const grouped: Record<string, { quantity: number; name: string }> = {};
    items.forEach((item) => {
      const key = String(item.product_id ?? "unknown");
      if (!grouped[key]) {
        grouped[key] = { quantity: 0, name: item.product_name };
      }
      grouped[key].quantity += item.quantity;
    });

    // Sort by quantity descending and take top 5
    return Object.values(grouped)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map((item) => ({
        name: item.name,
        quantity: item.quantity,
      }));
  }, [items]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="mb-3 size-8 text-ink-muted" />
            <p className="text-sm font-medium text-ink">No sales data</p>
            <p className="mt-1 text-xs text-ink-muted">
              Top products will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Products</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            quantity: {
              label: "Quantity Sold",
              color: "var(--color-brand-red)",
            },
          }}
          className="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 150, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                horizontal={false}
              />
              <XAxis
                type="number"
                stroke="var(--color-muted-foreground)"
                style={{ fontSize: "12px" }}
                tick={{ fill: "var(--color-muted-foreground)" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="var(--color-muted-foreground)"
                style={{ fontSize: "12px" }}
                tick={{
                  fill: "var(--color-muted-foreground)",
                  fontSize: "12px",
                }}
                width={140}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => {
                      if (typeof value === "number") {
                        return value.toLocaleString("en-IN");
                      }
                      return value;
                    }}
                  />
                }
              />
              <Bar
                dataKey="quantity"
                fill="var(--color-brand-red)"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
