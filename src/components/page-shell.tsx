import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";

export function PageShell({
  notice,
  showInfra = true,
  children,
}: {
  notice?: string;
  showInfra?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />

      {notice ? (
        <div className="border-b border-line bg-cobalt-soft">
          <Container>
            <p className="py-2.5 text-[0.8125rem] text-cobalt">{notice}</p>
          </Container>
        </div>
      ) : null}

      <main>{children}</main>

      <SiteFooter showInfra={showInfra} />
    </>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lede,
  aside,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="border-b border-line bg-bg">
      <Container>
        <div className="grid gap-10 py-16 lg:grid-cols-12 lg:gap-16 lg:py-20">
          <div className="min-w-0 lg:col-span-7">
            <p className="eyebrow flex items-center gap-3 text-ink-soft">
              <span aria-hidden="true" className="h-px w-8 bg-cobalt" />
              {eyebrow}
            </p>
            <h1 className="mt-7 text-[2.25rem] leading-[1.05] sm:text-[3rem] lg:text-[3.5rem]">
              {title}
            </h1>
          </div>

          {lede || aside ? (
            <div className="min-w-0 lg:col-span-5 lg:pt-16">
              {lede ? (
                <p className="text-[1.0625rem] leading-[1.7] text-ink-soft">
                  {lede}
                </p>
              ) : null}
              {aside}
            </div>
          ) : null}
        </div>
      </Container>
    </div>
  );
}
