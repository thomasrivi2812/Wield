import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { Container } from "@/components/ui/container";
import { Dashboard } from "@/components/espace/dashboard";
import { ClaimAudits } from "@/components/espace/claim-audits";
import { AuthPanel } from "@/components/audit/auth-panel";
import { getSession } from "@/lib/session";
import { loadEspace } from "@/lib/espace";

export const metadata: Metadata = {
  title: "Mon espace",
  description: "Tes audits, tes ressources et ta discussion avec l’équipe Wield.",
  robots: { index: false, follow: false },
};

export default async function EspacePage({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string }>;
}) {
  const { auth } = await searchParams;
  const session = await getSession();

  if (session.state === "unconfigured") {
    return (
      <PageShell notice="Supabase n’est pas branché sur ce déploiement : compte de démonstration, aucune donnée réelle.">
        <Dashboard />
      </PageShell>
    );
  }

  if (session.state === "anonymous") {
    return (
      <PageShell>
        <SignIn problem={auth} />
      </PageShell>
    );
  }

  const data = await loadEspace(session.user);

  return (
    <PageShell>
      <Dashboard data={data} claim={<ClaimAudits />} />
    </PageShell>
  );
}

function SignIn({ problem }: { problem?: string }) {
  const message =
    problem === "failed"
      ? "La connexion n’a pas abouti. Le lien a peut-être expiré — réessaie."
      : problem === "unconfigured"
        ? "La connexion n’est pas encore branchée sur ce déploiement."
        : null;

  return (
    <div className="bg-bg">
      <Container>
        <div className="grid gap-12 py-16 lg:grid-cols-12 lg:gap-16 lg:py-24">
          <div className="min-w-0 lg:col-span-6">
            <p className="eyebrow flex items-center gap-3 text-ink-soft">
              <span aria-hidden="true" className="h-px w-8 bg-cobalt" />
              Ton espace
            </p>

            <h1 className="mt-7 text-[2.25rem] leading-[1.05] sm:text-[2.75rem]">
              Connecte-toi
            </h1>

            <p className="mt-7 max-w-[46ch] text-[1.0625rem] leading-[1.7] text-ink-soft">
              Tu retrouves l’historique de tes audits, tes guides et tes
              rapports, et la discussion avec l’équipe.
            </p>

            {message ? (
              <p
                role="status"
                className="mt-7 rounded-sm border border-line-strong bg-surface px-5 py-4 text-[0.9375rem] leading-relaxed text-ink"
              >
                {message}
              </p>
            ) : null}
          </div>

          <div className="min-w-0 lg:col-span-6">
            <AuthPanel
              next="/espace"
              title="Se connecter"
              lede="Pas de mot de passe : Google, ou un lien envoyé par e-mail. Le compte se crée tout seul à la première connexion."
            />
          </div>
        </div>
      </Container>
    </div>
  );
}
