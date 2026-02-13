import mammoth from "mammoth";
import * as XLSX from "xlsx";

const MAX_EXTRACTED_LENGTH = 50_000; // 50K chars max per document

export type ExtractionResult = {
  text: string | null;
  charCount: number;
  wasTruncated: boolean;
  error?: string;
};

/**
 * Extracts text content from uploaded documents for AI context injection.
 * Supports: PDF, DOCX, XLSX/XLS/CSV, and plain text files.
 * Images are skipped (no OCR).
 */
export async function extractTextFromFile(
  buffer: ArrayBuffer,
  mimeType: string,
  _filename: string
): Promise<ExtractionResult> {
  try {
    let text: string | null = null;

    if (mimeType === "application/pdf") {
      text = await extractFromPDF(buffer);
    } else if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword"
    ) {
      text = await extractFromDocx(buffer);
    } else if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      mimeType === "application/vnd.ms-excel" ||
      mimeType === "text/csv"
    ) {
      text = await extractFromSpreadsheet(buffer);
    } else if (mimeType.startsWith("text/")) {
      text = new TextDecoder().decode(buffer);
    }
    // Images, presentations, and other binary formats: no extraction

    if (!text || text.trim().length === 0) {
      return { text: null, charCount: 0, wasTruncated: false };
    }

    text = text.trim();
    const wasTruncated = text.length > MAX_EXTRACTED_LENGTH;
    const finalText = wasTruncated
      ? text.slice(0, MAX_EXTRACTED_LENGTH)
      : text;

    return {
      text: finalText,
      charCount: finalText.length,
      wasTruncated,
    };
  } catch (error) {
    return {
      text: null,
      charCount: 0,
      wasTruncated: false,
      error: error instanceof Error ? error.message : "Text extraction failed",
    };
  }
}

async function extractFromPDF(buffer: ArrayBuffer): Promise<string | null> {
  // Lazy-load pdf-parse to avoid DOMMatrix error at module init time
  // pdf-parse is listed in serverExternalPackages in next.config.ts
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse") as (dataBuffer: Buffer) => Promise<{ text: string }>;
  const result = await pdfParse(Buffer.from(buffer));
  return result.text?.trim() || null;
}

async function extractFromDocx(buffer: ArrayBuffer): Promise<string | null> {
  const result = await mammoth.extractRawText({
    buffer: Buffer.from(buffer),
  });
  return result.value?.trim() || null;
}

async function extractFromSpreadsheet(
  buffer: ArrayBuffer
): Promise<string | null> {
  const workbook = XLSX.read(buffer, { type: "array" });
  const lines: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    lines.push(`--- Sheet: ${sheetName} ---`);
    const csv = XLSX.utils.sheet_to_csv(sheet);
    lines.push(csv);
  }

  const text = lines.join("\n").trim();
  return text || null;
}
