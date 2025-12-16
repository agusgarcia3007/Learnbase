import PDFDocument from "pdfkit";
import { DOCUMENT_TYPES, type DocumentType } from "./prompts-document";
import type { CustomTheme } from "@/db/schema";

export type DocumentSection = {
  heading: string;
  content: string[];
  timestamp?: string;
};

export type GeneratedDocument = {
  title: string;
  sections: DocumentSection[];
};

export type DocumentSourceInfo = {
  videoTitles: string[];
  totalDuration?: number;
  generatedAt: Date;
  documentType: DocumentType;
};

type GeneratePdfParams = {
  document: GeneratedDocument;
  sourceInfo: DocumentSourceInfo;
  tenantName: string;
  theme?: CustomTheme | null;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 72;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export async function generatePdfFromContent(
  params: GeneratePdfParams
): Promise<Buffer> {
  const { document, sourceInfo, tenantName, theme } = params;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      info: {
        Title: document.title,
        Author: tenantName,
        Creator: "LearnBase",
        Subject: `${DOCUMENT_TYPES[sourceInfo.documentType]} - ${sourceInfo.videoTitles.join(", ")}`,
      },
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const primaryColor = theme?.primary || "#6366f1";
    const [pr, pg, pb] = hexToRgb(primaryColor);

    doc
      .fontSize(24)
      .fillColor([pr, pg, pb])
      .text(document.title, { align: "center" });

    doc.moveDown(0.5);

    doc
      .fontSize(10)
      .fillColor("#6b7280")
      .text(DOCUMENT_TYPES[sourceInfo.documentType], { align: "center" });

    doc.moveDown(1.5);

    doc.moveTo(MARGIN, doc.y).lineTo(PAGE_WIDTH - MARGIN, doc.y).stroke("#e5e7eb");

    doc.moveDown(1);

    doc
      .fontSize(9)
      .fillColor("#9ca3af")
      .text(`Source: ${sourceInfo.videoTitles.join(" | ")}`, { align: "left" });

    if (sourceInfo.totalDuration) {
      doc.text(`Duration: ${formatDuration(sourceInfo.totalDuration)}`, {
        align: "left",
      });
    }

    doc.text(
      `Generated: ${sourceInfo.generatedAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`,
      { align: "left" }
    );

    doc.moveDown(1.5);

    for (const section of document.sections) {
      if (doc.y > PAGE_HEIGHT - MARGIN - 100) {
        doc.addPage();
      }

      doc.fontSize(14).fillColor([pr, pg, pb]).text(section.heading);

      if (section.timestamp) {
        doc.fontSize(9).fillColor("#9ca3af").text(`[${section.timestamp}]`);
      }

      doc.moveDown(0.5);

      doc.fontSize(11).fillColor("#374151");

      for (const item of section.content) {
        if (doc.y > PAGE_HEIGHT - MARGIN - 50) {
          doc.addPage();
        }

        const bulletX = MARGIN + 10;
        const textX = MARGIN + 25;
        const textWidth = CONTENT_WIDTH - 25;

        doc.circle(bulletX, doc.y + 5, 2).fill("#6b7280");

        doc.fillColor("#374151").text(item, textX, doc.y, {
          width: textWidth,
          align: "left",
        });

        doc.moveDown(0.3);
      }

      doc.moveDown(1);
    }

    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);

      doc
        .fontSize(9)
        .fillColor("#9ca3af")
        .text(
          `${tenantName} | Page ${i + 1} of ${pages.count}`,
          MARGIN,
          PAGE_HEIGHT - MARGIN + 20,
          { align: "center", width: CONTENT_WIDTH }
        );
    }

    doc.end();
  });
}

export function parseDocumentResponse(response: string): GeneratedDocument {
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No valid JSON found in response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  if (!parsed.title || typeof parsed.title !== "string") {
    throw new Error("Invalid document: missing title");
  }

  if (!Array.isArray(parsed.sections)) {
    throw new Error("Invalid document: sections must be an array");
  }

  const sections: DocumentSection[] = parsed.sections.map(
    (s: { heading?: string; content?: string[]; timestamp?: string }) => {
      if (!s.heading || typeof s.heading !== "string") {
        throw new Error("Invalid section: missing heading");
      }
      if (!Array.isArray(s.content)) {
        throw new Error("Invalid section: content must be an array");
      }
      return {
        heading: s.heading,
        content: s.content.map((c: unknown) => String(c)),
        timestamp: s.timestamp,
      };
    }
  );

  return {
    title: parsed.title,
    sections,
  };
}
