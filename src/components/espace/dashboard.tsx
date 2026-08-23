"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { IconArrow, IconCheck } from "@/components/ui/icons";
import { WieldMark } from "@/components/ui/icons";
import { ACCOUNT, AUDITS, RESOURCES, THREAD, type Message } from "./data";

const TABS = [
  { id: "audits", label: "Mes audits" },
  { id: "resources", label: "Mes ressources" },
  { id: "chat", label: "Discussion" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function Dashboard() {
  const [tab, setTab] = useState<TabId>("audits");

  return (
    <div className="bg-bg">
      <Container>
        <div className="py-12 lg:py-16">
          <AccountHeader />

          <div
            role="tablist"
            aria-label="Sections de l’espace"
            className="mt-10 flex gap-1 border-b border-line"
          >
            {TABS.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  role="tab"
                  id={`tab-${item.id}`}
                  aria-selected={active}
                  aria-controls={`panel-${item.id}`}
                  onClick={() => setTab(item.id)}
                  className={`-mb-px border-b-2 px-4 py-3 font-display text-[0.9375rem] font-semibold transition-colors ${
                    active
                      ? "border-cobalt text-ink"
                      : "border-transparent text-ink-soft hover:text-ink"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="pt-10">
            {tab === "audits" ? <AuditsPanel /> : null}
            {tab === "resources" ? <ResourcesPanel /> : null}
            {tab === "chat" ? <ChatPanel /> : null}
          </div>
        </div>
      </Container>
    </div>
  );
}

function AccountHeader() {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="eyebrow flex items-center gap-3 text-ink-soft">
          <span aria-hidden="true" className="h-px w-8 bg-cobalt" />
          Ton espace
        </p>
        <h1 className="mt-6 text-[2rem] leading-[1.06] sm:text-[2.5rem]">
          {ACCOUNT.company}
        </h1>
        <p className="mt-3 text-[0.9375rem] text-ink-soft">
          {ACCOUNT.name} · abonnement {ACCOUNT.plan}
        </p>
      </div>

      <Button href="/#test" size="md">
        Lancer un nouvel audit
        <IconArrow />
      </Button>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function AuditsPanel() {
  const latest = AUDITS[0];
  const first = AUDITS[AUDITS.length - 1];
  const delta = latest.score - first.score;

  return (
    <section
      role="tabpanel"
      id="panel-audits"
      aria-labelledby="tab-audits"
      className="flex flex-col gap-6"
    >
      <div className="grid gap-6 sm:grid-cols-3">
        <Stat label="Dernier score" value={`${latest.score}/${latest.max}`} note={latest.date} accent />
        <Stat
          label="Depuis le premier audit"
          value={`${delta >= 0 ? "+" : ""}${delta}`}
          note={`sur ${AUDITS.length} audits`}
        />
        <Stat label="Prochain audit automatique" value="12 sept." note="inclus dans ton pack" />
      </div>

      <div className="overflow-hidden rounded-md border border-line bg-surface">
        <div className="border-b border-line px-6 py-4 sm:px-8">
          <h2 className="eyebrow text-ink-soft">Historique</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[38rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="eyebrow px-6 py-3 text-ink-soft sm:px-8">
                  Date
                </th>
                <th scope="col" className="eyebrow px-6 py-3 text-ink-soft">
                  Requête
                </th>
                <th scope="col" className="eyebrow px-6 py-3 text-ink-soft">
                  Formule
                </th>
                <th scope="col" className="eyebrow px-6 py-3 text-right text-ink-soft sm:px-8">
                  Score
                </th>
              </tr>
            </thead>
            <tbody>
              {AUDITS.map((audit) => (
                <tr
                  key={`${audit.date}-${audit.query}`}
                  className="border-b border-line last:border-b-0"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-[0.9375rem] text-ink sm:px-8">
                    {audit.date}
                    {audit.auto ? (
                      <span className="ml-2 rounded-xs bg-cobalt-soft px-1.5 py-0.5 text-[0.6875rem] font-semibold text-cobalt">
                        auto
                      </span>
                    ) : null}
                  </td>
                  <td className="px-6 py-4 text-[0.9375rem] text-ink-soft">
                    {audit.query}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-[0.875rem] text-ink-soft">
                    {audit.tier}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right sm:px-8">
                    <span className="font-display text-[1.0625rem] font-bold tabular-nums">
                      <span className={audit.score > 0 ? "text-cobalt" : "text-absent"}>
                        {audit.score}
                      </span>
                      <span className="text-absent">/{audit.max}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  note,
  accent = false,
}: {
  label: string;
  value: string;
  note: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-md border border-line bg-surface p-6">
      <p className="eyebrow text-ink-soft">{label}</p>
      <p
        className={`mt-4 font-display text-[2rem] font-extrabold leading-none tabular-nums ${
          accent ? "text-cobalt" : "text-ink"
        }`}
      >
        {value}
      </p>
      <p className="mt-3 text-[0.8125rem] text-absent">{note}</p>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function ResourcesPanel() {
  return (
    <section
      role="tabpanel"
      id="panel-resources"
      aria-labelledby="tab-resources"
      className="overflow-hidden rounded-md border border-line bg-surface"
    >
      <ul className="divide-y divide-line">
        {RESOURCES.map((resource) => (
          <li
            key={resource.title}
            className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:gap-6 sm:px-8"
          >
            <span className="eyebrow w-24 shrink-0 text-absent">
              {resource.kind}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block font-display text-[1.0625rem] font-semibold leading-snug text-ink">
                {resource.title}
              </span>
              <span className="mt-1 block text-[0.8125rem] text-ink-soft">
                {resource.meta}
              </span>
            </span>

            <Button href="/espace" variant="outline" size="md" className="shrink-0">
              {resource.action}
            </Button>
          </li>
        ))}
      </ul>

      <div className="border-t border-line bg-bg px-6 py-5 text-[0.9375rem] text-ink-soft sm:px-8">
        Il te manque un guide ?{" "}
        <Link
          href="/guides"
          className="text-cobalt underline decoration-line-strong underline-offset-2 hover:decoration-cobalt"
        >
          Voir toute la bibliothèque
        </Link>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */

function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>(THREAD);
  const [draft, setDraft] = useState("");

  function send(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setMessages((prev) => [
      ...prev,
      { from: "me", author: "Toi", time: "à l’instant", body },
    ]);
    setDraft("");
  }

  return (
    <section
      role="tabpanel"
      id="panel-chat"
      aria-labelledby="tab-chat"
      className="grid gap-6 lg:grid-cols-12"
    >
      <div className="min-w-0 lg:col-span-8">
        <div className="flex flex-col overflow-hidden rounded-md border border-line bg-surface">
          <div className="flex items-center gap-3 border-b border-line px-6 py-4 sm:px-8">
            <WieldMark className="h-5 w-5 text-cobalt" />
            <span className="font-display text-[0.9375rem] font-semibold text-ink">
              Équipe Wield
            </span>
            <span className="ml-auto text-[0.8125rem] text-ink-soft">
              Répond en général dans la journée
            </span>
          </div>

          <ul className="flex flex-col gap-5 px-6 py-7 sm:px-8">
            {messages.map((message, i) => {
              const mine = message.from === "me";
              return (
                <li
                  key={i}
                  className={`flex max-w-[42rem] flex-col gap-1.5 ${
                    mine ? "self-end items-end" : "self-start"
                  }`}
                >
                  <span className="text-[0.75rem] text-absent">
                    {message.author} · {message.time}
                  </span>
                  <span
                    className={`rounded-md px-5 py-3.5 text-[0.9375rem] leading-[1.6] ${
                      mine
                        ? "bg-cobalt text-white"
                        : "border border-line bg-bg text-ink"
                    }`}
                  >
                    {message.body}
                  </span>
                </li>
              );
            })}
          </ul>

          <form
            onSubmit={send}
            className="flex flex-col gap-3 border-t border-line px-6 py-5 sm:px-8"
          >
            <label htmlFor="message" className="sr-only">
              Ton message à l’équipe
            </label>
            <textarea
              id="message"
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Une question sur ton audit, un blocage, une idée…"
              className="w-full resize-y rounded-sm border border-line-strong bg-surface px-4 py-3 text-[0.9375rem] leading-relaxed text-ink placeholder:text-absent focus:border-cobalt focus:outline-none"
            />
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-[0.75rem] text-absent">
                Une vraie personne te répond, pas un robot.
              </p>
              <Button size="md">Envoyer</Button>
            </div>
          </form>
        </div>
      </div>

      <aside className="min-w-0 lg:col-span-4">
        <div className="rounded-md border border-line bg-surface p-7">
          <h2 className="text-[1.25rem] leading-snug">Ce qu’on peut regarder</h2>
          <ul className="mt-5 flex flex-col gap-3.5">
            {[
              "Décortiquer un audit ligne par ligne",
              "Prioriser les actions selon tes moyens",
              "Relire une page avant publication",
              "Cadrer une mission Wield Studio",
            ].map((item) => (
              <li key={item} className="flex gap-3 text-[0.9375rem] leading-snug">
                <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-cobalt" />
                <span className="text-ink-soft">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </section>
  );
}
