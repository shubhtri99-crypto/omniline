import { PDFDocument, PDFPage, degrees } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';

// Configure PDF.js worker
// Using CDN for simplicity in this environment
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export const PAGE_SIZES = {
  A4: [595.28, 841.89],
  A3: [841.89, 1190.55],
  LETTER: [612.0, 792.0],
  LEGAL: [612.0, 1008.0],
  CUSTOM: [0, 0]
};

export type PdfOutputFormat = 'pdf' | 'png' | 'jpeg';

export async function getPdfDimensions(file: File): Promise<[number, number]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const page = pdfDoc.getPage(0);
  const { width, height } = page.getSize();
  return [width, height];
}

export async function resizePdf(
  file: File,
  targetSize: [number, number],
  scaleContent: boolean = true
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const newPdfDoc = await PDFDocument.create();
  
  const pages = pdfDoc.getPages();
  
  for (const page of pages) {
    const { width, height } = page.getSize();
    const [targetWidth, targetHeight] = targetSize;
    
    const newNodePage = newPdfDoc.addPage([targetWidth, targetHeight]);
    
    const embeddedPage = await newPdfDoc.embedPage(page);
    
    if (scaleContent) {
      const scaleX = targetWidth / width;
      const scaleY = targetHeight / height;
      const scale = Math.min(scaleX, scaleY);
      
      const newWidth = width * scale;
      const newHeight = height * scale;
      
      const x = (targetWidth - newWidth) / 2;
      const y = (targetHeight - newHeight) / 2;
      
      newNodePage.drawPage(embeddedPage, {
        width: newWidth,
        height: newHeight,
        x,
        y,
      });
    } else {
      newNodePage.drawPage(embeddedPage, {
        width,
        height,
        x: 0,
        y: targetHeight - height,
      });
    }
  }
  
  return await newPdfDoc.save();
}

export async function pdfToImages(
  pdfData: Uint8Array,
  format: 'image/png' | 'image/jpeg' = 'image/png',
  scale: number = 2 // Upscale for better quality
): Promise<Blob[]> {
  const loadingTask = pdfjs.getDocument({ data: pdfData });
  const pdf = await loadingTask.promise;
  const imageBlobs: Blob[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), format, 0.95);
    });

    if (blob) imageBlobs.push(blob);
  }

  return imageBlobs;
}
