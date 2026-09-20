import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  TableLayoutType,
  WidthType,
  TextRun,
  AlignmentType,
  PageBreak,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
} from "docx";
import type { Block, ContentModel } from "./content-model";

const NAVY = "0b1a63";
const NAVY_DEEP = "00007c";
const BLUE = "225fac";
const MUTED = "5a6178";
const PALE = "EEF1FB";

function kvTable(items: { label: string; value: string }[]): Table {
  const colWidths = [3200, 6300];
  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: colWidths[0] + colWidths[1], type: WidthType.DXA },
    columnWidths: colWidths,
    rows: items.map(
      (item) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: colWidths[0], type: WidthType.DXA },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: item.label, bold: true, color: MUTED, size: 18 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: colWidths[1], type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: item.value, size: 20 })] })],
            }),
          ],
        })
    ),
  });
}

function dataTable(headers: string[], rows: string[][]): Table {
  const totalWidth = 9500;
  const colWidth = Math.floor(totalWidth / Math.max(headers.length, 1));
  const colWidths = headers.map(() => colWidth);
  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map(
          (hcell) =>
            new TableCell({
              width: { size: colWidth, type: WidthType.DXA },
              shading: { fill: "EEF1FB" },
              children: [new Paragraph({ children: [new TextRun({ text: hcell, bold: true, color: NAVY, size: 18 })] })],
            })
        ),
      }),
      ...rows.map(
        (row) =>
          new TableRow({
            children: row.map(
              (cell) =>
                new TableCell({
                  width: { size: colWidth, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: cell, size: 18 })] })],
                })
            ),
          })
      ),
    ],
  });
}

function blocksToDocxChildren(blocks: Block[]): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case "h1":
        out.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
            children: [new TextRun({ text: b.text, color: NAVY, bold: true })],
          })
        );
        break;
      case "h2":
        out.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            children: [new TextRun({ text: b.text, color: NAVY, bold: true })],
          })
        );
        break;
      case "h3":
        out.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 140, after: 80 },
            children: [new TextRun({ text: b.text, color: BLUE, bold: true })],
          })
        );
        break;
      case "p":
        out.push(new Paragraph({ children: [new TextRun({ text: b.text })], spacing: { after: 100 } }));
        break;
      case "kv":
        out.push(kvTable(b.items));
        out.push(new Paragraph({ text: "", spacing: { after: 120 } }));
        break;
      case "table":
        out.push(dataTable(b.headers, b.rows));
        out.push(new Paragraph({ text: "", spacing: { after: 120 } }));
        break;
      case "spacer":
        out.push(new Paragraph({ text: "" }));
        break;
      case "pagebreak":
        out.push(new Paragraph({ children: [new PageBreak()] }));
        break;
    }
  }
  return out;
}

function coverPage(cover: ContentModel["cover"]): (Paragraph | Table)[] {
  const rows: [string, string][] = [
    ["Company", cover.company || "—"],
    ["Respondent", [cover.respondentName, cover.respondentPosition].filter(Boolean).join(" — ") || "—"],
    ["Submission Reference", cover.submissionRef || "Not yet submitted"],
    ["Submission Date", cover.submissionDate || "—"],
  ];
  const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const colWidths = [3200, 6300];
  const detailsTable = new Table({
    layout: TableLayoutType.FIXED,
    width: { size: colWidths[0] + colWidths[1], type: WidthType.DXA },
    columnWidths: colWidths,
    borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder },
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: colWidths[0], type: WidthType.DXA },
              shading: { fill: PALE },
              margins: { top: 100, bottom: 100, left: 150, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: label.toUpperCase(), bold: true, color: MUTED, size: 16 })] })],
            }),
            new TableCell({
              width: { size: colWidths[1], type: WidthType.DXA },
              shading: { fill: PALE },
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [new Paragraph({ children: [new TextRun({ text: value, bold: true, color: NAVY, size: 22 })] })],
            }),
          ],
        })
    ),
  });

  return [
    new Paragraph({ spacing: { before: 400, after: 200 }, children: [new TextRun({ text: cover.title, bold: true, color: NAVY_DEEP, size: 48 })] }),
    new Paragraph({ spacing: { after: 600 }, children: [new TextRun({ text: cover.subtitle, color: MUTED, size: 24 })] }),
    detailsTable,
    new Paragraph({
      spacing: { before: 600 },
      children: [
        new TextRun({
          text: "Prepared with the Town Team Workforce Compensation Requirements Questionnaire.",
          color: MUTED,
          size: 16,
          italics: true,
        }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

export async function generateDocx({ cover, blocks }: ContentModel): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: cover.company || "Workforce Compensation Questionnaire", color: MUTED, size: 16 })],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: "Page ", color: MUTED, size: 16 }),
                  new TextRun({ children: [PageNumber.CURRENT], color: MUTED, size: 16 }),
                  new TextRun({ text: " of ", color: MUTED, size: 16 }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], color: MUTED, size: 16 }),
                ],
              }),
            ],
          }),
        },
        children: [...coverPage(cover), ...blocksToDocxChildren(blocks)],
      },
    ],
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 20 } },
      },
    },
  });
  const arrayBuffer = await Packer.toBuffer(doc);
  return Buffer.from(arrayBuffer);
}
