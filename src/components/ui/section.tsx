import { cn } from "@/lib/cn";
import { Container } from "./container";

export function Section({
  id,
  tone = "light",
  className,
  children,
}: {
  id?: string;
  tone?: "light" | "surface" | "slate";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative scroll-mt-20",
        tone === "light" && "bg-bg text-ink",
        tone === "surface" && "bg-surface text-ink",
        tone === "slate" && "bg-slate text-ink-invert",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Eyebrow({
  onDark = false,
  children,
}: {
  onDark?: boolean;
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "eyebrow flex items-center gap-3",
        onDark ? "text-ink-invert-soft" : "text-ink-soft",
      )}
    >
      <span
        aria-hidden="true"
        className={cn("h-px w-8", onDark ? "bg-line-invert" : "bg-cobalt")}
      />
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lede,
  onDark = false,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  onDark?: boolean;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow ? (
        <Eyebrow onDark={onDark}>{eyebrow}</Eyebrow>
      ) : null}
      <h2
        className={cn(
          "max-w-[18ch] text-[2.5rem] leading-[1.04] sm:text-[3rem] lg:text-[3.5rem]",
          align === "center" && "max-w-[22ch]",
        )}
      >
        {title}
      </h2>
      {lede ? (
        <p
          className={cn(
            "max-w-[58ch] text-[1.0625rem] leading-[1.65]",
            onDark ? "text-ink-invert-soft" : "text-ink-soft",
          )}
        >
          {lede}
        </p>
      ) : null}
    </div>
  );
}

export { Container };
