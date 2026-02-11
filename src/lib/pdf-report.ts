import PDFDocument from "pdfkit";
import type { AnalyseResult } from "./generate-analyse";
import { formatPeriod } from "./format";
import type { EstimationTravaux } from "./budget-travaux";
import type { TimelineEvent } from "./timeline";

// ─── Constants ───────────────────────────────────────────────────────────────

const TEAL = "#0d9488";
const TEAL_50 = "#f0fdfa";
const TEAL_100 = "#ccfbf1";
const TEXT = "#1e293b";
const TEXT_SEC = "#64748b";
const TEXT_MUTED = "#94a3b8";
const BG_ALT = "#f8fafc";
const BG_CARD = "#f1f5f9";
const BORDER = "#e2e8f0";
const GREEN = "#059669";
const AMBER = "#d97706";
const RED = "#dc2626";
const BLUE = "#2563eb";
const WHITE = "#ffffff";

const PW = 595.28;
const PH = 841.89;
const M = 50;
const CW = PW - 2 * M;
const CT = 56;
const CB = PH - 50;

const DIM_COLORS: Record<string, string> = {
  Technique: "#0ea5e9",
  Risques: "#8b5cf6",
  Gouvernance: "#6366f1",
  "\u00c9nergie": "#f59e0b",
  "March\u00e9": TEAL,
};

const EVENT_COLORS: Record<string, string> = {
  construction: "#6366f1",
  administratif: "#64748b",
  energie: "#f59e0b",
  transaction: TEAL,
  risque: "#dc2626",
  gouvernance: "#8b5cf6",
};

