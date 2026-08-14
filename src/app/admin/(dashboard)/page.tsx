import Link from "next/link";
import {
  ShoppingCart,
  Package,
  TrendingUp,
  Clock,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatPaise, type OrderStatus } from "@/types/db";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { TopProductsChart } from "@/components/admin/TopProductsChart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = {
  title: "Dashboard | Admin",
};

type OrderItemWithProduct = {
  product_id: number | null;
  quantity: number;
  products: { name: string } | null;
};

export default async function DashboardPage() {
  await requireAdmin();

  const supabase = await createClient();
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // Fetch all necessary data
  const [
    productsResult,
    ordersLast30Result,
    ordersLast60Result,
    paidOrdersLast30Result,
    paidOrdersLast60Result,
    pendingOrdersResult,
    recentOrdersResult,
    orderItemsResult,
  ] = await Promise.all([
    // Active products
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    // Orders last 30 days
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString()),
    // Orders 30-60 days ago
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sixtyDaysAgo.toISOString())
      .lt("created_at", thirtyDaysAgo.toISOString()),
    // Paid orders last 30 days
    supabase
      .from("orders")
      .select("total_paise, created_at")
      .eq("payment_status", "paid")
      .gte("created_at", thirtyDaysAgo.toISOString()),
    // Paid orders 30-60 days ago
    supabase
      .from("orders")
      .select("total_paise")
      .eq("payment_status", "paid")
      .gte("created_at", sixtyDaysAgo.toISOString())
      .lt("created_at", thirtyDaysAgo.toISOString()),
    // Pending orders
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    // Recent orders (10 most recent)
    supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        recipient_name,
        delivery_date,
        status,
        total_paise,
        created_at
        `
      )
      .order("created_at", { ascending: false })
      .limit(10),
    // Order items for top products
    supabase
      .from("order_items")
      .select("product_id, quantity, products(name)"),
  ]);

  // Calculate stats with deltas
  const totalProducts = productsResult.count ?? 0;

  const ordersLast30 = ordersLast30Result.count ?? 0;
  const ordersLast60 = ordersLast60Result.count ?? 0;
  const ordersDelta = ordersLast30 - ordersLast60;

  const revenueLast30 =
    paidOrdersLast30Result.data?.reduce(
      (sum, order) => sum + order.total_paise,
      0
    ) ?? 0;
  const revenueLast60 =
    paidOrdersLast60Result.data?.reduce(
      (sum, order) => sum + order.total_paise,
      0
    ) ?? 0;
  const revenueDelta = revenueLast30 - revenueLast60;

  const pendingOrdersCount = pendingOrdersResult.count ?? 0;
  const recentOrders = recentOrdersResult.data ?? [];

  // Transform order items for chart - use only the fields we need
  const orderItems: Array<{ product_id: number | null; quantity: number; product_name: string }> = (orderItemsResult.data ?? []).map((item) => {
    const typedItem = item as OrderItemWithProduct;
    return {
      product_id: typedItem.product_id,
      quantity: typedItem.quantity,
      product_name: typedItem.products?.name ?? "Unknown Product",
    };
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-ink">Dashboard</h1>
        <p className="mt-2 text-sm text-ink-muted">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue (Paid)"
          value={formatPaise(revenueLast30)}
          icon={TrendingUp}
          delta={{
            value: revenueDelta,
            isPositive: revenueDelta >= 0,
          }}
        />
        <StatCard
          label="Total Orders"
          value={ordersLast30}
          icon={ShoppingCart}
          delta={{
            value: ordersDelta,
            isPositive: ordersDelta >= 0,
          }}
        />
        <StatCard
          label="Active Products"
          value={totalProducts}
          icon={Package}
        />
        <StatCard
          label="Pending Orders"
          value={pendingOrdersCount}
          icon={Clock}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart orders={paidOrdersLast30Result.data ?? []} />
        <TopProductsChart items={orderItems} />
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-5">
          <CardTitle>Recent Orders</CardTitle>
          {recentOrders.length > 0 && (
            <Link
              href="/admin/orders"
              className="text-sm text-brand-red hover:underline"
            >
              View all →
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-brand-red hover:underline"
                      >
                        {order.order_number}
                      </Link>
                    </TableCell>
                    <TableCell>{order.recipient_name}</TableCell>
                    <TableCell>
                      {new Date(order.delivery_date).toLocaleDateString(
                        "en-IN",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status as OrderStatus} />
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatPaise(order.total_paise)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="mb-3 size-8 text-ink-muted" />
              <p className="text-sm font-medium text-ink">No orders yet</p>
              <p className="mt-1 text-xs text-ink-muted">
                Orders will appear here as customers place them
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
