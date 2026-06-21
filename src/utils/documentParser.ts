import mammoth from "mammoth";
import * as XLSX from "xlsx";

// 1. Dynamic PDF.js loader and extractor
export const extractTextFromPdf = async (file: File): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if pdfjsLib is already loaded
      if (!(window as any).pdfjsLib) {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
        script.onload = async () => {
          (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
          resolve(await runPdfExtraction(file));
        };
        script.onerror = () => reject(new Error("Gagal mengunduh library PDF parser dari CDN."));
        document.head.appendChild(script);
      } else {
        resolve(await runPdfExtraction(file));
      }
    } catch (err) {
      reject(err);
    }
  });
};

const runPdfExtraction = async (file: File): Promise<string> => {
  const fileReader = new FileReader();
  return new Promise((resolve, reject) => {
    fileReader.onload = async function() {
      try {
        const typedarray = new Uint8Array(this.result as ArrayBuffer);
        const pdfjsLib = (window as any).pdfjsLib;
        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(" ");
          fullText += pageText + "\n";
        }

        resolve(fullText);
      } catch (e) {
        reject(new Error("Error saat mengekstrak PDF: " + (e as Error).message));
      }
    };
    fileReader.onerror = () => reject(new Error("Gagal membaca file PDF."));
    fileReader.readAsArrayBuffer(file);
  });
};

// 2. Word .docx loader and extractor
export const extractTextFromDocx = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (err: any) {
    throw new Error(`Gagal mengekstrak DOCX: ${err.message}`);
  }
};

// 3. Excel .xlsx loader and extractor
export const extractTextFromXlsx = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    let textOut = "";

    workbook.SheetNames.forEach((sheetName) => {
      textOut += `[SHEET: ${sheetName}]\n`;
      const worksheet = workbook.Sheets[sheetName];
      // Convert to grid-like csv representation for human-readable / AI consumption
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      textOut += csv + "\n\n";
    });

    return textOut.trim();
  } catch (err: any) {
    throw new Error(`Gagal mengekstrak XLSX: ${err.message}`);
  }
};

// 4. Text .txt loader and extractor
export const extractTextFromTxt = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Gagal membaca file TXT."));
    reader.readAsText(file);
  });
};

// Master Parser Selector
export const extractDocumentText = async (file: File): Promise<string> => {
  const extension = file.name.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "txt":
      return await extractTextFromTxt(file);
    case "docx":
      return await extractTextFromDocx(file);
    case "xlsx":
    case "xls":
      return await extractTextFromXlsx(file);
    case "pdf":
      return await extractTextFromPdf(file);
    default:
      // Try reading as raw text for safety
      return await extractTextFromTxt(file);
  }
};

// 5. Visual Diffs Generator
// Matches paragraphs line-by-line of Text A vs Text B
// and marks changes (additions, deletions, modifications)
export interface DiffLine {
  id: string;
  type: "added" | "deleted" | "modified" | "same";
  textA?: string;
  textB?: string;
}

export const generateVisualDiffs = (textA: string, textB: string): DiffLine[] => {
  const cleanA = textA ? textA.split("\n").map(l => l.trim()).filter(l => l.length > 0) : [];
  const cleanB = textB ? textB.split("\n").map(l => l.trim()).filter(l => l.length > 0) : [];

  const maxLines = Math.max(cleanA.length, cleanB.length);
  const diffLines: DiffLine[] = [];

  for (let i = 0; i < maxLines; i++) {
    const lineA = cleanA[i];
    const lineB = cleanB[i];

    if (lineA !== undefined && lineB !== undefined) {
      if (lineA === lineB) {
        diffLines.push({
          id: `line-${i}`,
          type: "same",
          textA: lineA,
          textB: lineB
        });
      } else {
        // Simple comparison: check if it's a small modification vs completely different
        diffLines.push({
          id: `line-${i}`,
          type: "modified",
          textA: lineA,
          textB: lineB
        });
      }
    } else if (lineA !== undefined) {
      diffLines.push({
        id: `line-${i}`,
        type: "deleted",
        textA: lineA,
        textB: ""
      });
    } else if (lineB !== undefined) {
      diffLines.push({
        id: `line-${i}`,
        type: "added",
        textA: "",
        textB: lineB
      });
    }
  }

  return diffLines;
};
