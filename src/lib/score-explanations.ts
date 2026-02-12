import { formatPeriod, PERIOD_LABELS } from "./format";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CoproData = any;

function formatPrix(n: number): string {
  return n.toLocaleString("fr-FR") + " €";
}

function formatEvolution(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return sign + n.toFixed(1) + " %";
}

/**
 * Detailed 2-4 sentence explanation for the Technique dimension.
 */
export function detailedTechnique(copro: CoproData): string {
  const period = copro.periodeConstruction as string | null;
  if (!period || period === "NON_CONNUE" || period === "non renseigné") {
    return "La période de construction n'est pas renseignée pour cette copropriété, ce qui limite l'évaluation de l'état du bâti. Sans cette information, le score technique repose sur les autres indicateurs disponibles.";
  }

  const label = formatPeriod(period);
  const before1949 = period === "AVANT_1949";
  const before1974 = ["AVANT_1949", "DE_1949_A_1960", "DE_1961_A_1974"].includes(period);
  const after2001 = ["DE_2001_A_2010", "A_COMPTER_DE_2011"].includes(period);

  if (before1949) {
    return `Immeuble construit ${label}. Les bâtiments de cette époque présentent souvent des besoins de rénovation importants : toiture, façade, canalisations. La structure peut nécessiter des travaux de mise aux normes, notamment sur l'isolation et les parties communes.`;
  }
  if (before1974) {
    return `Immeuble construit ${label}, avant les premières réglementations thermiques. L'isolation est généralement insuffisante et les équipements collectifs peuvent être vieillissants. Des travaux de rénovation énergétique et de mise aux normes sont probablement à prévoir.`;
  }
  if (after2001) {
    return `Immeuble construit ${label}, conforme aux normes thermiques modernes (RT 2000/2005 ou RT 2012). Le bâti est récent avec une bonne isolation et des équipements aux normes. Les charges de maintenance sont généralement maîtrisées.`;
  }
  // 1975-2000
  return `Immeuble construit ${label}. Cette période bénéficie des premières réglementations thermiques, mais l'isolation reste souvent perfectible. Les équipements collectifs peuvent nécessiter un renouvellement après plusieurs décennies d'usage.`;
}

/**
 * Detailed 2-4 sentence explanation for the Risques dimension.
 */
export function detailedRisques(copro: CoproData): string {
  const parts: string[] = [];

  if (copro.coproDansPdp != null && copro.coproDansPdp > 0) {
    parts.push("Cette copropriété est inscrite dans un plan de prévention des risques (péril), ce qui indique des problèmes structurels ou de sécurité identifiés par les autorités.");
  }

  const dansAcv = copro.coproDansAcv === "oui";
  const dansPvd = copro.coproDansPvd === "oui";
  if (dansAcv && dansPvd) {
    parts.push("Elle est située dans un périmètre Action Cœur de Ville et Petites Villes de Demain, bénéficiant potentiellement d'aides à la rénovation.");
  } else if (dansAcv) {
    parts.push("Elle est située dans un périmètre Action Cœur de Ville, un dispositif de revitalisation urbaine.");
  } else if (dansPvd) {
    parts.push("Elle est située dans un périmètre Petites Villes de Demain, un programme de soutien aux villes moyennes.");
  }

  if (copro.nomQp2024) {
    parts.push(`Elle se trouve dans le quartier prioritaire « ${copro.nomQp2024} », ce qui peut impliquer des enjeux socio-économiques spécifiques mais aussi l'accès à des dispositifs d'aide.`);
  }

  if (copro.coproAidee === "oui") {
    parts.push("Cette copropriété bénéficie d'un accompagnement dans le cadre du dispositif copropriétés aidées.");
  }

  if (parts.length === 0) {
    return "Aucun risque particulier n'a été identifié pour cette copropriété. Elle ne fait l'objet d'aucune procédure de péril, n'est pas en quartier prioritaire, et ne relève d'aucun dispositif de vigilance. C'est un signal positif pour la stabilité de l'investissement.";
  }

  return parts.join(" ");
}

/**
 * Detailed 2-4 sentence explanation for the Gouvernance dimension.
 */
export function detailedGouvernance(copro: CoproData): string {
  const parts: string[] = [];

  if (copro.typeSyndic) {
    const type = copro.typeSyndic.toLowerCase();
    if (type === "professionnel") {
      parts.push("La copropriété est gérée par un syndic professionnel, ce qui assure généralement un suivi administratif et comptable rigoureux.");
    } else if (type === "bénévole") {
      parts.push("La copropriété est gérée par un syndic bénévole. Ce mode de gestion peut réduire les charges mais repose fortement sur l'implication des copropriétaires.");
    } else {
      parts.push(`Le syndic est de type « ${copro.typeSyndic} ».`);
    }
  } else {
    parts.push("Le type de syndic n'est pas renseigné, ce qui peut indiquer un défaut de mise à jour du registre.");
  }

  if (copro.syndicatCooperatif === "oui") {
    parts.push("Il s'agit d'un syndicat coopératif où les copropriétaires assurent directement la gestion, favorisant la transparence des décisions.");
  }

  if (copro.nbTotalLots != null) {
    if (copro.nbTotalLots <= 10) {
      parts.push(`Avec seulement ${copro.nbTotalLots} lots, la prise de décision en assemblée générale est facilitée par la petite taille de la copropriété.`);
    } else if (copro.nbTotalLots <= 50) {
      parts.push(`La copropriété compte ${copro.nbTotalLots} lots, une taille moyenne qui permet un bon équilibre entre mutualisation des charges et réactivité.`);
    } else {
      parts.push(`Avec ${copro.nbTotalLots} lots, il s'agit d'une grande copropriété où la gouvernance nécessite une organisation structurée et un conseil syndical actif.`);
    }
  }

  return parts.join(" ");
}

