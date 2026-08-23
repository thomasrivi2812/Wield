import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Hero } from "@/components/sections/hero";
import { Problem } from "@/components/sections/problem";
import { CitationTest } from "@/components/sections/citation-test";
import { Geo } from "@/components/sections/geo";
import { Stat } from "@/components/sections/stat";
import { Offers } from "@/components/sections/offers";
import { Guides } from "@/components/sections/guides";
import { FinalCta } from "@/components/sections/final-cta";
import { HomeJsonLd } from "@/components/json-ld";

export default function HomePage() {
  return (
    <>
      <a
        href="#test"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:bg-cobalt focus:px-4 focus:py-2 focus:text-white"
      >
        Aller au test de visibilité
      </a>

      <SiteHeader />

      <main>
        <Hero />
        <Problem />
        <CitationTest />
        <Geo />
        <Stat />
        <Offers />
        <Guides />
        <FinalCta />
      </main>

      <SiteFooter />
      <HomeJsonLd />
    </>
  );
}
