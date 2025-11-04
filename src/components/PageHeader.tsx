"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
}

export function PageHeader({ title, description, breadcrumbs, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-8 animate-slide-up-fade", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 hover:text-foreground transition-colors duration-200"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>
          {breadcrumbs.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <ChevronRight className="h-3.5 w-3.5" />
              {item.href ? (
                <Link href={item.href} className="hover:text-foreground transition-colors duration-200">
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">{item.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {description && <p className="mt-2 text-muted-foreground">{description}</p>}
    </div>
  );
}