/**
 * Detailed 2-4 sentence explanation for the Énergie dimension.
 */
export function detailedEnergie(copro: CoproData): string {
  if (copro.dpeClasseMediane) {
    const classe = copro.dpeClasseMediane as string;
    const nbDpe = copro.dpeNbLogements ?? 0;
    const srcText = nbDpe > 1 ? `basée sur ${nbDpe} diagnostics à proximité` : "basée sur un diagnostic à proximité";

    if (["A", "B"].includes(classe)) {
      return `La classe DPE médiane est ${classe} (${srcText}), ce qui correspond à une performance énergétique excellente. Les charges de chauffage sont faibles et le bien est valorisé sur le marché. Aucun travaux de rénovation énergétique n'est à prévoir à court terme.`;
    }
    if (["C", "D"].includes(classe)) {
      return `La classe DPE médiane est ${classe} (${srcText}), indiquant une performance énergétique correcte. Des améliorations comme l'isolation des combles ou le remplacement des menuiseries pourraient encore optimiser la consommation.`;
    }
    // E, F, G
    return `La classe DPE médiane est ${classe} (${srcText}), ce qui classe le bâtiment comme énergivore. Des travaux de rénovation énergétique significatifs sont recommandés : isolation thermique, remplacement du système de chauffage, menuiseries. Les nouvelles réglementations pourraient impacter la location des logements les moins performants.`;
  }

  // Fallback: estimate from construction period
  const period = copro.periodeConstruction as string | null;
  if (period && PERIOD_LABELS[period]) {
    const label = formatPeriod(period);
    const after2001 = ["DE_2001_A_2010", "A_COMPTER_DE_2011"].includes(period);
    if (after2001) {
      return `Aucun DPE collectif n'est disponible pour cette copropriété. Cependant, l'immeuble a été construit ${label}, période conforme aux réglementations thermiques récentes, ce qui suggère une performance énergétique correcte.`;
    }
    return `Aucun DPE collectif n'est disponible pour cette copropriété. L'immeuble a été construit ${label} : la performance énergétique est estimée à partir de cette période, les bâtiments de cette époque présentant généralement une isolation limitée.`;
  }

  return "Aucun DPE collectif n'est disponible et la période de construction n'est pas renseignée. Le score énergie est estimé par défaut, ce qui limite la fiabilité de l'évaluation sur cette dimension.";
}

/**
 * Detailed 2-4 sentence explanation for the Marché dimension.
 */
export function detailedMarche(copro: CoproData): string {
  if (copro.marchePrixM2 == null) {
    return "Aucune transaction immobilière n'a été trouvée dans un rayon de 500 mètres sur les 3 dernières années. Sans données de marché, cette dimension ne peut pas être évaluée précisément.";
  }

  const prix = formatPrix(Math.round(copro.marchePrixM2));
  const parts: string[] = [`Le prix moyen au m² dans le secteur est de ${prix}, calculé à partir des transactions DVF dans un rayon de 500 mètres.`];

  if (copro.marcheEvolution != null) {
    const evo = copro.marcheEvolution;
    if (evo >= 3) {
      parts.push(`Le marché est en forte hausse avec une évolution de ${formatEvolution(evo)} par an, signe d'un secteur attractif et dynamique.`);
    } else if (evo >= 0) {
      parts.push(`L'évolution des prix est stable à légèrement positive (${formatEvolution(evo)}/an), indiquant un marché équilibré.`);
    } else if (evo >= -3) {
      parts.push(`Les prix sont en légère baisse (${formatEvolution(evo)}/an), ce qui peut constituer une opportunité d'achat dans un marché en correction.`);
    } else {
      parts.push(`Le marché connaît une baisse significative (${formatEvolution(evo)}/an), ce qui peut refléter un désintérêt pour le secteur ou une correction post-hausse.`);
    }
  }

  if (copro.marcheNbTransactions != null) {
    const nb = copro.marcheNbTransactions;
    if (nb >= 20) {
      parts.push(`Avec ${nb} transactions récentes, le volume de ventes est élevé, offrant une bonne fiabilité statistique.`);
    } else if (nb >= 5) {
      parts.push(`${nb} transactions ont été enregistrées, un volume suffisant pour une estimation fiable.`);
    } else {
      parts.push(`Seulement ${nb} transaction${nb > 1 ? "s" : ""} enregistrée${nb > 1 ? "s" : ""}, la fiabilité de l'estimation est limitée.`);
    }
  }

  return parts.join(" ");
}
