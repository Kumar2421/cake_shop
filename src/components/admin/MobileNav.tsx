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
      <SheetTrigger>
        <button
          type="button"
          className="rounded-lg p-1.5 hover:bg-muted lg:hidden"
          aria-label="Menu"
        >
          <Menu className="size-5" />
        </button>
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
