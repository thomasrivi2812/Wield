export type EngineId = "chatgpt" | "claude" | "perplexity" | "gemini";

/**
 * `not_configured` : pas de clé API pour ce moteur.
 * `not_implemented` : adaptateur pas encore écrit.
 * Les deux sortent du calcul du score — on ne compte jamais comme « absent »
 * un moteur qu'on n'a pas interrogé.
 */
export type EngineStatus =
  | "cited"
  | "absent"
  | "error"
  | "not_configured"
  | "not_implemented";

export type Source = { title: string; url: string; domain: string };

export type PromptResult = {
  prompt: string;
  cited: boolean;
  /** Rang de la marque parmi les sources citées, 1 = première. */
  position: number | null;
  /** Domaines cités à la place de la marque. */
  winners: string[];
  sources: Source[];
  answer: string;
};

export type EngineResult = {
  engine: EngineId;
  label: string;
  status: EngineStatus;
  detail: string;
  latencyMs: number | null;
  prompts: PromptResult[];
  /** Cumul sur les six questions. Absent si le moteur n'a rien renvoyé. */
  usage?: Usage;
};

export type AuditInput = {
  /** Le secteur ou le métier, tel que saisi. Sert à fabriquer les questions. */
  query: string;
  /** Le nom de la marque à repérer dans les réponses. */
  brand?: string;
  /** Le domaine de la marque. Bien plus fiable que le nom pour la détection. */
  domain?: string;
};

export type AuditResult = AuditInput & {
  /** `demo` quand aucun moteur n'est branché : le site le dit à l'écran. */
  mode: "live" | "demo";
  citedCount: number;
  measuredCount: number;
  engines: EngineResult[];
  prompts: string[];
  /** Coût total de l'audit, null si aucun tarif n'est connu. */
  costUsd: number | null;
};

/**
 * Ce qu'a coûté une réponse.
 *
 * Les jetons sont toujours mesurés — les quatre SDK les renvoient. Le coût en
 * dollars n'est renseigné que quand le fournisseur le facture lui-même dans sa
 * réponse (Perplexity le fait) ; sinon il est calculé à partir du tarif
 * configuré, et vaut null tant qu'aucun tarif n'est renseigné. On ne devine
 * jamais un prix.
 */
export type Usage = {
  inputTokens: number;
  outputTokens: number;
  /** Recherches web facturées à l'unité par certains fournisseurs. */
  searches: number;
  /** Coût facturé par le fournisseur, quand il le communique. */
  billedUsd: number | null;
};

export type EngineAnswer = {
  text: string;
  sources: Source[];
  usage?: Usage;
};

export type EngineAdapter = {
  id: EngineId;
  label: string;
  configured: boolean;
  /** Absent tant que l'adaptateur n'est pas écrit. */
  ask?: (prompt: string, signal?: AbortSignal) => Promise<EngineAnswer>;
  /** Raison affichée quand `ask` est absent. */
  unavailableReason?: string;
};

/**
 * Ce qui remonte pendant l'audit, au fil de l'eau.
 *
 * Un audit prend une à deux minutes. Sans ces événements, l'écran ne peut
 * afficher qu'une barre qui avance toute seule — c'est-à-dire une invention.
 * Ici, chaque avancée affichée correspond à une réponse réellement obtenue.
 */
export type AuditProgress =
  | {
      type: "start";
      prompts: string[];
      engines: Array<{ engine: EngineId; label: string; willQuery: boolean }>;
    }
  | {
      type: "prompt";
      engine: EngineId;
      /** Index de la question, à partir de 0. */
      index: number;
      cited: boolean;
      /** Domaines cités sur cette question. C'est le cœur du spectacle :
       *  on voit les concurrents sortir pendant que la marque n'y est pas. */
      winners: string[];
    }
  | {
      type: "engine";
      engine: EngineId;
      status: EngineStatus;
      detail: string;
    };

export type ProgressListener = (event: AuditProgress) => void;
