import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "outline" | "outline-invert" | "ghost";
type Size = "md" | "lg";

const base =
  "group inline-flex items-center justify-center gap-2.5 rounded-sm font-display font-semibold " +
  "transition-[background-color,border-color,color,transform] duration-150 active:translate-y-px " +
  "disabled:pointer-events-none disabled:opacity-45";

const variants: Record<Variant, string> = {
  primary: "bg-cobalt text-white hover:bg-cobalt-hover",
  outline:
    "border border-line-strong bg-surface text-ink hover:border-ink hover:bg-white",
  "outline-invert":
    "border border-line-invert bg-transparent text-ink-invert hover:border-ink-invert/50 hover:bg-white/5",
  ghost: "text-ink-soft hover:text-cobalt",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-[3.25rem] px-7 text-base",
};

export function Button({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: {
  href?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const classes = cn(base, variants[variant], sizes[size], className);

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

/** Lien secondaire discret, avec le trait qui se dessine au survol. */
export function QuietLink({
  href,
  onDark = false,
  className,
  children,
}: {
  href: string;
  onDark?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 text-[0.9375rem] transition-colors",
        onDark
          ? "text-ink-invert-soft hover:text-ink-invert"
          : "text-ink-soft hover:text-ink",
        className,
      )}
    >
      <span className="border-b border-transparent pb-px transition-colors group-hover:border-current">
        {children}
      </span>
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
      >
        <path
          d="M3 8h10M9 4l4 4-4 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="square"
        />
      </svg>
    </Link>
  );
}
