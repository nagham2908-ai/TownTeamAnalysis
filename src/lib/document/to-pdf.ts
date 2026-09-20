import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ContentModel } from "./content-model";

const NAVY = "#0b1a63";
const NAVY_DEEP = "#00007c";
const BLUE = "#225fac";
const MUTED = "#5a6178";
const TEXT = "#1c2230";
const PALE = "#eef1fb";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 16;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const TOP_BAR_HEIGHT = 18;
const CONTENT_TOP = TOP_BAR_HEIGHT + 18;
const CONTENT_BOTTOM = PAGE_HEIGHT - 18;

export function generatePdf({ cover, blocks }: ContentModel): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  drawCoverPage(doc, cover);
  doc.addPage();
  let y = CONTENT_TOP;

  function ensureSpace(needed: number) {
    if (y + needed > CONTENT_BOTTOM) {
      doc.addPage();
      y = CONTENT_TOP;
    }
  }

  function heading(text: string, size: number, color: string, spacingBefore: number, spacingAfter: number) {
    ensureSpace(size / 2 + spacingBefore + spacingAfter);
    y += spacingBefore;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(color);
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
    doc.text(lines, MARGIN, y);
    y += lines.length * (size * 0.42) + spacingAfter;
  }

  function paragraph(text: string) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(TEXT);
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
    ensureSpace(lines.length * 5 + 4);
    doc.text(lines, MARGIN, y);
    y += lines.length * 5 + 4;
  }

  for (const b of blocks) {
    switch (b.type) {
      case "pagebreak":
        doc.addPage();
        y = CONTENT_TOP;
        break;
      case "h1":
        heading(b.text, 16, NAVY, 6, 4);
        break;
      case "h2":
        heading(b.text, 13, NAVY, 4, 3);
        break;
      case "h3":
        heading(b.text, 11, BLUE, 3, 2);
        break;
      case "p":
        paragraph(b.text);
        break;
      case "kv": {
        ensureSpace(10);
        autoTable(doc, {
          startY: y,
          margin: { left: MARGIN, right: MARGIN, top: CONTENT_TOP, bottom: PAGE_HEIGHT - CONTENT_BOTTOM },
          theme: "plain",
          styles: { fontSize: 9.5, cellPadding: 1.5, textColor: TEXT },
          columnStyles: {
            0: { cellWidth: 55, fontStyle: "bold", textColor: MUTED },
            1: { cellWidth: CONTENT_WIDTH - 55 },
          },
          body: b.items.map((it) => [it.label, it.value]),
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = (doc as any).lastAutoTable.finalY + 4;
        break;
      }
      case "table": {
        ensureSpace(14);
        autoTable(doc, {
          startY: y,
          margin: { left: MARGIN, right: MARGIN, top: CONTENT_TOP, bottom: PAGE_HEIGHT - CONTENT_BOTTOM },
          theme: "grid",
          headStyles: { fillColor: [238, 241, 251], textColor: NAVY, fontStyle: "bold", fontSize: 8.5 },
          styles: { fontSize: 8.5, cellPadding: 1.8, textColor: TEXT },
          head: [b.headers],
          body: b.rows,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = (doc as any).lastAutoTable.finalY + 4;
        break;
      }
      case "spacer":
        y += 3;
        break;
    }
  }

  // Slim branded top bar + footer with page numbers on every page after the cover
  const pageCount = doc.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(NAVY);
    doc.rect(0, 0, PAGE_WIDTH, TOP_BAR_HEIGHT, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor("#ffffff");
    doc.text("Workforce Compensation — Requirements Questionnaire", MARGIN, TOP_BAR_HEIGHT / 2 + 1.5);
    if (cover.company) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(cover.company, PAGE_WIDTH - MARGIN, TOP_BAR_HEIGHT / 2 + 1.5, { align: "right" });
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(MUTED);
    doc.text(`Page ${i - 1} of ${pageCount - 1}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 10, { align: "right" });
    if (cover.submissionRef) {
      doc.text(cover.submissionRef, MARGIN, PAGE_HEIGHT - 10);
    }
  }

  return Buffer.from(doc.output("arraybuffer"));
}

function drawCoverPage(doc: jsPDF, cover: ContentModel["cover"]) {
  const BAND_HEIGHT = 74;

  // Header band mirroring the app's own navy gradient look (flat fill — jsPDF has no gradient fill).
  doc.setFillColor(NAVY_DEEP);
  doc.rect(0, 0, PAGE_WIDTH, BAND_HEIGHT, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor("#ffffff");
  const titleLines = doc.splitTextToSize(cover.title, CONTENT_WIDTH);
  doc.text(titleLines, MARGIN, 34);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11.5);
  doc.setTextColor("#dbe2f7");
  doc.text(cover.subtitle, MARGIN, 34 + titleLines.length * 8 + 4);

  // Details card — a compact 2x2 grid directly under the band, not floating
  // in the middle of the page with a large gap below it.
  const cardTop = BAND_HEIGHT + 14;
  const cardLeft = MARGIN;
  const cardWidth = CONTENT_WIDTH;
  const cardHeight = 46;
  const colWidth = cardWidth / 2;
  doc.setDrawColor(223, 227, 238);
  doc.setFillColor(PALE);
  doc.roundedRect(cardLeft, cardTop, cardWidth, cardHeight, 3, 3, "F");

  const cells: [string, string][] = [
    ["Company", cover.company || "—"],
    ["Respondent", [cover.respondentName, cover.respondentPosition].filter(Boolean).join(" — ") || "—"],
    ["Submission Reference", cover.submissionRef || "Not yet submitted"],
    ["Submission Date", cover.submissionDate || "—"],
  ];
  cells.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = cardLeft + 10 + col * colWidth;
    const cy = cardTop + 16 + row * 22;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(MUTED);
    doc.text(label.toUpperCase(), cx, cy);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(NAVY);
    const valueLines = doc.splitTextToSize(value, colWidth - 20);
    doc.text(valueLines, cx, cy + 6);
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  doc.text(
    "Prepared with the Town Team Workforce Compensation Requirements Questionnaire.",
    MARGIN,
    cardTop + cardHeight + 12
  );

  // A light rule near the bottom keeps the page from feeling unfinished
  // rather than pinning a stray line of text down there.
  doc.setDrawColor(223, 227, 238);
  doc.line(MARGIN, PAGE_HEIGHT - 24, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 24);
  doc.setFontSize(8);
  doc.setTextColor(MUTED);
  doc.text("Confidential — for internal Oracle Fusion HCM implementation use.", MARGIN, PAGE_HEIGHT - 18);
}
