import { IconCheck, IconCross } from "@/components/ui/icons";
import { groupPrompts } from "@/lib/audit/group";
import type { StoredPrompt } from "@/lib/audit/store";
import { AuthPanel } from "./auth-panel";
import { LockIcon, Masked, TierBadge } from "./lock";

const LABELS = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  perplexity: "Perplexity",
  gemini: "Gemini",
};

/**
 * Le rapport : les questions réellement posées, et qui est ressorti dessus.
 *
 * Inclus avec le compte. Quand le visiteur n'est pas connecté, le
 * tableau n'est pas rendu du tout : on montre une silhouette fabriquée à
 * partir des seules questions, sans les réponses. Flouter du vrai contenu
 * dans le HTML revient à le donner.
 */
export function ReportSection({
  prompts,
  auditId,
}: {
  prompts: StoredPrompt[] | null;
  auditId: string;
}) {
  const unlocked = prompts !== null;
  const grouped = unlocked ? groupPrompts(prompts, LABELS) : [];

  return (
    <section id="compte" className="scroll-mt-24 rounded-md border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-4 sm:px-9">
        <h2 className="eyebrow text-ink-soft">Le détail, question par question</h2>
        <TierBadge tone="free">
          {unlocked ? (
            <IconCheck className="h-3 w-3" />
          ) : (
            <LockIcon className="h-3 w-3" />
          )}
          Inclus avec ton compte
        </TierBadge>
      </div>

      <div className="px-6 py-7 sm:px-9">
        {unlocked ? (
          grouped.length > 0 ? (
            <PromptTable rows={grouped} />
          ) : (
            <p className="text-[0.9375rem] leading-relaxed text-ink-soft">
              Aucun moteur n’a pu être interrogé pour cet audit : il n’y a pas de
              détail à montrer. Rien ne t’a été facturé.
            </p>
          )
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="min-w-0 lg:col-span-7">
              <Masked className="max-h-[26rem]">
                <Silhouette />
              </Masked>
            </div>
            <div className="min-w-0 lg:col-span-5">
              <AuthPanel
                next={`/audit/${auditId}`}
                title="Crée ton compte pour voir le détail"
                lede="Sans carte bancaire. Tu récupères les questions posées, qui est cité à ta place sur chacune, et ton rang quand tu ressors."
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** Une forme de tableau, sans aucune donnée de l'audit. */
function Silhouette() {
  return (
    <div className="space-y-4" aria-hidden="true">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-6 border-b border-line pb-4">
          <span className="h-3 flex-1 rounded-full bg-line" />
          <span className="h-3 w-24 rounded-full bg-line" />
          <span className="h-3 w-12 rounded-full bg-line" />
        </div>
      ))}
    </div>
  );
}

function PromptTable({
  rows,
}: {
  rows: ReturnType<typeof groupPrompts>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[38rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="eyebrow pb-3 pr-6 text-ink-soft">
              Question posée
            </th>
            <th scope="col" className="eyebrow pb-3 pr-6 text-ink-soft">
              Qui est cité
            </th>
            <th scope="col" className="eyebrow pb-3 text-right text-ink-soft">
              Toi
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.prompt}
              className="row-hover border-b border-line last:border-b-0"
            >
              <td className="max-w-[26rem] py-4 pr-6 text-[0.9375rem] leading-snug text-ink">
                {row.prompt}
              </td>
              <td className="py-4 pr-6 text-[0.875rem] leading-snug text-ink-soft">
                {row.winners.length > 0 ? (
                  row.winners.slice(0, 4).join(" · ")
                ) : (
                  <span className="text-absent">aucune source nommée</span>
                )}
              </td>
              <td className="py-4 text-right align-top">
                <span
                  className={`inline-flex items-center gap-1.5 text-[0.8125rem] font-medium ${
                    row.citedBy.length > 0 ? "text-cobalt" : "text-absent"
                  }`}
                >
                  {row.citedBy.length > 0 ? (
                    <IconCheck className="h-3.5 w-3.5" />
                  ) : (
                    <IconCross className="h-3.5 w-3.5" />
                  )}
                  {row.citedBy.length > 0 ? "Cité" : "Absent"}
                </span>
                <span className="mt-1 block text-[0.75rem] leading-snug text-absent">
                  {row.citedBy.length > 0
                    ? `${row.citedBy.join(", ")}${row.bestPosition ? ` — ${row.bestPosition}ᵉ source` : ""}`
                    : row.absentFrom.join(", ")}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
