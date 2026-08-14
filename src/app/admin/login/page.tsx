import { type Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Staff Login",
  robots: {
    index: false,
  },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="rounded-lg border border-hairline bg-white p-6 shadow-sm">
          <h1 className="mb-2 text-center text-2xl font-bold text-ink">
            Staff Login
          </h1>
          <p className="mb-6 text-center text-sm text-ink-muted">
            Enter your credentials to access the admin dashboard
          </p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
