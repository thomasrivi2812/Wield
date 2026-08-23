import { NextResponse } from "next/server";
import { costOf } from "@/lib/audit/cost";
import { runAudit } from "@/lib/audit/run";
import { PROMPTS_PER_AUDIT } from "@/lib/audit/prompts";
import { clientIp, consume } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AuditProgress, AuditResult } from "@/lib/audit/types";

/** Les moteurs sont lents : la valeur par défaut de Vercel ne suffit pas. */
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Un audit coûte de l'argent réel à chaque exécution : quatre moteurs fois six
 * questions, avec recherche web. Les plafonds sont serrés exprès.
 *
 * Deux compteurs, parce qu'ils protègent de deux choses différentes : celui
 * par compte borne ce qu'une personne peut dépenser, celui par adresse borne
 * ce qu'un script peut dépenser en créant des comptes à la chaîne.
 */
const LIMIT_PER_USER = 3;
const LIMIT_PER_IP = 6;
const WINDOW_SECONDS = 60 * 60;

export async function POST(request: Request) {
  // Un audit se paie en appels d'API. Il n'est plus lancé pour un visiteur
  // anonyme : sans compte, rien ne borne la dépense qu'une adresse tournante
  // peut provoquer.
  const session = await getSession();
  if (session.state === "anonymous") {
    return NextResponse.json(
      { error: "Crée ton compte pour lancer un audit.", signIn: true },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "corps JSON invalide" }, { status: 400 });
  }

  const { query, brand, domain, anonId } = (body ?? {}) as Record<string, unknown>;

  if (typeof query !== "string" || query.trim().length < 3) {
    return NextResponse.json(
      { error: "Indique ton secteur ou ta boîte (3 caractères minimum)." },
      { status: 400 },
    );
  }
  if (query.length > 160) {
    return NextResponse.json(
      { error: "Requête trop longue (160 caractères maximum)." },
      { status: 400 },
    );
  }

  const tooMany = { status: 429, headers: { "Retry-After": String(WINDOW_SECONDS) } };

  if (session.state === "signed-in") {
    const perUser = await consume(
      `audit:user:${session.user.id}`,
      LIMIT_PER_USER,
      WINDOW_SECONDS,
    );
    if (!perUser.allowed) {
      return NextResponse.json(
        { error: "Tu as atteint la limite de trois audits par heure. Réessaie plus tard." },
        tooMany,
      );
    }
  }

  const perIp = await consume(
    `audit:ip:${clientIp(request)}`,
    LIMIT_PER_IP,
    WINDOW_SECONDS,
  );
  if (!perIp.allowed) {
    return NextResponse.json(
      { error: "Trop d'audits depuis cette adresse. Réessaie dans une heure." },
      tooMany,
    );
  }

  const input = {
    query: query.trim(),
    brand: typeof brand === "string" && brand.trim() ? brand.trim() : undefined,
    domain: typeof domain === "string" && domain.trim() ? domain.trim() : undefined,
  };

  const anon = typeof anonId === "string" ? anonId : undefined;
  const owner = session.state === "signed-in" ? session.user.id : null;

  // La réponse est un flux : un audit dure une à deux minutes, et attendre
  // la fin pour afficher quoi que ce soit donne une page qui semble figée.
  // Chaque ligne est un objet JSON complet, terminé par un saut de ligne.
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let open = true;
      const send = (payload: unknown) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
        } catch {
          // Onglet fermé : on cesse d'écrire, mais l'audit va à son terme —
          // il est payé en appels API, il doit finir en base.
          open = false;
        }
      };

      void (async () => {
        try {
          const result = await runAudit(input, undefined, (event) =>
            send(publicProgress(event)),
          );
          const auditId = await persist(result, input, anon, owner);
          send({ type: "done", id: auditId, ...publicView(result) });
        } catch (error) {
          console.error("[audit] échec", error);
          send({
            type: "error",
            message: "L’audit a échoué. Réessaie dans un instant.",
          });
        } finally {
          open = false;
          try {
            controller.close();
          } catch {
            // déjà fermé côté client
          }
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      // `no-transform` et `X-Accel-Buffering` empêchent les intermédiaires de
      // tamponner la réponse : sans eux, tout arrive d'un bloc à la fin et le
      // flux ne sert plus à rien.
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

/** Même règle que pour le résultat final : aucun message de fournisseur à l'écran. */
function publicProgress(event: AuditProgress): AuditProgress {
  return event.type === "engine"
    ? { ...event, detail: publicDetail(event.status, event.detail) }
    : event;
}

/**
 * Le détail par question est le niveau payant : il ne sort pas de la réponse
 * publique. Il est écrit en base et servi plus tard, une fois le compte créé.
 */
function publicView(result: AuditResult) {
  return {
    query: result.query,
    mode: result.mode,
    citedCount: result.citedCount,
    measuredCount: result.measuredCount,
    promptCount: PROMPTS_PER_AUDIT,
    engines: result.engines.map((engine) => ({
      engine: engine.engine,
      label: engine.label,
      status: engine.status,
      detail: publicDetail(engine.status, engine.detail),
    })),
  };
}

/**
 * Les messages d'erreur des fournisseurs ne partent jamais au navigateur :
 * ils contiennent des noms d'hôtes, des codes internes et parfois des
 * fragments de configuration. Ils restent en base et dans les journaux.
 */
function publicDetail(status: string, detail: string): string {
  return status === "error" ? "moteur momentanément indisponible" : detail;
}

async function persist(
  result: AuditResult,
  input: { brand?: string; domain?: string },
  anonId: string | undefined,
  userId: string | null,
): Promise<string | null> {
  const admin = supabaseAdmin();
  if (!admin) return null;

  const { data, error } = await admin
    .from("audits")
    .insert({
      user_id: userId,
      anon_id: userId ? null : (anonId ?? null),
      query: result.query,
      brand: input.brand ?? null,
      domain: input.domain ?? null,
      status: "done",
      cited_count: result.citedCount,
      measured_count: result.measuredCount,
      cost_usd: result.costUsd,
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[audit] enregistrement impossible", error?.message);
    return null;
  }

  const auditId = data.id as string;

  await admin.from("audit_engines").insert(
    result.engines.map((engine) => ({
      audit_id: auditId,
      engine: engine.engine,
      status: engine.status,
      detail: engine.detail,
      latency_ms: engine.latencyMs,
      input_tokens: engine.usage?.inputTokens ?? null,
      output_tokens: engine.usage?.outputTokens ?? null,
      searches: engine.usage?.searches ?? null,
      cost_usd: costOf(engine.engine, engine.usage),
    })),
  );

  const rows = result.engines.flatMap((engine) =>
    engine.prompts.map((prompt) => ({
      audit_id: auditId,
      engine: engine.engine,
      prompt: prompt.prompt,
      cited: prompt.cited,
      position: prompt.position,
      winners: prompt.winners,
      sources: prompt.sources,
      answer: prompt.answer,
    })),
  );
  if (rows.length) await admin.from("audit_prompts").insert(rows);

  return auditId;
}
