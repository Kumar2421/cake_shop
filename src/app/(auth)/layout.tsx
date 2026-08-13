export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-brand-pink-tint px-4 py-10">
      {children}
    </main>
  );
}
