import type { ReactNode } from "react";

export interface GuideArticle {
  slug: string;
  title: string;
  description: string;
  date: string;
  toc: { id: string; label: string }[];
  content: ReactNode;
}

export const articles: GuideArticle[] = [
  {
    slug: "comment-lire-score-copropriete",
    title: "Comment lire et interpréter le score de santé d'une copropriété",
    description:
      "Comprenez les 5 dimensions du score CoproScore (technique, risques, gouvernance, énergie, marché) et apprenez à utiliser ce score pour un achat immobilier.",
    date: "2026-03-01",
    toc: [
      { id: "score-global", label: "Le score global /100" },
      { id: "5-dimensions", label: "Les 5 dimensions" },
      { id: "niveaux", label: "Bon, Moyen, Attention" },
      { id: "achat-immobilier", label: "Utiliser le score pour acheter" },
    ],
    content: (
      <>
        <h2 id="score-global">Le score global /100</h2>
        <p>
          Chaque copropriété reçoit un <strong>score de santé de 0 à 100</strong>, calculé à
          partir de données publiques officielles : le RNIC (Registre National des Copropriétés),
          les transactions DVF (Demandes de Valeurs Foncières) et les diagnostics énergétiques ADEME.
        </p>
        <p>
          Ce score agrège cinq dimensions, chacune pondérée selon son importance pour la santé
          globale du bâtiment. Le total brut est sur 120 points, puis normalisé sur 100.
        </p>

        <h2 id="5-dimensions">Les 5 dimensions d'analyse</h2>

        <h3>Technique (/25)</h3>
        <p>
          La dimension technique évalue l'état structurel du bâtiment : période de construction,
          nombre de lots, présence d'ascenseur, etc. Un immeuble récent ou rénové obtient un
          meilleur score technique qu'un bâtiment ancien sans travaux.
        </p>

        <h3>Risques (/30)</h3>
        <p>
          C'est la dimension la plus pondérée. Elle détecte les procédures en cours : plan de
          péril, administration provisoire, procédure de sauvegarde. Une copropriété sans
          procédure obtient le maximum. La moindre procédure fait chuter significativement le score.
        </p>

        <h3>Gouvernance (/25)</h3>
        <p>
          Cette dimension analyse la gestion de la copropriété : type de syndic (professionnel,
          bénévole ou coopératif), date du dernier mandat, régularité des assemblées générales.
          Un syndic professionnel avec un mandat récent est un signe de bonne gouvernance.
        </p>

        <h3>Énergie (/20)</h3>
        <p>
          Basée sur le DPE (Diagnostic de Performance Énergétique) médian de la copropriété.
          Les classes A et B obtiennent le maximum, tandis que les passoires thermiques (F et G)
          sont fortement pénalisées. Sans DPE, le score est estimé à partir de la période de
          construction.
        </p>

        <h3>Marché (/20)</h3>
        <p>
          Analyse le dynamisme immobilier autour de la copropriété : prix au m² moyen
          et évolution sur les dernières années. Un marché en hausse et un prix supérieur
          à la moyenne communale sont des indicateurs positifs.
        </p>

        <h2 id="niveaux">Bon, Moyen, Attention</h2>
        <p>Le score global est classé en trois niveaux :</p>
        <ul>
          <li>
            <strong>Bon (≥ 70/100)</strong> — La copropriété est globalement saine. Pas de
            procédure en cours, bonne gouvernance, performance énergétique correcte.
          </li>
          <li>
            <strong>Moyen (40-69/100)</strong> — Certains points méritent attention. Cela peut
            être un DPE médiocre, un syndic bénévole sur une grande copropriété, ou un marché
            en déclin.
          </li>
          <li>
            <strong>Attention (&lt; 40/100)</strong> — Des signaux d'alerte importants : procédure
            de péril, administration provisoire, ou cumul de faiblesses sur plusieurs dimensions.
          </li>
        </ul>

        <h2 id="achat-immobilier">Utiliser le score pour un achat immobilier</h2>
        <p>
          Avant d'acheter un appartement en copropriété, le score CoproScore vous permet
          de vérifier rapidement la santé du bâtiment. Voici comment l'utiliser :
        </p>
        <ol>
          <li>
            <strong>Vérifiez le score global</strong> — Un score inférieur à 40 est un signal
            d'alerte. Renseignez-vous sur les procédures en cours avant de signer.
          </li>
          <li>
            <strong>Analysez chaque dimension</strong> — Un score global correct peut masquer
            une faiblesse sur une dimension. Regardez le détail.
          </li>
          <li>
            <strong>Comparez avec le quartier</strong> — Le score du quartier (rayon 500m) vous
            indique si la copropriété est au-dessus ou en dessous de la moyenne locale.
          </li>
          <li>
            <strong>Suivez l'évolution du marché</strong> — Les données DVF montrent le prix
            au m² et son évolution. Un marché en baisse peut indiquer un quartier en difficulté.
          </li>
          <li>
            <strong>Téléchargez le rapport PDF</strong> — Pour une analyse complète avec
            historique, comparatif et estimations de travaux.
          </li>
        </ol>
      </>
    ),
  },
  {
    slug: "syndic-professionnel-benevole-differences",
    title: "Syndic professionnel vs bénévole : quelles différences ?",
    description:
      "Découvrez les différences entre syndic professionnel, bénévole et coopératif, leurs avantages et inconvénients, et leur impact sur le score CoproScore.",
    date: "2026-03-01",
    toc: [
      { id: "definitions", label: "Définitions" },
      { id: "avantages-inconvenients", label: "Avantages et inconvénients" },
      { id: "impact-score", label: "Impact sur le score CoproScore" },
      { id: "choisir", label: "Comment choisir ?" },
    ],
    content: (
      <>
        <h2 id="definitions">Définitions</h2>

        <h3>Syndic professionnel</h3>
        <p>
          Le syndic professionnel est une entreprise (cabinet de syndic) mandatée par
          l'assemblée générale pour gérer la copropriété. Il dispose d'une carte professionnelle,
          d'une assurance responsabilité civile et d'une garantie financière. C'est le mode
          de gestion le plus courant en France.
        </p>

        <h3>Syndic bénévole</h3>
        <p>
          Un copropriétaire élu par l'assemblée générale prend en charge la gestion de la
          copropriété sans rémunération (ou avec une indemnité modeste). Ce mode est fréquent
          dans les petites copropriétés (moins de 10 lots).
        </p>

        <h3>Syndic coopératif</h3>
        <p>
          La gestion est assurée collectivement par le conseil syndical. Le président du
          conseil syndical fait office de syndic. Ce mode favorise la transparence et la
          participation des copropriétaires.
        </p>

        <h2 id="avantages-inconvenients">Avantages et inconvénients</h2>

        <h3>Syndic professionnel</h3>
        <ul>
          <li><strong>Avantages :</strong> expertise juridique et comptable, disponibilité, réseau d'artisans, gestion des sinistres</li>
          <li><strong>Inconvénients :</strong> coût élevé (honoraires + frais annexes), parfois manque de réactivité, rotation des gestionnaires</li>
        </ul>

        <h3>Syndic bénévole</h3>
        <ul>
          <li><strong>Avantages :</strong> économies significatives (pas d'honoraires), proximité, connaissance fine de l'immeuble</li>
          <li><strong>Inconvénients :</strong> charge de travail importante, manque d'expertise juridique, risque si le bénévole quitte la copropriété</li>
        </ul>

        <h3>Syndic coopératif</h3>
        <ul>
          <li><strong>Avantages :</strong> transparence maximale, décisions collectives, coût réduit</li>
          <li><strong>Inconvénients :</strong> nécessite des copropriétaires impliqués, gestion plus lente, complexe pour les grandes copropriétés</li>
        </ul>

        <h2 id="impact-score">Impact sur le score CoproScore</h2>
        <p>
          La dimension <strong>Gouvernance (/25)</strong> du score CoproScore tient compte du type
          de syndic. Un syndic professionnel avec un mandat récent obtient le meilleur score, car
          il garantit une gestion encadrée et conforme.
        </p>
        <p>
          Un syndic bénévole n'est pas pénalisé en soi, mais l'absence de mandat récent ou
          la gestion d'une grande copropriété (50+ lots) par un bénévole fait baisser le score.
          Le syndic coopératif est évalué positivement s'il est accompagné d'un conseil syndical actif.
        </p>

        <h2 id="choisir">Comment choisir ?</h2>
        <p>
          Le choix dépend de la taille de la copropriété et de l'implication des copropriétaires :
        </p>
        <ul>
          <li><strong>Petite copropriété (&lt; 10 lots)</strong> — Le syndic bénévole ou coopératif peut être adapté si un copropriétaire est volontaire et compétent.</li>
          <li><strong>Copropriété moyenne (10-50 lots)</strong> — Le syndic professionnel est recommandé pour la complexité croissante de la gestion.</li>
          <li><strong>Grande copropriété (50+ lots)</strong> — Le syndic professionnel est quasi indispensable. Comparez les offres et vérifiez les avis.</li>
        </ul>
      </>
    ),
  },
  {
    slug: "dpe-copropriete-tout-comprendre",
    title: "DPE copropriété : tout comprendre sur le diagnostic énergétique",
    description:
      "Classes A à G, impact sur la valeur du bien, obligations légales et lien avec le score énergie CoproScore : tout savoir sur le DPE en copropriété.",
    date: "2026-03-01",
    toc: [
      { id: "classes", label: "Les classes de A à G" },
      { id: "impact-valeur", label: "Impact sur la valeur du bien" },
      { id: "obligations", label: "Obligations légales" },
      { id: "score-energie", label: "Lien avec le score énergie CoproScore" },
    ],
    content: (
      <>
        <h2 id="classes">Les classes de A à G</h2>
        <p>
          Le DPE (Diagnostic de Performance Énergétique) classe les logements selon leur
          consommation d'énergie et leurs émissions de gaz à effet de serre :
        </p>
        <ul>
          <li><strong>Classe A</strong> — Très performant : consommation &lt; 70 kWh/m²/an. Bâtiments neufs ou rénovés aux normes RE2020.</li>
          <li><strong>Classe B</strong> — Performant : 70-110 kWh/m²/an. Bâtiments récents bien isolés.</li>
          <li><strong>Classe C</strong> — Assez performant : 110-180 kWh/m²/an. Standard actuel des bâtiments bien entretenus.</li>
          <li><strong>Classe D</strong> — Moyen : 180-250 kWh/m²/an. Fréquent dans les immeubles des années 1970-2000.</li>
          <li><strong>Classe E</strong> — Peu performant : 250-330 kWh/m²/an. Travaux de rénovation recommandés.</li>
          <li><strong>Classe F</strong> — Passoire thermique : 330-420 kWh/m²/an. Interdiction progressive de mise en location.</li>
          <li><strong>Classe G</strong> — Passoire thermique : &gt; 420 kWh/m²/an. Interdiction de location depuis 2025.</li>
        </ul>

        <h2 id="impact-valeur">Impact sur la valeur du bien</h2>
        <p>
          Le DPE influence directement la valeur de revente d'un appartement. Selon les études
          du marché immobilier, la décote peut atteindre :
        </p>
        <ul>
          <li><strong>Classe F ou G :</strong> décote de 10 à 20% par rapport à un bien équivalent en classe C ou D</li>
          <li><strong>Classe A ou B :</strong> surcote de 5 à 15% (« valeur verte »)</li>
        </ul>
        <p>
          Au-delà de la valeur, un mauvais DPE signifie des charges de chauffage élevées et des
          travaux de rénovation à prévoir, ce qui alourdit les charges de copropriété.
        </p>

        <h2 id="obligations">Obligations légales</h2>
        <p>
          La loi Climat et Résilience impose un calendrier progressif pour les passoires thermiques :
        </p>
        <ul>
          <li><strong>2025 :</strong> interdiction de louer les logements classés G</li>
          <li><strong>2028 :</strong> interdiction de louer les logements classés F</li>
          <li><strong>2034 :</strong> interdiction de louer les logements classés E</li>
        </ul>
        <p>
          Pour les copropriétés, le DPE collectif est obligatoire pour les immeubles dont le
          permis de construire a été déposé avant le 1er janvier 2013 et qui comportent plus
          de 200 lots (depuis 2024), puis 50 lots (2025) et tous les immeubles (2026).
        </p>

        <h2 id="score-energie">Lien avec le score énergie CoproScore</h2>
        <p>
          La dimension <strong>Énergie (/20)</strong> du score CoproScore est directement basée sur
          le DPE médian de la copropriété, calculé à partir des données ADEME de 13,5 millions
          de diagnostics.
        </p>
        <ul>
          <li><strong>Classes A-B :</strong> score énergie maximal (18-20/20)</li>
          <li><strong>Classe C :</strong> bon score (14-17/20)</li>
          <li><strong>Classe D :</strong> score moyen (10-13/20)</li>
          <li><strong>Classes E-G :</strong> score faible (&lt; 10/20)</li>
          <li><strong>Sans DPE :</strong> estimation par période de construction</li>
        </ul>
      </>
    ),
  },
  {
    slug: "acheter-appartement-copropriete-risques",
    title: "Acheter en copropriété : les risques à vérifier avant de signer",
    description:
      "Plan de péril, procédures en cours, charges impayées : les risques à vérifier avant d'acheter un appartement en copropriété, et comment CoproScore vous aide.",
    date: "2026-03-01",
    toc: [
      { id: "plan-peril", label: "Le plan de péril" },
      { id: "procedures", label: "Procédures et administration provisoire" },
      { id: "charges-impayees", label: "Les charges impayées" },
      { id: "coproscore-aide", label: "Comment CoproScore vous aide" },
    ],
    content: (
      <>
        <h2 id="plan-peril">Le plan de péril</h2>
        <p>
          Un arrêté de péril est pris par le maire lorsqu'un immeuble présente un danger pour
          la sécurité de ses occupants ou des passants. Il existe deux niveaux :
        </p>
        <ul>
          <li>
            <strong>Péril ordinaire :</strong> le propriétaire est mis en demeure de réaliser
            des travaux dans un délai fixé. La vente reste possible mais l'acheteur doit être
            informé.
          </li>
          <li>
            <strong>Péril imminent :</strong> le danger est grave et immédiat. Le maire peut
            ordonner l'évacuation et la réalisation de travaux d'office. La situation est
            critique pour un achat.
          </li>
        </ul>
        <p>
          Sur CoproScore, les copropriétés en plan de péril sont identifiées dans la dimension
          <strong> Risques</strong>. Leur score tombe systématiquement sous 40/100.
        </p>

        <h2 id="procedures">Procédures et administration provisoire</h2>
        <p>
          Une copropriété peut faire l'objet de procédures judiciaires qui témoignent de
          difficultés graves :
        </p>
        <ul>
          <li>
            <strong>Administration provisoire :</strong> un administrateur judiciaire est nommé
            pour remplacer le syndic défaillant. Cela signifie une gestion dégradée et souvent
            des travaux urgents en attente.
          </li>
          <li>
            <strong>Procédure de sauvegarde :</strong> la copropriété est en difficulté financière.
            Un plan de redressement est mis en place pour apurer les dettes.
          </li>
          <li>
            <strong>Plan de sauvegarde :</strong> mesures coordonnées entre la commune,
            l'État et les copropriétaires pour redresser la situation.
          </li>
        </ul>

        <h2 id="charges-impayees">Les charges impayées</h2>
        <p>
          Les charges impayées sont le premier facteur de dégradation des copropriétés. Lorsque
          de nombreux copropriétaires ne paient pas leurs charges :
        </p>
        <ul>
          <li>Les travaux d'entretien sont reportés</li>
          <li>Les parties communes se dégradent</li>
          <li>Les copropriétaires solvables paient davantage</li>
          <li>La valeur des biens diminue, créant un cercle vicieux</li>
        </ul>
        <p>
          Avant d'acheter, demandez le procès-verbal de la dernière assemblée générale et
          l'état des impayés. Un taux d'impayés supérieur à 25% du budget est un signal d'alerte.
        </p>

        <h2 id="coproscore-aide">Comment CoproScore vous aide</h2>
        <p>
          CoproScore analyse automatiquement les données publiques du RNIC pour détecter les
          signaux d'alerte :
        </p>
        <ol>
          <li>
            <strong>Score Risques (/30)</strong> — Détecte les procédures de péril, d'administration
            provisoire et de sauvegarde. Un score de 0 sur cette dimension est un signal fort.
          </li>
          <li>
            <strong>Score Gouvernance (/25)</strong> — Évalue la qualité de la gestion. Un syndic
            en place depuis longtemps sans renouvellement de mandat peut être un signe de blocage.
          </li>
          <li>
            <strong>Score global</strong> — En croisant les 5 dimensions, CoproScore donne une
            vision synthétique de la santé de la copropriété. Un score sous 40 mérite une
            investigation approfondie.
          </li>
          <li>
            <strong>Rapport PDF</strong> — Téléchargez le rapport complet avec l'historique,
            les transactions DVF, le comparatif quartier et les estimations de travaux.
          </li>
        </ol>
      </>
    ),
  },
];

export function getArticleBySlug(slug: string): GuideArticle | undefined {
  return articles.find((a) => a.slug === slug);
}
