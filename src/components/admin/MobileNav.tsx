"use client";

import { Menu } from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AdminNav } from "@/components/admin/AdminNav";

export function MobileNav() {
  return (
    <Sheet>
      {/* SheetTrigger renders the button itself; wrapping another one inside
          is invalid HTML and breaks hydration. */}
      <SheetTrigger
        aria-label="Menu"
        className="flex size-11 cursor-pointer items-center justify-center rounded-lg hover:bg-muted focus-visible:ring-2 focus-visible:ring-brand-red/40 focus-visible:outline-none lg:hidden"
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" showCloseButton={true}>
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <AdminNav />
        </div>
      </SheetContent>
    </Sheet>
  );
}
