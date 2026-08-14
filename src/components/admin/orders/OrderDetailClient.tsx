"use client";

import { useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { updateOrderStatus } from "@/lib/admin/orders";
import { formatPaise, ORDER_STATUSES, type OrderRow, type OrderStatus } from "@/types/db";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface OrderWithRelations extends OrderRow {
  delivery_slots: { id: number; label: string; start_time: string; end_time: string } | null;
  order_items: Array<{
    id: number;
    product_name: string;
    weight_label: string | null;
    quantity: number;
    unit_price_paise: number;
    cake_message: string | null;
    photo_url: string | null;
    image_url: string | null;
  }>;
}

interface OrderDetailClientProps {
  order: OrderWithRelations;
}

const statusFlow: OrderStatus[] = [
  "pending",
  "confirmed",
  "baking",
  "out_for_delivery",
  "delivered",
];

export function OrderDetailClient({ order }: OrderDetailClientProps) {
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      const result = await updateOrderStatus(order.id, newStatus);

      if (result.success) {
        toast.success(result.message || "Order status updated");
      } else {
        toast.error(result.message || "Failed to update order status");
      }
    });
  };

  const currentStatusIndex = statusFlow.indexOf(order.status as OrderStatus);

  return (
    <>
      <style>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .sidebar, header, main > *:not(.print-container) {
            display: none !important;
          }
          .print-container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          table {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Items and Breakdown */}
        <div className="space-y-6 lg:col-span-2">
          {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-medium text-ink">Product</TableHead>
                      <TableHead className="font-medium text-ink text-center">Qty</TableHead>
                      <TableHead className="text-right font-medium text-ink">Unit Price</TableHead>
                      <TableHead className="text-right font-medium text-ink">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.order_items.map((item) => {
                      const lineTotal = item.quantity * item.unit_price_paise;
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="text-sm font-medium text-ink">{item.product_name}</div>
                              {item.weight_label && (
                                <div className="text-xs text-ink-muted">{item.weight_label}</div>
                              )}
                              {item.cake_message && (
                                <div className="text-xs text-ink-muted italic">
                                  Message: {item.cake_message}
                                </div>
                              )}
                              {item.photo_url && (
                                <div className="relative h-20 w-20">
                                  <Image
                                    src={item.photo_url}
                                    alt="Cake photo"
                                    fill
                                    className="object-cover rounded"
                                  />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-sm text-ink">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right text-sm text-ink tabular-nums">
                            {formatPaise(item.unit_price_paise)}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium text-ink tabular-nums">
                            {formatPaise(lineTotal)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Money Breakdown */}
              <Separator className="my-4" />
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-muted">Subtotal</span>
                  <span className="font-medium text-ink tabular-nums">
                    {formatPaise(order.subtotal_paise)}
                  </span>
                </div>
                {order.delivery_fee_paise > 0 && (
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Delivery Fee</span>
                    <span className="font-medium text-ink tabular-nums">
                      {formatPaise(order.delivery_fee_paise)}
                    </span>
                  </div>
                )}
                {order.discount_paise > 0 && (
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Discount</span>
                    <span className="font-medium text-green-600 tabular-nums">
                      -{formatPaise(order.discount_paise)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span className="text-ink">Total</span>
                  <span className="text-ink tabular-nums">
                    {formatPaise(order.total_paise)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Status and Details */}
        <div className="space-y-6">
          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status visualization */}
              <div className="space-y-3">
                {statusFlow.map((status, index) => {
                  const isCompleted = currentStatusIndex >= index && order.status !== "cancelled";
                  const isActive = status === order.status;

                  return (
                    <div key={status} className="flex gap-3">
                      <div
                        className={cn(
                          "mt-1 size-4 rounded-full border-2 transition-all",
                          isCompleted || isActive
                            ? "bg-brand-red border-brand-red"
                            : "border-hairline bg-white"
                        )}
                      />
                      <div className="flex-1">
                        <div
                          className={cn(
                            "text-sm font-medium capitalize",
                            isCompleted || isActive ? "text-ink" : "text-ink-muted"
                          )}
                        >
                          {status.replace(/_/g, " ")}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {order.status === "cancelled" && (
                  <div className="flex gap-3">
                    <div className="mt-1 size-4 rounded-full border-2 border-brand-red-dark bg-brand-red-dark" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-brand-red-dark">Cancelled</div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Status Change Select */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-ink-muted">Change Status</label>
                <Select value={order.status} onValueChange={(value) => value && handleStatusChange(value)} disabled={isPending}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace(/_/g, " ").charAt(0).toUpperCase() +
                          status.replace(/_/g, " ").slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Delivery Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-medium text-ink-muted">Recipient</div>
                  <div className="font-medium text-ink">{order.recipient_name}</div>
                </div>

                <div>
                  <div className="font-medium text-ink-muted">Phone</div>
                  <a
                    href={`tel:${order.recipient_phone}`}
                    className="font-medium text-brand-red hover:underline"
                  >
                    {order.recipient_phone}
                  </a>
                </div>

                <div>
                  <div className="font-medium text-ink-muted">Address</div>
                  <div className="text-ink">
                    {order.address_line1}
                    {order.address_line2 && <>, {order.address_line2}</>}
                    <br />
                    {order.city}, {order.pincode}
                  </div>
                </div>

                <div>
                  <div className="font-medium text-ink-muted">Delivery Date</div>
                  <div className="text-ink">
                    {new Date(order.delivery_date).toLocaleDateString("en-IN", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>

                {order.delivery_slots && (
                  <div>
                    <div className="font-medium text-ink-muted">Delivery Slot</div>
                    <div className="text-ink">{order.delivery_slots.label}</div>
                  </div>
                )}

                {order.delivery_instructions && (
                  <div>
                    <div className="font-medium text-ink-muted">Instructions</div>
                    <div className="text-ink">{order.delivery_instructions}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-muted">Method</span>
                  <span className="font-medium text-ink capitalize">
                    {order.payment_method === "cod" ? "Cash on Delivery" : "Razorpay"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-ink-muted">Status</span>
                  <Badge
                    variant={order.payment_status === "paid" ? "default" : "outline"}
                    className="text-xs"
                  >
                    {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                  </Badge>
                </div>

                {order.razorpay_order_id && (
                  <div>
                    <div className="text-ink-muted">Razorpay Order ID</div>
                    <div className="font-mono text-xs text-ink break-all">
                      {order.razorpay_order_id}
                    </div>
                  </div>
                )}

                {order.razorpay_payment_id && (
                  <div>
                    <div className="text-ink-muted">Razorpay Payment ID</div>
                    <div className="font-mono text-xs text-ink break-all">
                      {order.razorpay_payment_id}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
