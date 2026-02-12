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
const M = 40;
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

const DPE_COLORS: Record<string, string> = {
  A: "#319834",
  B: "#33cc31",
  C: "#cbfc34",
  D: "#fbfe06",
  E: "#fbcc05",
  F: "#F28C00",
  G: "#fc0205",
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

  quarterlyPrices: { year: number; quarter: number; avgPrixM2: number }[];

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

/** Replace U+202F (narrow no-break space) and U+00A0 (no-break space) that fr-FR locale inserts — Helvetica lacks U+202F glyph */
function sanitize(s: string): string {
  return s.replace(/[\u202F\u00A0]/g, " ");
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

function fmtCompactPrix(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(0)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return Math.round(n).toString();
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

/** Check space and add a new page if needed, returning the new y */
function ensureSpace(doc: Doc, y: number, minH: number): number {
  if (y + minH > CB) {
    doc.addPage();
    return CT;
  }
  return y;
}

/** Add inter-section gap; start new page if not enough room for title + some content */
function sectionGap(doc: Doc, y: number, minContentH: number = 80): number {
  y += 24;
  if (y + minContentH > CB) {
    doc.addPage();
    return CT;
  }
  return y;
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

/** Draw a score gauge (240° arc opening at bottom) */
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
  const LW = r > 65 ? 16 : 14;

  // Background arc
  drawArcStroke(doc, cx, cy, r, START, END, LW, BORDER);

  // Score arc
  if (score > 0) {
    const fillEnd = START + (SWEEP * Math.min(score, 100)) / 100;
    drawArcStroke(doc, cx, cy, r, START, fillEnd, LW, sc(score));
  }

  // Score number
  const numFS = r > 65 ? 44 : 38;
  doc.font("Helvetica-Bold").fontSize(numFS).fillColor(TEXT);
  const sStr = score.toString();
  const tw = doc.widthOfString(sStr);
  doc.text(sStr, cx - tw / 2, cy - numFS / 2 - 2, { lineBreak: false });

  // /100
  doc.font("Helvetica").fontSize(13).fillColor(TEXT_SEC);
  const sub = "/ 100";
  const sw = doc.widthOfString(sub);
  doc.text(sub, cx - sw / 2, cy + numFS / 2 - 8, { lineBreak: false });
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
    doc.rect(x, y, w, 6).clip();
    doc.roundedRect(x, y, w, h, 4).fill(accentColor);
    doc.restore();
  }

  const contentTop = accentColor ? y + 8 : y;
  const contentH = h - (accentColor ? 8 : 0);
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
  const HDR_H = 22;
  const FS = 8;
  const PAD = 5;
  let y = startY;

  function header(atY: number): number {
    doc.save();
    doc.rect(M, atY, CW, HDR_H).fill(TEAL);
    doc.font("Helvetica-Bold").fontSize(FS).fillColor(WHITE);
    let x = M;
    for (const col of columns) {
      doc.text(col.label, x + PAD, atY + 6, {
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
      doc.text(rows[i][j] || "\u2014", x + PAD, y + 4, {
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

// ─── Bar chart for quarterly prices ─────────────────────────────────────────

function drawQuarterlyChart(
  doc: Doc,
  data: { year: number; quarter: number; avgPrixM2: number }[],
  x: number,
  y: number,
  w: number,
  h: number
): number {
  if (data.length === 0) return y;

  const axisW = 38;
  const labelH = 18;
  const topPad = 14;
  const chartX = x + axisW;
  const chartW = w - axisW;
  const chartH = h - labelH - topPad;

  const maxVal = Math.max(...data.map((d) => d.avgPrixM2));
  const minVal = Math.min(...data.map((d) => d.avgPrixM2)) * 0.85;
  const range = maxVal - minVal || 1;

  const gap = 3;
  const barW = Math.min(28, (chartW - 10) / data.length - gap);
  const totalBarsW = data.length * (barW + gap) - gap;
  const startX = chartX + (chartW - totalBarsW) / 2;

  // Background
  doc.save();
  doc.roundedRect(x, y, w, h, 4).fill(BG_ALT);

  // Y-axis gridlines and labels (3 levels)
  const midVal = (minVal + maxVal) / 2;
  const ticks = [minVal, midVal, maxVal];
  for (const tickVal of ticks) {
    const tickY =
      y + topPad + chartH - ((tickVal - minVal) / range) * chartH;
    doc
      .moveTo(chartX, tickY)
      .lineTo(chartX + chartW, tickY)
      .lineWidth(0.3)
      .strokeColor(BORDER)
      .stroke();
    doc.font("Helvetica").fontSize(6).fillColor(TEXT_MUTED);
    doc.text(fmtCompactPrix(tickVal), x + 1, tickY - 5, {
      width: axisW - 5,
      align: "right",
      lineBreak: false,
    });
  }

  // Bars + value labels + X-axis labels
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    const barH = Math.max(4, ((d.avgPrixM2 - minVal) / range) * chartH);
    const bx = startX + i * (barW + gap);
    const by = y + topPad + chartH - barH;
    doc.roundedRect(bx, by, barW, barH, 2).fill(TEAL);

    // Value above bar
    doc.font("Helvetica-Bold").fontSize(5.5).fillColor(TEXT_SEC);
    doc.text(fmtCompactPrix(d.avgPrixM2), bx - 5, by - 10, {
      width: barW + 10,
      align: "center",
      lineBreak: false,
    });

    // Quarter label
    doc.font("Helvetica").fontSize(6).fillColor(TEXT_MUTED);
    doc.text(`T${d.quarter}`, bx, y + topPad + chartH + 3, {
      width: barW,
      align: "center",
      lineBreak: false,
    });

    // Year label on Q1 or first bar
    if (d.quarter === 1 || i === 0) {
      doc.font("Helvetica-Bold").fontSize(6).fillColor(TEXT_SEC);
      doc.text(d.year.toString(), bx, y + topPad + chartH + 11, {
        width: barW + gap + barW,
        align: "left",
        lineBreak: false,
      });
    }
  }

  doc.restore();
  return y + h;
}

// ─── Section title ───────────────────────────────────────────────────────────

function sectionTitle(doc: Doc, text: string, y: number): number {
  doc.font("Helvetica-Bold").fontSize(14).fillColor(TEAL);
  doc.text(text, M, y, { width: CW });
  const bottom = y + 20;
  doc.save();
  doc
    .moveTo(M, bottom)
    .lineTo(M + 45, bottom)
    .lineWidth(2.5)
    .strokeColor(TEAL)
    .lineCap("round")
    .stroke();
  doc.restore();
  return bottom + 10;
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
  doc.rect(0, 0, PW, 160).fill(TEAL);

  doc.font("Helvetica-Bold").fontSize(32).fillColor(WHITE);
  doc.text("CoproScore", 0, 48, { width: PW, align: "center" });

  doc.font("Helvetica").fontSize(13).fillColor(TEAL_100);
  doc.text("Rapport d'analyse complet", 0, 88, {
    width: PW,
    align: "center",
  });

  // ── Score gauge (bigger) ──
  const gaugeY = 270;
  drawScoreGauge(doc, cx, gaugeY, 75, data.scoreGlobal);

  // Score label
  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .fillColor(sc(data.scoreGlobal))
    .text(sl(data.scoreGlobal), 0, gaugeY + 65, {
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
        gaugeY + 84,
        { width: PW, align: "center" }
      );
  }

  // ── Copro info card ──
  const cardY = gaugeY + 104;
  doc.font("Helvetica-Bold").fontSize(12);
  const nameH = doc.heightOfString(data.displayName, { width: CW - 32 });
  const cityLine = [data.codePostal, data.commune].filter(Boolean).join(" ");
  const cardH = nameH + (cityLine ? 28 : 16);

  doc.save();
  doc.lineWidth(0.5);
  doc.roundedRect(M, cardY, CW, cardH, 6).fillAndStroke(WHITE, BORDER);

  doc.font("Helvetica-Bold").fontSize(12).fillColor(TEXT);
  doc.text(data.displayName, M + 16, cardY + 8, {
    width: CW - 32,
    align: "center",
  });
  if (cityLine) {
    doc.font("Helvetica").fontSize(10).fillColor(TEXT_SEC);
    doc.text(cityLine, M + 16, cardY + 8 + nameH + 3, {
      width: CW - 32,
      align: "center",
    });
  }
  doc.restore();

  // ── Stat cards (bigger) ──
  const cardsY = cardY + cardH + 14;
  const gap = 10;
  const cardW = (CW - 3 * gap) / 4;

  const stats: { label: string; value: string; accent?: string }[] = [
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
      accent: data.dpeClasseMediane
        ? DPE_COLORS[data.dpeClasseMediane]
        : undefined,
    },
  ];

  for (let i = 0; i < stats.length; i++) {
    const sx = M + i * (cardW + gap);
    drawStatCard(
      doc,
      sx,
      cardsY,
      cardW,
      52,
      stats[i].label,
      stats[i].value,
      stats[i].accent
    );
  }

  // ── Dimension score strip ──
  const stripY = cardsY + 66;

  doc.save();
  doc
    .moveTo(M + 60, stripY - 6)
    .lineTo(PW - M - 60, stripY - 6)
    .strokeColor(BORDER)
    .lineWidth(0.5)
    .stroke();
  doc.restore();

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(TEXT)
    .text("Sous-scores", 0, stripY + 4, { width: PW, align: "center" });

  const dimStripY = stripY + 20;
  const dimSlotW = CW / 5;
  const barW = dimSlotW - 24;

  for (let i = 0; i < data.dimensions.length; i++) {
    const dim = data.dimensions[i];
    const dx = M + i * dimSlotW;
    const dimColor = DIM_COLORS[dim.label] || TEAL;
    const pct = dim.score != null ? dim.score / dim.max : 0;

    // Label
    const shortLabel =
      dim.label === "Gouvernance"
        ? "Gouv."
        : dim.label === "\u00c9nergie"
          ? "\u00c9ner."
          : dim.label === "March\u00e9"
            ? "March."
            : dim.label;
    doc.font("Helvetica").fontSize(7).fillColor(TEXT_SEC);
    doc.text(shortLabel, dx, dimStripY, {
      width: dimSlotW,
      align: "center",
      lineBreak: false,
    });

    // Mini progress bar
    const bx = dx + (dimSlotW - barW) / 2;
    drawProgressBar(doc, bx, dimStripY + 12, barW, 5, pct, BG_CARD, dimColor);

    // Score
    const scoreText =
      dim.score != null ? `${dim.score}/${dim.max}` : "\u2014";
    doc.font("Helvetica-Bold").fontSize(7).fillColor(TEXT);
    doc.text(scoreText, dx, dimStripY + 22, {
      width: dimSlotW,
      align: "center",
      lineBreak: false,
    });
  }

  // ── Footer ──
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(TEXT_MUTED)
    .text(`Rapport g\u00e9n\u00e9r\u00e9 le ${fmtDate()}`, 0, 720, {
      width: PW,
      align: "center",
    });

  doc
    .fontSize(8)
    .fillColor(TEXT_MUTED)
    .text(
      "coproscore.fr \u2014 Donn\u00e9es issues du RNIC, DVF, DPE ADEME",
      0,
      738,
      { width: PW, align: "center" }
    );
}

// ─── Score détaillé ─────────────────────────────────────────────────────────

function renderScoreDetail(doc: Doc, data: ReportInput, startY: number): number {
  let y = sectionTitle(doc, "Score d\u00e9taill\u00e9", startY);

  for (const dim of data.dimensions) {
    if (y + 60 > CB) {
      doc.addPage();
      y = CT;
    }

    const pct = dim.score != null ? dim.score / dim.max : 0;
    const pct100 = Math.round(pct * 100);
    const dimColor = DIM_COLORS[dim.label] || TEAL;

    // Label + score on same line
    doc.font("Helvetica-Bold").fontSize(10).fillColor(TEXT);
    doc.text(dim.label, M, y, { lineBreak: false });

    const scoreText =
      dim.score != null ? `${dim.score} / ${dim.max}` : "\u2014";
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(dim.score != null ? sc(pct100) : TEXT_MUTED);
    doc.text(scoreText, M, y, { width: CW, align: "right" });
    y += 16;

    // Progress bar
    drawProgressBar(doc, M, y, CW, 6, pct, BG_CARD, dimColor);
    y += 12;

    // Explanation
    const explText = sanitize(dim.detailedExplanation);
    doc.font("Helvetica").fontSize(8).fillColor(TEXT_SEC);
    const textH = doc.heightOfString(explText, { width: CW });
    doc.text(explText, M, y, { width: CW });
    y += textH + 14;
  }

  return y;
}

// ─── Analyse IA ─────────────────────────────────────────────────────────────

function renderAnalyse(doc: Doc, data: ReportInput, startY: number): number {
  if (!data.analyse) return startY;

  let y = sectionTitle(doc, "Analyse CoproScore", startY);

  doc.font("Helvetica").fontSize(7.5).fillColor(TEXT_MUTED);
  doc.text(
    "G\u00e9n\u00e9r\u00e9e par intelligence artificielle \u00e0 partir des donn\u00e9es publiques",
    M,
    y,
    { width: CW }
  );
  y += 14;

  // Resume box
  doc.save();
  const resumeText = sanitize(data.analyse.resume);
  doc.font("Helvetica").fontSize(8.5);
  const resumeH = doc.heightOfString(resumeText, { width: CW - 24 });
  const boxH = resumeH + 18;

  y = ensureSpace(doc, y, boxH + 10);

  doc.roundedRect(M, y, CW, boxH, 5).fill(TEAL_50);
  doc
    .roundedRect(M, y, CW, boxH, 5)
    .lineWidth(0.5)
    .strokeColor(TEAL)
    .stroke();

  doc.font("Helvetica").fontSize(8.5).fillColor(TEXT);
  doc.text(resumeText, M + 12, y + 9, { width: CW - 24 });
  doc.restore();
  y += boxH + 14;

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
  y = ensureSpace(doc, y, 16);
  doc.font("Helvetica").fontSize(7).fillColor(TEXT_MUTED);
  doc.text(`Analyse g\u00e9n\u00e9r\u00e9e le ${fmtDate()}`, M, y, {
    width: CW,
  });
  y += 12;

  return y;
}

function renderAnalyseSection(
  doc: Doc,
  y: number,
  title: string,
  items: string[],
  color: string
): number {
  y = ensureSpace(doc, y, 30);

  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(TEXT);
  doc.text(title, M, y, { width: CW });
  y += 14;

  for (const item of items) {
    const text = sanitize(item);
    const itemH = doc.heightOfString(text, { width: CW - 18 });
    y = ensureSpace(doc, y, itemH + 6);

    // Colored bullet
    doc.circle(M + 4, y + 4.5, 2.5).fill(color);
    // Text
    doc.font("Helvetica").fontSize(8).fillColor(TEXT_SEC);
    doc.text(text, M + 14, y, { width: CW - 18 });
    y += itemH + 4;
  }

  return y + 8;
}

// ─── Estimation des travaux ─────────────────────────────────────────────────

function renderEstimation(
  doc: Doc,
  data: ReportInput,
  startY: number
): number {
  if (!data.estimation || data.estimation.postes.length === 0) return startY;

  let y = sectionTitle(doc, "Estimation des travaux potentiels", startY);

  doc.font("Helvetica").fontSize(7.5).fillColor(TEXT_MUTED);
  doc.text(
    "Fourchettes bas\u00e9es sur les moyennes nationales ANAH/ADEME. Ne remplace pas un devis professionnel.",
    M,
    y,
    { width: CW }
  );
  y += 14;

  const est = data.estimation;

  // Table
  const cols: Column[] = [
    { label: "Poste de travaux", width: 190 },
    { label: "Description", width: 165 },
    { label: "Min", width: 75, align: "right" },
    { label: "Max", width: CW - 190 - 165 - 75, align: "right" },
  ];

  const rows = est.postes.map((p) => [
    p.nom,
    sanitize(p.description),
    fmtPrix(p.min),
    fmtPrix(p.max),
  ]);

  y = drawTable(doc, cols, rows, y);
  y += 10;

  // Total box
  y = ensureSpace(doc, y, 48);

  doc.save();
  doc.lineWidth(1);
  doc.roundedRect(M, y, CW, 44, 5).fillAndStroke(TEAL_50, TEAL);

  doc.font("Helvetica-Bold").fontSize(10).fillColor(TEXT);
  doc.text("Total estim\u00e9", M + 12, y + 8, { lineBreak: false });

  doc.font("Helvetica-Bold").fontSize(12).fillColor(TEAL);
  doc.text(
    `${fmtPrix(est.totalMin)} \u2014 ${fmtPrix(est.totalMax)}`,
    M + 12,
    y + 8,
    { width: CW - 24, align: "right" }
  );

  // Per lot
  if (data.nbLotsHabitation && data.nbLotsHabitation > 1) {
    const perMin = Math.round(est.totalMin / data.nbLotsHabitation);
    const perMax = Math.round(est.totalMax / data.nbLotsHabitation);
    doc.font("Helvetica").fontSize(7.5).fillColor(TEXT_SEC);
    doc.text(
      `soit ${fmtPrix(perMin)} \u2014 ${fmtPrix(perMax)} par lot`,
      M + 12,
      y + 26,
      { width: CW - 24, align: "right" }
    );
  }

  // Fiabilité
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
  doc.font("Helvetica").fontSize(7.5).fillColor(fiabColor);
  doc.text(fiabLabel, M + 12, y + 26, { lineBreak: false });

  doc.restore();
  y += 52;

  // Disclaimer
  y = ensureSpace(doc, y, 14);
  doc.font("Helvetica").fontSize(7).fillColor(TEXT_MUTED);
  doc.text(
    "Ces estimations sont indicatives et bas\u00e9es sur des moyennes nationales.",
    M,
    y,
    { width: CW }
  );
  y += 12;

  return y;
}

// ─── Chronologie ────────────────────────────────────────────────────────────

function renderTimeline(
  doc: Doc,
  data: ReportInput,
  startY: number
): number {
  const events = data.timeline;
  if (events.length === 0) return startY;

  let y = sectionTitle(doc, "Chronologie", startY);

  // Group transaction events into a summary when > 2
  const txEvents = events.filter((e) => e.type === "transaction");
  const otherEvents = events.filter((e) => e.type !== "transaction");

  let displayEvents: TimelineEvent[];
  if (txEvents.length > 2) {
    // Build a summary event
    const earliest = txEvents[txEvents.length - 1];
    const latest = txEvents[0];
    const eDate = new Date(earliest.date);
    const lDate = new Date(latest.date);
    const yearRange =
      eDate.getFullYear() === lDate.getFullYear()
        ? lDate.getFullYear().toString()
        : `${eDate.getFullYear()}\u2013${lDate.getFullYear()}`;

    const summaryEvent: TimelineEvent = {
      date: latest.date,
      sortDate: latest.sortDate,
      type: "transaction",
      titre: `${txEvents.length} transactions immobili\u00e8res`,
      description: `Ventes enregistr\u00e9es dans un rayon de 100 m (${yearRange})`,
      dateLabel: yearRange,
    };
    displayEvents = [...otherEvents, summaryEvent].sort(
      (a, b) => b.sortDate - a.sortDate
    );
  } else {
    displayEvents = events;
  }

  const dateW = 76;
  const dotX = M + dateW + 12;
  const textX = dotX + 14;
  const textW = M + CW - textX;
  const dotR = 4;

  let prevDotY: number | null = null;

  for (let i = 0; i < displayEvents.length; i++) {
    const ev = displayEvents[i];
    const title = sanitize(ev.titre);
    const desc = sanitize(ev.description);

    // Calculate height
    doc.font("Helvetica-Bold").fontSize(8.5);
    const titleH = doc.heightOfString(title, { width: textW });
    doc.font("Helvetica").fontSize(7.5);
    const descH = doc.heightOfString(desc, { width: textW });
    const rowH = Math.max(24, titleH + descH + 6);

    // Page break
    if (y + rowH > CB) {
      doc.addPage();
      y = CT;
      prevDotY = null;
    }

    const eventDotY = y + 6;

    // Vertical connector line from previous dot
    if (prevDotY != null) {
      doc.save();
      doc
        .moveTo(dotX, prevDotY)
        .lineTo(dotX, eventDotY)
        .lineWidth(1.5)
        .strokeColor(BORDER)
        .stroke();
      doc.restore();
    }

    // Colored dot
    const evColor = EVENT_COLORS[ev.type] || TEXT_SEC;
    doc.circle(dotX, eventDotY, dotR).fill(evColor);

    // Date (left of dot)
    const dateStr = ev.dateLabel
      ? ev.dateLabel
      : sanitize(
          new Date(ev.date).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        );

    doc.font("Helvetica").fontSize(7.5).fillColor(TEXT_MUTED);
    doc.text(dateStr, M, y + 1, {
      width: dateW,
      align: "right",
      lineBreak: false,
    });

    // Type badge
    const typeLabel = EVENT_LABELS[ev.type] ?? ev.type;
    doc.font("Helvetica").fontSize(6).fillColor(evColor);
    doc.text(typeLabel, M, y + 12, {
      width: dateW,
      align: "right",
      lineBreak: false,
    });

    // Title
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(TEXT);
    doc.text(title, textX, y, { width: textW });

    // Description
    doc.font("Helvetica").fontSize(7.5).fillColor(TEXT_SEC);
    doc.text(desc, textX, y + titleH + 1, { width: textW });

    prevDotY = eventDotY;
    y += rowH + 6;
  }

  return y;
}

// ─── Marché immobilier ──────────────────────────────────────────────────────

function renderMarket(
  doc: Doc,
  data: ReportInput,
  startY: number
): number {
  let y = sectionTitle(doc, "March\u00e9 immobilier", startY);

  // Stat cards
  if (data.marchePrixM2 != null) {
    const gap = 10;
    const cardW = (CW - 2 * gap) / 3;
    const cardH = 50;

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

    y += cardH + 12;

    // Commune comparison
    if (data.communeAvgPrix != null) {
      const diff = Math.round(
        ((data.marchePrixM2 - data.communeAvgPrix) / data.communeAvgPrix) * 100
      );
      const compText =
        diff >= 0
          ? `+${diff} % par rapport \u00e0 la moyenne de ${data.communeLabel} (${fmtPrix(data.communeAvgPrix)}/m\u00b2)`
          : `${diff} % par rapport \u00e0 la moyenne de ${data.communeLabel} (${fmtPrix(data.communeAvgPrix)}/m\u00b2)`;
      doc.font("Helvetica").fontSize(8).fillColor(TEXT_SEC);
      doc.text(compText, M, y, { width: CW });
      y += 14;
    }
  }

  // Quarterly price chart
  if (data.quarterlyPrices.length > 2) {
    y += 4;
    y = ensureSpace(doc, y, 120);
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(TEXT);
    doc.text("\u00c9volution trimestrielle du prix / m\u00b2", M, y, {
      width: CW,
    });
    y += 14;
    y = drawQuarterlyChart(doc, data.quarterlyPrices, M, y, CW, 100);
    y += 10;
  }

  // Transaction table
  if (data.transactions.length > 0) {
    y += 4;
    y = ensureSpace(doc, y, 60);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(TEXT);
    doc.text(
      `Derni\u00e8res transactions (${data.transactions.length})`,
      M,
      y,
      { width: CW }
    );
    y += 16;

    const cols: Column[] = [
      { label: "Date", width: 60 },
      { label: "Adresse", width: 185 },
      { label: "Surface", width: 55, align: "right" },
      { label: "Prix", width: 90, align: "right" },
      {
        label: "Prix/m\u00b2",
        width: CW - 60 - 185 - 55 - 90,
        align: "right",
      },
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
  y = ensureSpace(doc, y, 16);
  doc.font("Helvetica").fontSize(7).fillColor(TEXT_MUTED);
  doc.text(
    "Source : DVF (demandes de valeurs fonci\u00e8res), rayon 500 m, 3 derni\u00e8res ann\u00e9es",
    M,
    y + 6,
    { width: CW }
  );
  y += 16;

  return y;
}

// ─── Copropriétés à proximité (2-column grid) ──────────────────────────────

function renderNearby(
  doc: Doc,
  data: ReportInput,
  startY: number
): number {
  if (data.nearby.length === 0) return startY;

  let y = sectionTitle(
    doc,
    `Copropri\u00e9t\u00e9s \u00e0 proximit\u00e9 (${data.nearby.length})`,
    startY
  );

  doc.font("Helvetica").fontSize(8).fillColor(TEXT_SEC);
  doc.text("Dans un rayon de 500 m, tri\u00e9es par distance", M, y, {
    width: CW,
  });
  y += 14;

  const colGap = 10;
  const colW = (CW - colGap) / 2;
  const cardH = 30;
  const rowGap = 6;

  for (let i = 0; i < data.nearby.length; i += 2) {
    y = ensureSpace(doc, y, cardH + rowGap);

    // Render up to 2 cards per row
    for (let col = 0; col < 2; col++) {
      const idx = i + col;
      if (idx >= data.nearby.length) break;
      const n = data.nearby[idx];
      const cx = M + col * (colW + colGap);

      doc.save();
      doc.lineWidth(0.5);
      doc.roundedRect(cx, y, colW, cardH, 3).fillAndStroke(BG_ALT, BORDER);

      // Score badge
      if (n.score != null) {
        drawScoreBadge(doc, cx + 6, y + 6, n.score);
      } else {
        doc.font("Helvetica").fontSize(7).fillColor(TEXT_MUTED);
        doc.text("\u2014", cx + 6, y + 9, { width: 34, align: "center" });
      }

      // Name
      const nameX = cx + 46;
      const nameW = colW - 52;
      doc.font("Helvetica-Bold").fontSize(7.5).fillColor(TEXT);
      doc.text(n.name, nameX, y + 4, {
        width: nameW,
        lineBreak: false,
      });

      // Info: lots · distance
      const infoParts: string[] = [];
      if (n.nbLots != null) infoParts.push(`${n.nbLots} lots`);
      infoParts.push(`${Math.round(n.distance)} m`);
      doc.font("Helvetica").fontSize(6.5).fillColor(TEXT_SEC);
      doc.text(infoParts.join(" \u00b7 "), nameX, y + 16, {
        width: nameW,
        lineBreak: false,
      });

      doc.restore();
    }

    y += cardH + rowGap;
  }

  return y;
}

// ─── Mentions légales ───────────────────────────────────────────────────────

function renderDisclaimer(
  doc: Doc,
  data: ReportInput,
  startY: number
): number {
  let y = sectionTitle(doc, "Mentions l\u00e9gales", startY);

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
  ];

  doc.font("Helvetica").fontSize(8.5).fillColor(TEXT_SEC);
  for (const line of lines) {
    if (line === "") {
      y += 8;
    } else {
      if (y + 13 > CB) { doc.addPage(); y = CT; }
      doc.text(line, M, y, { width: CW });
      y += 13;
    }
  }

  // Clickable report link (tight after copyright)
  y += 4;
  if (y + 14 > CB) { doc.addPage(); y = CT; }
  const reportUrl = `https://coproscore.fr/copropriete/${data.slug}`;
  doc.font("Helvetica").fontSize(8.5).fillColor(TEAL);
  doc.text(`Rapport : ${reportUrl}`, M, y, {
    width: CW,
    link: reportUrl,
    underline: true,
  });
  y += 14;

  return y;
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

    // Page 1: Cover (always full page)
    renderCover(doc, input);

    // Page 2+: flowing content
    doc.addPage();
    let y: number = CT;

    // Score détaillé
    y = renderScoreDetail(doc, input, y);

    // Analyse IA (stays on same page as score if room)
    if (input.analyse) {
      y = sectionGap(doc, y, 120);
      y = renderAnalyse(doc, input, y);
    }

    // Estimation travaux (push to new page — needs table + total box)
    if (input.estimation && input.estimation.postes.length > 0) {
      y = sectionGap(doc, y, 220);
      y = renderEstimation(doc, input, y);
    }

    // Chronologie (keep with estimation if room)
    if (input.timeline.length > 0) {
      y = sectionGap(doc, y, 80);
      y = renderTimeline(doc, input, y);
    }

    // Marché immobilier (push to new page — needs cards + chart + table)
    if (input.marchePrixM2 != null || input.transactions.length > 0) {
      y = sectionGap(doc, y, 200);
      y = renderMarket(doc, input, y);
    }

    // Copros à proximité (keep with market if room)
    if (input.nearby.length > 0) {
      y = sectionGap(doc, y, 60);
      y = renderNearby(doc, input, y);
    }

    // Disclaimer (flows inline after previous content)
    y += 12;
    renderDisclaimer(doc, input, y);

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
