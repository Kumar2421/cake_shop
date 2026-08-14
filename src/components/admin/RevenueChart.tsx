"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatPaise, type OrderRow } from "@/types/db";

interface RevenueChartProps {
  orders: Pick<OrderRow, "created_at" | "total_paise">[];
}

export function RevenueChart({ orders }: RevenueChartProps) {
  const chartData = useMemo(() => {
    if (orders.length === 0) return [];

    // Group by date
    const grouped: Record<string, number> = {};
    orders.forEach((order) => {
      const date = new Date(order.created_at).toLocaleDateString("en-IN");
      grouped[date] = (grouped[date] ?? 0) + order.total_paise;
    });

    // Create 30-day range starting from oldest order
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29); // Last 30 days inclusive

    const data: Array<{
      date: string;
      revenue: number;
      displayDate: string;
    }> = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toLocaleDateString("en-IN");
      const revenue = grouped[dateStr] ?? 0;
      data.push({
        date: dateStr,
        revenue,
        displayDate: date.toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        }),
      });
    }

    return data;
  }, [orders]);

  if (chartData.length === 0 || chartData.every((d) => d.revenue === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue (30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="mb-3 size-8 text-ink-muted" />
            <p className="text-sm font-medium text-ink">No revenue data</p>
            <p className="mt-1 text-xs text-ink-muted">
              Paid orders will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxRevenue = Math.max(...chartData.map((d) => d.revenue));
  const yAxisDomain = [
    0,
    Math.ceil((maxRevenue / 100000) * 10) * 10000 || 100000,
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue (30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            revenue: {
              label: "Revenue",
              color: "var(--color-brand-red)",
            },
          }}
          className="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="colorRevenue"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--color-brand-red)"
                    stopOpacity={0.15}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-brand-red)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis
                dataKey="displayDate"
                stroke="var(--color-muted-foreground)"
                style={{ fontSize: "12px" }}
                tick={{ fill: "var(--color-muted-foreground)" }}
                interval={Math.floor(chartData.length / 6)}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                style={{ fontSize: "12px" }}
                tick={{
                  fill: "var(--color-muted-foreground)",
                  fontSize: "12px",
                }}
                domain={yAxisDomain}
                tickFormatter={(value) => {
                  if (value === 0) return "₹0";
                  return `₹${(value / 100000).toFixed(0)}k`;
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => {
                      if (typeof value === "number") {
                        return formatPaise(value);
                      }
                      return value;
                    }}
                    labelFormatter={(label) => {
                      return `${label}`;
                    }}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-brand-red)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
