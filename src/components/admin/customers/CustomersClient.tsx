"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { fetchCustomerOrders } from "@/lib/admin/customer-actions";
import type { CustomerWithMetrics } from "@/lib/admin/customers";
import { formatPaise, type OrderRow } from "@/types/db";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function CustomersClient({ customers }: { customers: CustomerWithMetrics[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithMetrics | null>(null);
  const [customerOrders, setCustomerOrders] = useState<OrderRow[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return customers;

    return customers.filter(
      (customer) =>
        customer.full_name?.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.phone?.includes(query),
    );
  }, [searchQuery, customers]);

  // Orders load on demand through a Server Action: reading them needs the
  // service-role key, which must never reach the browser.
  const handleSelectCustomer = async (customer: CustomerWithMetrics) => {
    setSelectedCustomer(customer);
    setLoadingOrders(true);
    setCustomerOrders([]);

    try {
      setCustomerOrders(await fetchCustomerOrders(customer.id));
    } finally {
      setLoadingOrders(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Customers table */}
      {filteredCustomers.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-hairline bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium text-ink">Name</TableHead>
                <TableHead className="font-medium text-ink">Email</TableHead>
                <TableHead className="font-medium text-ink">Phone</TableHead>
                <TableHead className="text-center font-medium text-ink">Orders</TableHead>
                <TableHead className="text-right font-medium text-ink">Lifetime Value</TableHead>
                <TableHead className="font-medium text-ink">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className="hover:bg-background cursor-pointer"
                  onClick={() => handleSelectCustomer(customer)}
                >
                  <TableCell className="text-sm font-medium text-ink">
                    {customer.full_name || "Anonymous"}
                  </TableCell>
                  <TableCell className="text-sm text-ink-muted">{customer.email ?? "—"}</TableCell>
                  <TableCell className="text-sm text-ink-muted">
                    {customer.phone ? (
                      <a href={`tel:${customer.phone}`} className="text-brand-red hover:underline">
                        {customer.phone}
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-center text-sm text-ink">
                    {customer.orderCount}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium text-ink tabular-nums">
                    {formatPaise(customer.lifetimeValue)}
                  </TableCell>
                  <TableCell className="text-sm text-ink-muted">
                    {new Date(customer.created_at).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="font-medium text-ink">
            {searchQuery ? "No customers found" : "No customers yet"}
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            {searchQuery
              ? "Try adjusting your search criteria."
              : "Customers will appear here as they place orders."}
          </p>
        </Card>
      )}

      {/* Customer detail sheet */}
      {selectedCustomer && (
        <Sheet open={true} onOpenChange={() => setSelectedCustomer(null)}>
          <SheetContent className="flex flex-col">
            <SheetHeader>
              <SheetTitle>Customer Details</SheetTitle>
            </SheetHeader>

            <div className="space-y-6 flex-1 overflow-auto">
              {/* Customer info */}
              <div className="space-y-4 border-b border-hairline pb-6">
                <div>
                  <div className="text-xs font-medium text-ink-muted">Name</div>
                  <div className="text-sm font-medium text-ink">
                    {selectedCustomer.full_name || "Anonymous"}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-ink-muted">Email</div>
                  <div className="text-sm text-ink">{selectedCustomer.email ?? "—"}</div>
                </div>

                {selectedCustomer.phone && (
                  <div>
                    <div className="text-xs font-medium text-ink-muted">Phone</div>
                    <a
                      href={`tel:${selectedCustomer.phone}`}
                      className="text-sm text-brand-red hover:underline"
                    >
                      {selectedCustomer.phone}
                    </a>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-ink-muted">Total Orders</div>
                    <div className="text-lg font-bold text-ink">
                      {selectedCustomer.orderCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-ink-muted">Lifetime Value</div>
                    <div className="text-lg font-bold text-ink">
                      {formatPaise(selectedCustomer.lifetimeValue)}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-ink-muted">Joined</div>
                  <div className="text-sm text-ink">
                    {new Date(selectedCustomer.created_at).toLocaleDateString("en-IN", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>

              {/* Recent orders */}
              <div>
                <h3 className="mb-3 font-medium text-ink">Recent Orders</h3>

                {loadingOrders ? (
                  <div className="text-sm text-ink-muted">Loading orders...</div>
                ) : customerOrders.length > 0 ? (
                  <div className="space-y-2">
                    {customerOrders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-lg border border-hairline p-3 hover:bg-background"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-ink">
                              {order.order_number}
                            </div>
                            <div className="text-xs text-ink-muted">
                              {new Date(order.created_at).toLocaleDateString("en-IN")}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-ink tabular-nums">
                              {formatPaise(order.total_paise)}
                            </div>
                            <div className="text-xs text-ink-muted capitalize">
                              {order.status}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink-muted">No orders yet.</p>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
