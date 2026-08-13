import Link from "next/link";
import type { NavLink } from "@/types/bakingo";

/**
 * Breadcrumb navigation component.
 * Renders a semantic nav with ordered list of breadcrumb items.
 * Links are rendered for items with href; the last item (current page) is plain text.
 */
export function Breadcrumbs({ items }: { items: NavLink[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-0 h-[22px] text-[14px] text-[rgb(81,81,81)]">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-0">
            {item.href ? (
              <Link
                href={item.href}
                className="hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span>{item.label}</span>
            )}
            {index < items.length - 1 && (
              <span className="mx-[8px]">&gt;</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