const EVENT_LABELS: Record<string, string> = {
  construction: "Construction",
  administratif: "Administratif",
  energie: "\u00c9nergie",
  transaction: "Transaction",
  risque: "Risque",
  gouvernance: "Gouvernance",
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ReportInput {
  displayName: string;
  address: string;
  codePostal: string;
  commune: string;
  slug: string;

  scoreGlobal: number;
  scoreTechnique: number | null;
  scoreRisques: number | null;
  scoreGouvernance: number | null;
  scoreEnergie: number | null;
  scoreMarche: number | null;
  indiceConfiance: number | null;

  nbTotalLots: number | null;
  nbLotsHabitation: number | null;
  typeSyndic: string | null;
  periodeConstruction: string | null;
  syndicatCooperatif: string | null;
  dpeClasseMediane: string | null;

  dimensions: {
    label: string;
    score: number | null;
    max: number;
    detailedExplanation: string;
  }[];

  analyse: AnalyseResult | null;
  analyseDate: string | null;

  marchePrixM2: number | null;
  marcheEvolution: number | null;
  marcheNbTransactions: number | null;
  communeAvgPrix: number | null;
  communeLabel: string;

  transactions: {
    date: string;
    adresse: string;
    surface: number;
    prix: number;
    prixM2: number;
  }[];

  nearby: {
    name: string;
    commune: string | null;
    score: number | null;
    nbLots: number | null;
    distance: number;
  }[];

  estimation: EstimationTravaux | null;

  timeline: TimelineEvent[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = any;

/** Replace U+202F (narrow no-break space) that fr-FR locale inserts */
function sanitize(s: string): string {
  return s.replace(/\u202F/g, " ");
}

function sc(score: number): string {
  if (score >= 70) return GREEN;
  if (score >= 40) return AMBER;
  return RED;
}

function sl(score: number): string {
  if (score >= 70) return "Bon";
  if (score >= 40) return "Moyen";
  return "Attention requise";
}

function fmtPrix(n: number): string {
  return sanitize(Math.round(n).toLocaleString("fr-FR")) + " \u20ac";
}

function fmtNum(n: number): string {
  return sanitize(Math.round(n).toLocaleString("fr-FR"));
}

function fmtEvo(n: number): string {
  return (n >= 0 ? "+" : "") + n.toFixed(1) + " %";
}

function fmtDate(): string {
  return sanitize(
    new Date().toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  );
}

// ─── Drawing primitives ──────────────────────────────────────────────────────

/** Draw a smooth arc stroke via line segments */
function drawArcStroke(
  doc: Doc,
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
  lineWidth: number,
  color: string
) {
  const steps = Math.max(60, Math.ceil(Math.abs(endDeg - startDeg) / 2));
  doc.save();
  doc.lineWidth(lineWidth).strokeColor(color).lineCap("round");
  for (let i = 0; i <= steps; i++) {
    const deg = startDeg + ((endDeg - startDeg) * i) / steps;
    const rad = (deg * Math.PI) / 180;
    const x = cx + r * Math.cos(rad);
    const y = cy + r * Math.sin(rad);
    if (i === 0) doc.moveTo(x, y);
    else doc.lineTo(x, y);
  }
  doc.stroke();
  doc.restore();
}

/** Draw a score gauge (240\u00b0 arc opening at bottom) */
function drawScoreGauge(
  doc: Doc,
  cx: number,
  cy: number,
  r: number,
  score: number
) {
  const START = 150;
  const SWEEP = 240;
  const END = START + SWEEP;
  const LW = 14;

  // Background arc
  drawArcStroke(doc, cx, cy, r, START, END, LW, BORDER);

  // Score arc
  if (score > 0) {
    const fillEnd = START + (SWEEP * Math.min(score, 100)) / 100;
    drawArcStroke(doc, cx, cy, r, START, fillEnd, LW, sc(score));
  }

  // Score number
  doc.font("Helvetica-Bold").fontSize(38).fillColor(TEXT);
  const sStr = score.toString();
  const tw = doc.widthOfString(sStr);
  doc.text(sStr, cx - tw / 2, cy - 20, { lineBreak: false });

  // /100
  doc.font("Helvetica").fontSize(13).fillColor(TEXT_SEC);
  const sub = "/ 100";
  const sw = doc.widthOfString(sub);
  doc.text(sub, cx - sw / 2, cy + 16, { lineBreak: false });
}

/** Draw a horizontal progress bar with rounded ends */
function drawProgressBar(
  doc: Doc,
  x: number,
  y: number,
  w: number,
  h: number,
  pct: number,
  bgColor: string,
  fgColor: string
) {
  doc.save();
  doc.roundedRect(x, y, w, h, h / 2).fill(bgColor);
  if (pct > 0) {
    const fillW = Math.max(pct * w, h);
    doc.roundedRect(x, y, fillW, h, h / 2).fill(fgColor);
  }
  doc.restore();
}

/** Draw a stat card with big value + small label */
function drawStatCard(
  doc: Doc,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  accentColor?: string
) {
  doc.save();
  doc.lineWidth(0.5);
  doc.roundedRect(x, y, w, h, 4).fillAndStroke(BG_CARD, BORDER);

  // Accent bar at top (clip to preserve rounded corners)
  if (accentColor) {
    doc.save();
    doc.rect(x, y, w, 4).clip();
    doc.roundedRect(x, y, w, h, 4).fill(accentColor);
    doc.restore();
  }

  const contentTop = accentColor ? y + 6 : y;
  const contentH = h - (accentColor ? 6 : 0);
  const midY = contentTop + contentH / 2;

  doc.font("Helvetica-Bold").fontSize(h > 48 ? 14 : 11).fillColor(TEXT);
  doc.text(value, x + 4, midY - 14, {
    width: w - 8,
    align: "center",
    lineBreak: false,
  });

  doc.font("Helvetica").fontSize(7.5).fillColor(TEXT_MUTED);
  doc.text(label, x + 4, midY + 4, {
    width: w - 8,
    align: "center",
    lineBreak: false,
  });

  doc.restore();
}

/** Draw a colored score badge pill */
function drawScoreBadge(
  doc: Doc,
  x: number,
  y: number,
  score: number
) {
  const color = sc(score);
  doc.save();
  doc.roundedRect(x, y, 34, 18, 9).fill(color);
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(WHITE);
  doc.text(score.toString(), x, y + 4, {
    width: 34,
    align: "center",
    lineBreak: false,
  });
  doc.restore();
}

// ─── Table with teal header ──────────────────────────────────────────────────

interface Column {
  label: string;
  width: number;
  align?: "left" | "right" | "center";
}

function drawTable(
  doc: Doc,
  columns: Column[],
  rows: string[][],
  startY: number
): number {
  const ROW_H = 18;
  const HDR_H = 24;
  const FS = 7.5;
  const PAD = 6;
  let y = startY;

  function header(atY: number): number {
    doc.save();
    doc.rect(M, atY, CW, HDR_H).fill(TEAL);
    doc.font("Helvetica-Bold").fontSize(FS).fillColor(WHITE);
    let x = M;
    for (const col of columns) {
      doc.text(col.label, x + PAD, atY + 7, {
        width: col.width - 2 * PAD,
        align: col.align || "left",
        lineBreak: false,
      });
      x += col.width;
    }
    doc.restore();
    return atY + HDR_H;
  }

  y = header(y);

  for (let i = 0; i < rows.length; i++) {
    if (y + ROW_H > CB) {
      doc.addPage();
      y = header(CT);
    }

    if (i % 2 === 0) {
      doc.save();
      doc.rect(M, y, CW, ROW_H).fill(BG_ALT);
      doc.restore();
    }

    doc.font("Helvetica").fontSize(FS).fillColor(TEXT);
    let x = M;
    for (let j = 0; j < columns.length; j++) {
      doc.text(rows[i][j] || "\u2014", x + PAD, y + 5, {
        width: columns[j].width - 2 * PAD,
        align: columns[j].align || "left",
        lineBreak: false,
      });
      x += columns[j].width;
    }

    y += ROW_H;
  }

  return y;
}

// ─── Section title ───────────────────────────────────────────────────────────

function sectionTitle(doc: Doc, text: string, y: number): number {
  doc.font("Helvetica-Bold").fontSize(16).fillColor(TEAL);
  doc.text(text, M, y, { width: CW });
  const bottom = y + 22;
  doc.save();
  doc
    .moveTo(M, bottom)
    .lineTo(M + 50, bottom)
    .lineWidth(2.5)
    .strokeColor(TEAL)
    .lineCap("round")
    .stroke();
  doc.restore();
  return bottom + 14;
}

// ─── Page chrome (final pass) ────────────────────────────────────────────────

function addPageHeader(doc: Doc, pageNum: number, totalPages: number) {
  doc.save();
  // Teal accent bar
  doc.rect(0, 0, PW, 3).fill(TEAL);
  // Logo
  doc.font("Helvetica-Bold").fontSize(9).fillColor(TEAL);
  doc.text("CoproScore", M, 14, { lineBreak: false });
  // Page number
  doc.font("Helvetica").fontSize(8).fillColor(TEXT_MUTED);
  doc.text(`Page ${pageNum} / ${totalPages}`, PW - M - 60, 14, {
    width: 60,
    align: "right",
    lineBreak: false,
  });
  // Separator
  doc
    .moveTo(M, 32)
    .lineTo(PW - M, 32)
    .lineWidth(0.5)
    .strokeColor(BORDER)
    .stroke();
  doc.restore();
}

function addPageFooter(doc: Doc) {
  doc.save();
  doc
    .moveTo(M, PH - 40)
    .lineTo(PW - M, PH - 40)
    .lineWidth(0.5)
    .strokeColor(BORDER)
    .stroke();
  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor(TEXT_MUTED)
    .text("coproscore.fr", 0, PH - 30, {
      width: PW,
      align: "center",
      lineBreak: false,
    });
  doc.restore();
}

// ─── Page 1: Cover ───────────────────────────────────────────────────────────

function renderCover(doc: Doc, data: ReportInput) {
  const cx = PW / 2;

  // ── Teal banner ──
  doc.rect(0, 0, PW, 180).fill(TEAL);

  doc.font("Helvetica-Bold").fontSize(34).fillColor(WHITE);
  doc.text("CoproScore", 0, 55, { width: PW, align: "center" });

  doc.font("Helvetica").fontSize(14).fillColor(TEAL_100);
  doc.text("Rapport d'analyse complet", 0, 100, {
    width: PW,
    align: "center",
  });

  // ── Score gauge ──
  const gaugeY = 295;
  drawScoreGauge(doc, cx, gaugeY, 62, data.scoreGlobal);

  // Score label
  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor(sc(data.scoreGlobal))
    .text(sl(data.scoreGlobal), 0, gaugeY + 58, {
      width: PW,
      align: "center",
    });

  // Confidence
  if (data.indiceConfiance != null) {
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(TEXT_MUTED)
      .text(
        `Indice de confiance : ${Math.round(data.indiceConfiance)} %`,
        0,
        gaugeY + 80,
        { width: PW, align: "center" }
      );
  }

  // ── Copro info card ──
  const cardY = gaugeY + 108;
  doc.font("Helvetica-Bold").fontSize(13);
  const nameH = doc.heightOfString(data.displayName, { width: CW - 32 });
  const cityLine = [data.codePostal, data.commune].filter(Boolean).join(" ");
  const cardH = nameH + (cityLine ? 30 : 18);

  doc.save();
  doc.lineWidth(0.5);
  doc.roundedRect(M, cardY, CW, cardH, 6).fillAndStroke(WHITE, BORDER);

  doc.font("Helvetica-Bold").fontSize(13).fillColor(TEXT);
  doc.text(data.displayName, M + 16, cardY + 10, {
    width: CW - 32,
    align: "center",
  });
  if (cityLine) {
    doc.font("Helvetica").fontSize(10).fillColor(TEXT_SEC);
    doc.text(cityLine, M + 16, cardY + 10 + nameH + 4, {
      width: CW - 32,
      align: "center",
    });
  }
  doc.restore();

  // ── Stat cards ──
  const cardsY = cardY + cardH + 22;
  const gap = 10;
  const cardW = (CW - 3 * gap) / 4;

  const stats: { label: string; value: string }[] = [
    {
      label: "Lots",
      value: data.nbTotalLots != null ? fmtNum(data.nbTotalLots) : "\u2014",
    },
    {
      label: "Syndic",
      value: data.typeSyndic
        ? data.typeSyndic.charAt(0).toUpperCase() +
          data.typeSyndic.slice(1).toLowerCase()
        : "\u2014",
    },
    {
      label: "Construction",
      value: formatPeriod(data.periodeConstruction) || "\u2014",
    },
    {
      label: "DPE",
      value: data.dpeClasseMediane || "\u2014",
    },
  ];

  for (let i = 0; i < stats.length; i++) {
    const sx = M + i * (cardW + gap);
    drawStatCard(doc, sx, cardsY, cardW, 42, stats[i].label, stats[i].value);
  }

  // ── Contents ──
  const contentsY = cardsY + 70;
  doc.save();
  doc
    .moveTo(M + 100, contentsY)
    .lineTo(PW - M - 100, contentsY)
    .strokeColor(BORDER)
    .lineWidth(0.5)
    .stroke();
  doc.restore();

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(TEXT)
    .text("Contenu du rapport", 0, contentsY + 12, {
      width: PW,
      align: "center",
    });

  const contents: string[] = ["Score global et analyse d\u00e9taill\u00e9e"];
  if (data.analyse) contents.push("Analyse IA personnalis\u00e9e");
  if (data.estimation && data.estimation.postes.length > 0)
    contents.push("Estimation des travaux potentiels");
  if (data.timeline.length > 0)
    contents.push("Chronologie de la copropri\u00e9t\u00e9");
  if (data.marchePrixM2 != null || data.transactions.length > 0)
    contents.push("Donn\u00e9es du march\u00e9 immobilier");
  if (data.nearby.length > 0)
    contents.push("Copropri\u00e9t\u00e9s \u00e0 proximit\u00e9");

  doc.font("Helvetica").fontSize(8.5).fillColor(TEXT_SEC);
  let cy = contentsY + 30;
  for (const item of contents) {
    doc.text(`\u2022  ${item}`, 0, cy, { width: PW, align: "center" });
    cy += 14;
  }

  // ── Footer ──
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(TEXT_MUTED)
    .text(`Rapport g\u00e9n\u00e9r\u00e9 le ${fmtDate()}`, 0, 710, {
      width: PW,
      align: "center",
    });

  doc
    .fontSize(8)
    .fillColor(TEXT_MUTED)
    .text(
      "coproscore.fr \u2014 Donn\u00e9es issues du RNIC, DVF, DPE ADEME",
      0,
      735,
      { width: PW, align: "center" }
    );
}

// ─── Page 2: Score d\u00e9taill\u00e9 ──────────────────────────────────────────────────

function renderScoreDetail(doc: Doc, data: ReportInput) {
  let y = sectionTitle(doc, "Score d\u00e9taill\u00e9", CT);

  for (const dim of data.dimensions) {
    if (y + 80 > CB) {
      doc.addPage();
      y = CT;
    }

    const pct = dim.score != null ? dim.score / dim.max : 0;
    const pct100 = Math.round(pct * 100);
    const dimColor = DIM_COLORS[dim.label] || TEAL;

    // Label + score on same line
    doc.font("Helvetica-Bold").fontSize(11).fillColor(TEXT);
    doc.text(dim.label, M, y, { lineBreak: false });

    const scoreText =
      dim.score != null ? `${dim.score} / ${dim.max}` : "\u2014";
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(dim.score != null ? sc(pct100) : TEXT_MUTED);
    doc.text(scoreText, M, y, { width: CW, align: "right" });
    y += 18;

    // Progress bar
    drawProgressBar(doc, M, y, CW, 7, pct, BG_CARD, dimColor);
    y += 14;

    // Explanation
    doc.font("Helvetica").fontSize(8.5).fillColor(TEXT_SEC);
    const textH = doc.heightOfString(dim.detailedExplanation, { width: CW });
    doc.text(dim.detailedExplanation, M, y, { width: CW });
    y += textH + 18;
  }
}

// ─── Page 3: Analyse IA ─────────────────────────────────────────────────────

function renderAnalyse(doc: Doc, data: ReportInput) {
  if (!data.analyse) return;

  let y = sectionTitle(doc, "Analyse CoproScore", CT);

  doc.font("Helvetica").fontSize(8).fillColor(TEXT_MUTED);
  doc.text(
    "G\u00e9n\u00e9r\u00e9e par intelligence artificielle \u00e0 partir des donn\u00e9es publiques",
    M,
    y,
    { width: CW }
  );
  y += 16;

  // Resume box
  doc.save();
  const resumeText = sanitize(data.analyse.resume);
  doc.font("Helvetica").fontSize(9);
  const resumeH = doc.heightOfString(resumeText, { width: CW - 28 });
  const boxH = resumeH + 22;

  doc.roundedRect(M, y, CW, boxH, 5).fill(TEAL_50);
  doc
    .roundedRect(M, y, CW, boxH, 5)
    .lineWidth(0.5)
    .strokeColor(TEAL)
    .stroke();

  doc.font("Helvetica").fontSize(9).fillColor(TEXT);
  doc.text(resumeText, M + 14, y + 11, { width: CW - 28 });
  doc.restore();
  y += boxH + 22;

  // Points forts
  y = renderAnalyseSection(
    doc,
    y,
    "Points forts",
    data.analyse.points_forts,
    GREEN
  );

  // Vigilances
  y = renderAnalyseSection(
    doc,
    y,
    "Points de vigilance",
    data.analyse.vigilances,
    AMBER
  );

  // Recommandations
  y = renderAnalyseSection(
    doc,
    y,
    "Recommandations",
    data.analyse.recommandations,
    BLUE
  );

  // Date
  if (data.analyseDate) {
    if (y + 20 > CB) {
      doc.addPage();
      y = CT;
    }
    doc.font("Helvetica").fontSize(7).fillColor(TEXT_MUTED);
    doc.text(
      `Analyse g\u00e9n\u00e9r\u00e9e le ${sanitize(data.analyseDate)}`,
      M,
      y + 8,
      { width: CW }
    );
  }
}

function renderAnalyseSection(
  doc: Doc,
  y: number,
  title: string,
  items: string[],
  color: string
): number {
  if (y + 30 > CB) {
    doc.addPage();
    y = CT;
  }

  doc.font("Helvetica-Bold").fontSize(10).fillColor(TEXT);
  doc.text(title, M, y, { width: CW });
  y += 16;

  for (const item of items) {
    const text = sanitize(item);
    const itemH = doc.heightOfString(text, { width: CW - 22 });
    if (y + itemH + 8 > CB) {
      doc.addPage();
      y = CT;
    }

    // Colored bullet
    doc.circle(M + 4, y + 5, 3).fill(color);
    // Text
    doc.font("Helvetica").fontSize(8.5).fillColor(TEXT_SEC);
    doc.text(text, M + 14, y, { width: CW - 22 });
    y += itemH + 6;
  }

  return y + 12;
}

// ─── Page: Estimation des travaux ────────────────────────────────────────────

function renderEstimation(doc: Doc, data: ReportInput) {
  if (!data.estimation || data.estimation.postes.length === 0) return;

  let y = sectionTitle(doc, "Estimation des travaux potentiels", CT);

  doc.font("Helvetica").fontSize(8).fillColor(TEXT_MUTED);
  doc.text(
    "Fourchettes bas\u00e9es sur les moyennes nationales ANAH/ADEME. Ne remplace pas un devis professionnel.",
    M,
    y,
    { width: CW }
  );
  y += 18;

  const est = data.estimation;

  // Table
  const cols: Column[] = [
    { label: "Poste de travaux", width: 185 },
    { label: "Description", width: 160 },
    { label: "Min", width: 75, align: "right" },
    { label: "Max", width: CW - 185 - 160 - 75, align: "right" },
  ];

  const rows = est.postes.map((p) => [
    p.nom,
    sanitize(p.description),
    fmtPrix(p.min),
    fmtPrix(p.max),
  ]);

  y = drawTable(doc, cols, rows, y);
  y += 14;

  // Total box
  if (y + 55 > CB) {
    doc.addPage();
    y = CT;
  }

  doc.save();
  doc.lineWidth(1);
  doc.roundedRect(M, y, CW, 48, 5).fillAndStroke(TEAL_50, TEAL);

  doc.font("Helvetica-Bold").fontSize(10).fillColor(TEXT);
  doc.text("Total estim\u00e9", M + 14, y + 10, { lineBreak: false });

  doc.font("Helvetica-Bold").fontSize(13).fillColor(TEAL);
  doc.text(`${fmtPrix(est.totalMin)} \u2014 ${fmtPrix(est.totalMax)}`, M + 14, y + 10, {
    width: CW - 28,
    align: "right",
  });

  // Per lot
  if (data.nbLotsHabitation && data.nbLotsHabitation > 1) {
    const perMin = Math.round(est.totalMin / data.nbLotsHabitation);
    const perMax = Math.round(est.totalMax / data.nbLotsHabitation);
    doc.font("Helvetica").fontSize(8).fillColor(TEXT_SEC);
    doc.text(
      `soit ${fmtPrix(perMin)} \u2014 ${fmtPrix(perMax)} par lot`,
      M + 14,
      y + 30,
      { width: CW - 28, align: "right" }
    );
  }

  // Fiabilit\u00e9
  const fiabLabel =
    est.fiabilite === "haute"
      ? "Fiabilit\u00e9 haute (DPE + p\u00e9riode)"
      : est.fiabilite === "moyenne"
        ? "Fiabilit\u00e9 moyenne (p\u00e9riode seule)"
        : "Donn\u00e9es insuffisantes";
  const fiabColor =
    est.fiabilite === "haute"
      ? GREEN
      : est.fiabilite === "moyenne"
        ? AMBER
        : RED;
  doc.font("Helvetica").fontSize(8).fillColor(fiabColor);
  doc.text(fiabLabel, M + 14, y + 30, { lineBreak: false });

  doc.restore();
  y += 62;

  // Disclaimer
  if (y + 16 > CB) {
    doc.addPage();
    y = CT;
  }
  doc.font("Helvetica").fontSize(7).fillColor(TEXT_MUTED);
  doc.text(
    "Ces estimations sont indicatives et bas\u00e9es sur des moyennes nationales. Elles ne remplacent pas un devis professionnel.",
    M,
    y,
    { width: CW }
  );
}

// ─── Page: Chronologie ───────────────────────────────────────────────────────

function renderTimeline(doc: Doc, data: ReportInput) {
  let y = sectionTitle(doc, "Chronologie", CT);

  const events = data.timeline;
  if (events.length === 0) return;

  const dateW = 82;
  const dotX = M + dateW + 14;
  const textX = dotX + 16;
  const textW = M + CW - textX;
  const dotR = 5;

  let prevDotY: number | null = null;

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const title = sanitize(ev.titre);
    const desc = sanitize(ev.description);

    // Calculate height
    doc.font("Helvetica-Bold").fontSize(9);
    const titleH = doc.heightOfString(title, { width: textW });
    doc.font("Helvetica").fontSize(8);
    const descH = doc.heightOfString(desc, { width: textW });
    const rowH = Math.max(28, titleH + descH + 8);

    // Page break
    if (y + rowH > CB) {
      doc.addPage();
      y = CT;
      prevDotY = null;
    }

    const eventDotY = y + 7;

    // Vertical connector line from previous dot
    if (prevDotY != null) {
      doc.save();
      doc
        .moveTo(dotX, prevDotY)
        .lineTo(dotX, eventDotY)
        .lineWidth(2)
        .strokeColor(BORDER)
        .stroke();
      doc.restore();
    }

    // Colored dot
    const evColor = EVENT_COLORS[ev.type] || TEXT_SEC;
    doc.circle(dotX, eventDotY, dotR).fill(evColor);

    // Date (left of dot)
    const d = new Date(ev.date);
    const dateStr =
      d.getFullYear() < 1990
        ? `~ ${d.getFullYear()}`
        : sanitize(
            d.toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          );

    doc.font("Helvetica").fontSize(8).fillColor(TEXT_MUTED);
    doc.text(dateStr, M, y + 2, {
      width: dateW,
      align: "right",
      lineBreak: false,
    });

    // Type badge
    const typeLabel = EVENT_LABELS[ev.type] ?? ev.type;
    doc.font("Helvetica").fontSize(6.5).fillColor(evColor);
    doc.text(typeLabel, M, y + 14, {
      width: dateW,
      align: "right",
      lineBreak: false,
    });

    // Title
    doc.font("Helvetica-Bold").fontSize(9).fillColor(TEXT);
    doc.text(title, textX, y, { width: textW });

    // Description
    doc.font("Helvetica").fontSize(8).fillColor(TEXT_SEC);
    doc.text(desc, textX, y + titleH + 2, { width: textW });

    prevDotY = eventDotY;
    y += rowH + 10;
  }
}

// ─── Page: March\u00e9 immobilier ────────────────────────────────────────────────

function renderMarket(doc: Doc, data: ReportInput) {
  let y = sectionTitle(doc, "March\u00e9 immobilier", CT);

  // Stat cards
  if (data.marchePrixM2 != null) {
    const gap = 12;
    const cardW = (CW - 2 * gap) / 3;
    const cardH = 55;

    drawStatCard(
      doc,
      M,
      y,
      cardW,
      cardH,
      "Prix moyen / m\u00b2",
      `${fmtPrix(data.marchePrixM2)}`,
      TEAL
    );

    if (data.marcheEvolution != null) {
      const evoColor = data.marcheEvolution >= 0 ? GREEN : RED;
      drawStatCard(
        doc,
        M + cardW + gap,
        y,
        cardW,
        cardH,
        "\u00c9volution annuelle",
        fmtEvo(data.marcheEvolution),
        evoColor
      );
    }

    if (data.marcheNbTransactions != null) {
      drawStatCard(
        doc,
        M + 2 * (cardW + gap),
        y,
        cardW,
        cardH,
        "Transactions (3 ans)",
        fmtNum(data.marcheNbTransactions),
        TEXT_SEC
      );
    }

    y += cardH + 16;

    // Commune comparison
    if (data.communeAvgPrix != null) {
      const diff = Math.round(
        ((data.marchePrixM2 - data.communeAvgPrix) / data.communeAvgPrix) * 100
      );
      const compText =
        diff >= 0
          ? `+${diff} % par rapport \u00e0 la moyenne de ${data.communeLabel} (${fmtPrix(data.communeAvgPrix)}/m\u00b2)`
          : `${diff} % par rapport \u00e0 la moyenne de ${data.communeLabel} (${fmtPrix(data.communeAvgPrix)}/m\u00b2)`;
      doc.font("Helvetica").fontSize(8.5).fillColor(TEXT_SEC);
      doc.text(compText, M, y, { width: CW });
      y += 18;
    }
  }

  y += 6;

  // Transaction table
  if (data.transactions.length > 0) {
    doc.font("Helvetica-Bold").fontSize(11).fillColor(TEXT);
    doc.text(
      `Derni\u00e8res transactions (${data.transactions.length})`,
      M,
      y,
      { width: CW }
    );
    y += 20;

    const cols: Column[] = [
      { label: "Date", width: 65 },
      { label: "Adresse", width: 175 },
      { label: "Surface", width: 60, align: "right" },
      { label: "Prix", width: 95, align: "right" },
      { label: "Prix/m\u00b2", width: CW - 65 - 175 - 60 - 95, align: "right" },
    ];

    const rows = data.transactions.map((t) => [
      t.date,
      t.adresse || "\u2014",
      `${Math.round(t.surface)} m\u00b2`,
      fmtPrix(t.prix),
      `${fmtPrix(t.prixM2)}/m\u00b2`,
    ]);

    y = drawTable(doc, cols, rows, y);
  }

  // Source
  if (y + 20 > CB) {
    doc.addPage();
    y = CT;
  }
  doc.font("Helvetica").fontSize(7).fillColor(TEXT_MUTED);
  doc.text(
    "Source : DVF (demandes de valeurs fonci\u00e8res), rayon 500 m, 3 derni\u00e8res ann\u00e9es",
    M,
    y + 10,
    { width: CW }
  );
}

// ─── Page: Copropri\u00e9t\u00e9s \u00e0 proximit\u00e9 ──────────────────────────────────────────

function renderNearby(doc: Doc, data: ReportInput) {
  let y = sectionTitle(
    doc,
    `Copropri\u00e9t\u00e9s \u00e0 proximit\u00e9 (${data.nearby.length})`,
    CT
  );

  doc.font("Helvetica").fontSize(8.5).fillColor(TEXT_SEC);
  doc.text("Dans un rayon de 500 m, tri\u00e9es par distance", M, y, {
    width: CW,
  });
  y += 18;

  for (const n of data.nearby) {
    if (y + 38 > CB) {
      doc.addPage();
      y = CT;
    }

    // Card row
    doc.save();
    doc.lineWidth(0.5);
    doc.roundedRect(M, y, CW, 32, 4).fillAndStroke(BG_ALT, BORDER);

    // Score badge
    if (n.score != null) {
      drawScoreBadge(doc, M + 10, y + 7, n.score);
    } else {
      doc.font("Helvetica").fontSize(8).fillColor(TEXT_MUTED);
      doc.text("\u2014", M + 10, y + 10, { width: 34, align: "center" });
    }

    // Name
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(TEXT);
    doc.text(n.name, M + 52, y + 5, { width: 220, lineBreak: false });

    // Commune
    doc.font("Helvetica").fontSize(7.5).fillColor(TEXT_SEC);
    doc.text(n.commune || "", M + 52, y + 18, {
      width: 220,
      lineBreak: false,
    });

    // Lots + Distance (right side)
    const rightX = PW - M - 110;
    doc.font("Helvetica").fontSize(8).fillColor(TEXT_SEC);
    if (n.nbLots != null) {
      doc.text(`${n.nbLots} lots`, rightX, y + 8, {
        width: 50,
        align: "right",
        lineBreak: false,
      });
    }
    doc.text(`${Math.round(n.distance)} m`, rightX + 56, y + 8, {
      width: 50,
      align: "right",
      lineBreak: false,
    });

    doc.restore();
    y += 38;
  }
}

// ─── Last page: Mentions l\u00e9gales ────────────────────────────────────────────

function renderDisclaimer(doc: Doc, data: ReportInput) {
  let y = sectionTitle(doc, "Mentions l\u00e9gales", CT);

  const lines = [
    "Ce rapport est g\u00e9n\u00e9r\u00e9 automatiquement \u00e0 partir de donn\u00e9es publiques ouvertes.",
    "Il ne constitue pas un diagnostic technique global (DTG) ni un avis professionnel.",
    "",
    "Sources :",
    "\u2014  RNIC \u2014 Registre National d'Immatriculation des Copropri\u00e9t\u00e9s",
    "\u2014  DVF \u2014 Demandes de Valeurs Fonci\u00e8res (data.gouv.fr)",
    "\u2014  DPE ADEME \u2014 Diagnostics de Performance \u00c9nerg\u00e9tique",
    "\u2014  BAN \u2014 Base Adresse Nationale",
    "",
    `\u00a9 CoproScore ${new Date().getFullYear()} \u2014 coproscore.fr`,
    "",
    `Rapport : coproscore.fr/copropriete/${data.slug}`,
  ];

  doc.font("Helvetica").fontSize(9).fillColor(TEXT_SEC);
  for (const line of lines) {
    if (line === "") {
      y += 10;
    } else {
      doc.text(line, M, y, { width: CW });
      y += 14;
    }
  }
}

// ─── Main generator ──────────────────────────────────────────────────────────

export async function generatePdfReport(
  input: ReportInput
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      bufferPages: true,
      margins: { top: M, bottom: 0, left: M, right: M },
      info: {
        Title: `Rapport CoproScore \u2014 ${input.displayName}`,
        Author: "CoproScore",
        Creator: "coproscore.fr",
      },
    });

    const chunks: Uint8Array[] = [];
    doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Page 1: Cover
    renderCover(doc, input);

    // Page 2: Score d\u00e9taill\u00e9
    doc.addPage();
    renderScoreDetail(doc, input);

    // Page 3: Analyse IA
    if (input.analyse) {
      doc.addPage();
      renderAnalyse(doc, input);
    }

    // Page: Estimation travaux
    if (input.estimation && input.estimation.postes.length > 0) {
      doc.addPage();
      renderEstimation(doc, input);
    }

    // Page: Chronologie
    if (input.timeline.length > 0) {
      doc.addPage();
      renderTimeline(doc, input);
    }

    // Page: March\u00e9 immobilier
    if (input.marchePrixM2 != null || input.transactions.length > 0) {
      doc.addPage();
      renderMarket(doc, input);
    }

    // Page: Copros \u00e0 proximit\u00e9
    if (input.nearby.length > 0) {
      doc.addPage();
      renderNearby(doc, input);
    }

    // Last: Disclaimer
    doc.addPage();
    renderDisclaimer(doc, input);

    // ── Final pass: add page chrome with Page X/N ──
    const range = doc.bufferedPageRange();
    const total = range.count;
    for (let i = 0; i < total; i++) {
      doc.switchToPage(i);
      if (i > 0) {
        addPageHeader(doc, i, total - 1);
      }
      addPageFooter(doc);
    }

    doc.end();
  });
}
