export type Question = {
  id: string;
  label: string;
  /** Réponses de la moins avancée à la plus avancée : l'indice fait le score. */
  options: string[];
};

export const QUESTIONS: Question[] = [
  {
    id: "usage",
    label: "Combien de personnes se servent de l’IA chaque semaine chez toi ?",
    options: [
      "Personne, ou je ne sais pas",
      "Une ou deux, chacune dans son coin",
      "Une bonne partie de l’équipe",
      "La plupart, c’est devenu un réflexe",
    ],
  },
  {
    id: "doc",
    label: "Ces usages sont-ils écrits quelque part ?",
    options: [
      "Non, rien n’est écrit",
      "Des astuces qui circulent à l’oral",
      "Des modes d’emploi partagés",
      "Une doc interne tenue à jour",
    ],
  },
  {
    id: "automation",
    label: "Une tâche récurrente est-elle automatisée avec l’IA ?",
    options: [
      "Aucune",
      "On a essayé, ça n’a pas tenu",
      "Une ou deux, qui tournent vraiment",
      "Plusieurs, branchées sur nos outils",
    ],
  },
  {
    id: "training",
    label: "Qui a formé les équipes ?",
    options: [
      "Personne",
      "Chacun s’est débrouillé",
      "Un référent interne",
      "Une formation structurée, avec un suivi",
    ],
  },
  {
    id: "data",
    label: "Existe-t-il une règle sur les données qu’on peut confier à une IA ?",
    options: [
      "Aucune",
      "Un principe dit à l’oral",
      "Une note écrite",
      "Une charte signée et des outils validés",
    ],
  },
  {
    id: "measure",
    label: "Mesurez-vous le temps ou l’argent gagné ?",
    options: [
      "Non",
      "Au ressenti",
      "Sur quelques tâches précises",
      "Oui, avec des chiffres suivis",
    ],
  },
  {
    id: "integration",
    label: "L’IA est-elle branchée à tes outils métier — CRM, devis, ERP ?",
    options: [
      "Pas du tout",
      "Copier-coller à la main",
      "Une intégration ou deux",
      "Intégrée aux flux principaux",
    ],
  },
  {
    id: "visibility",
    label: "Quand un client cherche ton métier sur ChatGPT, tu sors ?",
    options: [
      "Aucune idée, jamais vérifié",
      "Non, on a vérifié",
      "Parfois, sur certaines questions",
      "Oui, régulièrement",
    ],
  },
];

export const MAX_SCORE = QUESTIONS.length * 3;

export type Level = {
  name: string;
  from: number;
  to: number;
  verdict: string;
  steps: string[];
};

export const LEVELS: Level[] = [
  {
    name: "Spectateur",
    from: 0,
    to: 6,
    verdict:
      "L’IA n’est pas encore entrée dans ta boîte. Ce n’est pas un retard grave — c’est le cas de la majorité des PME. Le risque, c’est d’y arriver par la porte du gadget plutôt que par celle du gain de temps.",
    steps: [
      "Identifier les trois tâches qui mangent le plus d’heures",
      "Tester un seul outil, sur une seule de ces tâches",
      "Poser une règle simple sur les données avant d’élargir",
    ],
  },
  {
    name: "Curieux",
    from: 7,
    to: 12,
    verdict:
      "Des usages existent, mais ils tiennent à deux ou trois personnes motivées. Le jour où elles partent, tout s’arrête. Ce qui manque, ce n’est pas l’outil : c’est ce qui le rend reproductible.",
    steps: [
      "Écrire ce que font déjà les personnes en avance",
      "Choisir un référent interne et lui donner du temps",
      "Cadrer les données autorisées, noir sur blanc",
    ],
  },
  {
    name: "Praticien",
    from: 13,
    to: 18,
    verdict:
      "L’IA est installée dans le quotidien de l’équipe. Le prochain palier ne se joue plus sur les usages individuels mais sur les flux : brancher l’IA aux outils métier, et commencer à mesurer.",
    steps: [
      "Brancher l’IA au CRM et aux devis",
      "Chiffrer le temps gagné sur deux processus",
      "Vérifier ta visibilité sur les moteurs de réponse",
    ],
  },
  {
    name: "Pilote",
    from: 19,
    to: 24,
    verdict:
      "Tu es en avance sur ton secteur. L’enjeu n’est plus d’adopter mais de tenir l’avance : garder les automatismes fiables, former les nouveaux arrivants, et occuper le terrain là où tes clients cherchent — les IA.",
    steps: [
      "Fiabiliser et documenter les automatismes existants",
      "Intégrer l’IA au parcours d’arrivée des nouveaux",
      "Passer à l’offensive sur ta citation par les IA",
    ],
  },
];

export function levelFor(score: number): Level {
  return LEVELS.find((l) => score >= l.from && score <= l.to) ?? LEVELS[0];
}
