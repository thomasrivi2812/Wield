import { IconCheck, IconCross } from "@/components/ui/icons";
import { TierBadge } from "./lock";

export type ScoreEngine = {
  engine: string;
  label: string;
  status: string;
  detail: string;
};

/** Un moteur non interrogé n'entre jamais dans le score. */
export function isUnmeasured(status: string): boolean {
  return status === "not_configured" || status === "not_implemented";
}

/**
 * Le score. Toujours libre d'accès : c'est le constat, pas le conseil.
 * Il se lit « cité sur mesuré », jamais « sur 4 » — un moteur qu'on n'a pas
 * pu interroger ne compte pas comme une absence.
 */
export function ScoreCard({
  citedCount,
  measuredCount,
  engines,
  demo = false,
}: {
  citedCount: number;
  measuredCount: number;
  engines: ScoreEngine[];
  demo?: boolean;
}) {
  const measured = measuredCount > 0;

  return (
    <section className="rounded-md border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-4 sm:px-9">
        <h2 className="eyebrow text-ink-soft">Score de citation</h2>
        <TierBadge tone="free">
          <IconCheck className="h-3 w-3" />
          Libre d’accès
        </TierBadge>
      </div>

      {demo ? (
        <p className="border-b border-line bg-cobalt-soft px-6 py-3 text-[0.8125rem] leading-relaxed text-cobalt sm:px-9">
          Aucun moteur n’est branché pour l’instant : ce résultat est une
          démonstration. Les moteurs non mesurés sont signalés comme tels, jamais
          comptés comme absents.
        </p>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-6 px-6 pt-8 sm:px-9">
        <div>
          <p className="font-display text-[3.5rem] leading-none font-extrabold tracking-tight tabular-nums sm:text-[4.5rem]">
            <span className={measured ? "text-cobalt" : "text-absent"}>
              {measured ? citedCount : "—"}
            </span>
            <span className="text-absent">/{measured ? measuredCount : "—"}</span>
          </p>
          <p className="mt-3 text-[0.8125rem] text-ink-soft">
            {measured
              ? `moteurs qui te citent, sur ${measuredCount} mesuré${measuredCount > 1 ? "s" : ""}`
              : "moteurs qui te citent, sur ceux réellement mesurés"}
          </p>
        </div>

        <div className="flex gap-1.5" aria-hidden="true">
          {engines.map((engine) => (
            <span
              key={engine.engine}
              className={`h-1.5 w-14 rounded-full ${
                engine.status === "cited"
                  ? "bg-present"
                  : engine.status === "absent"
                    ? "bg-absent"
                    : "bg-line"
              }`}
            />
          ))}
        </div>
      </div>

      <ul className="mt-8 px-6 pb-2 sm:px-9">
        {engines.map((engine) => (
          <EngineRow key={engine.engine} engine={engine} />
        ))}
      </ul>
    </section>
  );
}

function EngineRow({ engine }: { engine: ScoreEngine }) {
  const cited = engine.status === "cited";
  const absent = engine.status === "absent";
  const unmeasured = isUnmeasured(engine.status);

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line py-4">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xs border ${
          cited
            ? "border-cobalt bg-cobalt text-white"
            : absent
              ? "border-line-strong text-absent"
              : "border-line text-line-strong"
        }`}
      >
        {cited ? (
          <IconCheck className="h-3.5 w-3.5" />
        ) : absent ? (
          <IconCross className="h-3.5 w-3.5" />
        ) : (
          <span className="h-1 w-1 rounded-full bg-current" />
        )}
      </span>

      <span className="font-display text-[1.0625rem] font-semibold">
        {engine.label}
      </span>

      <span
        className={`ml-auto text-right text-[0.875rem] ${cited ? "text-cobalt" : "text-absent"}`}
      >
        {cited
          ? `Cité — ${engine.detail}`
          : absent
            ? "Absent"
            : unmeasured
              ? `Non mesuré — ${engine.detail}`
              : `Erreur — ${engine.detail}`}
      </span>
    </li>
  );
}
