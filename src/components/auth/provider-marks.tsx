/**
 * Marques des fournisseurs, en monochrome pour tenir la charte.
 *
 * Avant mise en ligne : Google et Apple imposent des règles précises sur
 * l'apparence de leurs boutons de connexion. Ces marques sont une base de
 * travail, pas une version conforme à leurs chartes.
 */
import type { ProviderId } from "@/lib/auth-providers";

const SIZE = "h-[1.125rem] w-[1.125rem]";

function Google() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={SIZE}>
      <path fill="currentColor" d="M12 10.2v3.9h5.5a4.7 4.7 0 0 1-2 3.1l3.2 2.5c1.9-1.7 3-4.3 3-7.3 0-.7-.1-1.4-.2-2.1H12Z" />
      <path fill="currentColor" opacity="0.75" d="M6.3 14.3 5.6 15l-2.5 2A10 10 0 0 0 12 22c2.7 0 5-.9 6.7-2.4l-3.2-2.5c-.9.6-2 1-3.5 1a6 6 0 0 1-5.7-4.1Z" />
      <path fill="currentColor" opacity="0.5" d="M3.1 7A10 10 0 0 0 2 12c0 1.8.4 3.5 1.1 5l3.2-2.7a6 6 0 0 1 0-3.8L3.1 7Z" />
      <path fill="currentColor" opacity="0.9" d="M12 5.9c1.5 0 2.9.5 4 1.5l2.9-2.9A10 10 0 0 0 3.1 7l3.2 2.6A6 6 0 0 1 12 5.9Z" />
    </svg>
  );
}

function Microsoft() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={SIZE}>
      <path fill="currentColor" d="M3 3h8.5v8.5H3V3Z" />
      <path fill="currentColor" opacity="0.75" d="M12.5 3H21v8.5h-8.5V3Z" />
      <path fill="currentColor" opacity="0.6" d="M3 12.5h8.5V21H3v-8.5Z" />
      <path fill="currentColor" opacity="0.45" d="M12.5 12.5H21V21h-8.5v-8.5Z" />
    </svg>
  );
}

function Apple() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={SIZE}>
      <path fill="currentColor" d="M16.4 12.7c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.5 0-2.8.8-3.5 2.1-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7s1.7.7 2.8.7 1.9-1 2.6-2a9 9 0 0 0 1.2-2.4c-.1 0-2.3-.9-2.3-3.3ZM14.2 6.2c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.5.6-1 1.7-.9 2.6 1 .1 2-.5 2.6-1.2Z" />
    </svg>
  );
}

function LinkedIn() {
  return (
    // fillRule evenodd : sans quoi les lettres, tracées à l'intérieur du
    // carré et de la même couleur, disparaissent dans le fond.
    <svg viewBox="0 0 24 24" aria-hidden="true" className={SIZE}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.5 3h17A.5.5 0 0 1 21 3.5v17a.5.5 0 0 1-.5.5h-17a.5.5 0 0 1-.5-.5v-17a.5.5 0 0 1 .5-.5Zm2.6 6.6h2.6V18H6.1V9.6Zm1.3-4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM10.4 9.6H13v1.2c.4-.7 1.3-1.4 2.7-1.4 2 0 3 1.3 3 3.7V18h-2.6v-4.3c0-1.2-.4-1.9-1.4-1.9-1 0-1.6.7-1.6 1.9V18h-2.6V9.6Z"
      />
    </svg>
  );
}

function GitHub() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={SIZE}>
      <path fill="currentColor" d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.3-3.4-1.3-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .8 0-.7.3-1.1.6-1.4-2.2-.2-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.8-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

const MARKS: Record<ProviderId, () => React.JSX.Element> = {
  google: Google,
  azure: Microsoft,
  apple: Apple,
  linkedin_oidc: LinkedIn,
  github: GitHub,
};

export function ProviderMark({ id }: { id: ProviderId }) {
  const Mark = MARKS[id];
  return <Mark />;
}
