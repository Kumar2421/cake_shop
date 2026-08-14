"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPaise, ORDER_STATUSES, type OrderStatus } from "@/types/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Type for status counts
interface StatusCounts {
  all: number;
  pending: number;
  confirmed: number;
  baking: number;
  out_for_delivery: number;
  delivered: number;
  cancelled: number;
}

// Type for order data
interface OrderData {
  id: number;
  order_number: string;
  recipient_name: string;
  recipient_phone: string;
  delivery_date: string;
  delivery_slot_id: number | null;
  status: string;
  payment_status: string;
  total_paise: number;
  created_at: string;
  delivery_slots?: { label: string } | null;
}

export function OrdersListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    all: 0,
    pending: 0,
    confirmed: 0,
    baking: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0,
  });

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const currentStatus = (searchParams.get("status") as OrderStatus | "all") || "pending";
  const searchQuery = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = 25;

  // Load orders and counts
  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      // Get status counts in parallel
      const counts: StatusCounts = {
        all: 0,
        pending: 0,
        confirmed: 0,
        baking: 0,
        out_for_delivery: 0,
        delivered: 0,
        cancelled: 0,
      };

      const countPromises = [
        supabase.from("orders").select("id", { count: "exact", head: true }).then(r => {
          counts.all = r.count || 0;
        }),
        ...ORDER_STATUSES.map(status =>
          supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("status", status)
            .then(r => {
              counts[status as keyof StatusCounts] = r.count || 0;
            })
        ),
      ];

      await Promise.all(countPromises);
      setStatusCounts(counts);

      // Build query
      let query = supabase
        .from("orders")
        .select(
          `
          id,
          order_number,
          recipient_name,
          recipient_phone,
          delivery_date,
          delivery_slot_id,
          status,
          payment_status,
          total_paise,
          created_at,
          delivery_slots(label)
          `
        );

      // Apply status filter
      if (currentStatus !== "all") {
        query = query.eq("status", currentStatus);
      }

      // Apply search filter (order number or phone)
      if (searchQuery) {
        query = query.or(`order_number.ilike.%${searchQuery}%,recipient_phone.ilike.%${searchQuery}%`);
      }

      // Sort by delivery_date ascending (kitchen works to delivery date, not order date)
      query = query.order("delivery_date", { ascending: true });

      // Apply pagination
      const start = (page - 1) * pageSize;
      query = query.range(start, start + pageSize - 1);

      const { data, count } = await query;

      setOrders((data as OrderData[]) || []);
      setTotalCount(count || 0);
    } finally {
      setLoading(false);
    }
  }, [currentStatus, searchQuery, page]);

  // Initial load on mount or when dependencies change
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = (newStatus: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("status", newStatus);
    params.set("page", "1");
    router.push(`/admin/orders?${params.toString()}`);
  };

  const handleSearch = (query: string) => {
    const params = new URLSearchParams(searchParams);
    if (query) {
      params.set("search", query);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`/admin/orders?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`/admin/orders?${params.toString()}`);
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalCount);

  if (loading) {
    return <div className="text-sm text-ink-muted">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <Input
            placeholder="Search by order number or phone..."
            defaultValue={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabs with status counts */}
      <Tabs value={currentStatus} onValueChange={handleStatusChange}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="all">
            All
            {statusCounts.all > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {statusCounts.all}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            {statusCounts.pending > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {statusCounts.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Confirmed
            {statusCounts.confirmed > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {statusCounts.confirmed}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="baking">
            Baking
            {statusCounts.baking > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {statusCounts.baking}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="out_for_delivery">
            Out for Delivery
            {statusCounts.out_for_delivery > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {statusCounts.out_for_delivery}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="delivered">
            Delivered
            {statusCounts.delivered > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {statusCounts.delivered}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled
            {statusCounts.cancelled > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {statusCounts.cancelled}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Orders table */}
        <TabsContent value={currentStatus} className="space-y-4">
          {orders.length > 0 ? (
            <>
              <div className="overflow-x-auto rounded-lg border border-hairline bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-medium text-ink">Order Number</TableHead>
                      <TableHead className="font-medium text-ink">Customer</TableHead>
                      <TableHead className="font-medium text-ink">Delivery Date & Slot</TableHead>
                      <TableHead className="font-medium text-ink">Items</TableHead>
                      <TableHead className="font-medium text-ink">Payment</TableHead>
                      <TableHead className="text-right font-medium text-ink">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-background">
                        <TableCell>
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-medium text-brand-red hover:underline"
                          >
                            {order.order_number}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-ink">
                            <div className="font-medium">{order.recipient_name}</div>
                            <div className="text-xs text-ink-muted">{order.recipient_phone}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-ink">
                          <div>
                            {new Date(order.delivery_date).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                          {order.delivery_slots && (
                            <div className="text-xs text-ink-muted">{order.delivery_slots.label}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Multiple</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={order.payment_status === "paid" ? "default" : "outline"}
                            className="text-xs"
                          >
                            {order.payment_status === "paid" ? "Paid" : "Unpaid"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-ink tabular-nums font-medium">
                          {formatPaise(order.total_paise)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-ink-muted">
                  Showing {startIndex} to {endIndex} of {totalCount} orders
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1 px-2">
                    <span className="text-xs text-ink-muted">
                      Page {page} of {totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-hairline bg-white p-8 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-background">
                <span className="text-2xl">📦</span>
              </div>
              <p className="font-medium text-ink">No orders found</p>
              <p className="mt-1 text-xs text-ink-muted">
                {searchQuery
                  ? "No orders match your search criteria"
                  : `There are no ${currentStatus === "all" ? "" : currentStatus} orders yet.`}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
