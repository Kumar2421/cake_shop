import { requireAdmin } from "@/lib/auth/session";
import { getCustomers } from "@/lib/admin/customers";
import { CustomersClient } from "@/components/admin/customers/CustomersClient";

export const metadata = {
  title: "Customers | Admin",
};

export default async function CustomersPage() {
  await requireAdmin();
  const customers = await getCustomers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Customers</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {customers.length === 0
            ? "No customers yet."
            : `${customers.length} registered ${customers.length === 1 ? "customer" : "customers"}, ranked by lifetime value.`}
        </p>
      </div>

      <CustomersClient customers={customers} />
    </div>
  );
}
