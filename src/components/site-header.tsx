"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

const NAV = [
  { label: "Le GEO", href: "/#geo" },
  { label: "Offres", href: "/#offres" },
  { label: "Guides", href: "/#guides" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/85 backdrop-blur-md">
      <Container>
        <div className="flex h-[4.5rem] items-center justify-between gap-8">
          <Logo />

          <nav
            aria-label="Navigation principale"
            className="hidden items-center gap-8 lg:flex"
          >
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-[0.9375rem] text-ink-soft transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-5 lg:flex">
            <Link
              href="/#brief"
              className="text-[0.9375rem] text-ink-soft transition-colors hover:text-ink"
            >
              Recevoir la veille
            </Link>
            <Button href="/#test" size="md">
              Audit gratuit
            </Button>
          </div>

          <button
            type="button"
            aria-expanded={open}
            aria-controls="nav-mobile"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-sm border border-line-strong lg:hidden"
          >
            <span className="sr-only">Menu</span>
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
              {open ? (
                <path
                  d="m5 5 10 10M15 5 5 15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="square"
                />
              ) : (
                <path
                  d="M3 6h14M3 14h14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="square"
                />
              )}
            </svg>
          </button>
        </div>
      </Container>

      {open ? (
        <div id="nav-mobile" className="border-t border-line bg-bg lg:hidden">
          <Container className="flex flex-col gap-1 py-5">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-2.5 font-display text-lg font-medium"
              >
                {item.label}
              </Link>
            ))}
            <Button href="/#test" size="lg" className="mt-4 w-full">
              Audit de visibilité IA — gratuit
            </Button>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
