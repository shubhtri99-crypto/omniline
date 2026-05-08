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
  scaleContent: boolean = true,
  rotation: number = 0
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const newPdfDoc = await PDFDocument.create();
  
  const pages = pdfDoc.getPages();
  
  for (const page of pages) {
    const { width, height } = page.getSize();
    const [targetWidth, targetHeight] = targetSize;
    
    // If targetSize is [0, 0], we use the original size (but maybe rotated)
    const effectiveTargetWidth = targetWidth === 0 ? (rotation % 180 === 0 ? width : height) : targetWidth;
    const effectiveTargetHeight = targetHeight === 0 ? (rotation % 180 === 0 ? height : width) : targetHeight;

    const newNodePage = newPdfDoc.addPage([effectiveTargetWidth, effectiveTargetHeight]);
    
    const embeddedPage = await newPdfDoc.embedPage(page);
    
    if (scaleContent) {
      const sourceWidth = rotation % 180 === 0 ? width : height;
      const sourceHeight = rotation % 180 === 0 ? height : width;
      
      const scaleX = effectiveTargetWidth / sourceWidth;
      const scaleY = effectiveTargetHeight / sourceHeight;
      const scale = Math.min(scaleX, scaleY);
      
      const drawWidth = width * scale;
      const drawHeight = height * scale;
      
      // Calculate centering with rotation
      let x = (effectiveTargetWidth - (rotation % 180 === 0 ? drawWidth : drawHeight)) / 2;
      let y = (effectiveTargetHeight - (rotation % 180 === 0 ? drawHeight : drawWidth)) / 2;

      // Adjust x, y based on rotation since pdf-lib rotates around the bottom-left of the draw point
      if (rotation === 90) {
        x += drawHeight;
      } else if (rotation === 180) {
        x += drawWidth;
        y += drawHeight;
      } else if (rotation === 270) {
        y += drawWidth;
      }

      newNodePage.drawPage(embeddedPage, {
        width: drawWidth,
        height: drawHeight,
        x,
        y,
        rotate: degrees(rotation),
      });
    } else {
      let x = (effectiveTargetWidth - (rotation % 180 === 0 ? width : height)) / 2;
      let y = (effectiveTargetHeight - (rotation % 180 === 0 ? height : width)) / 2;

      if (rotation === 90) {
        x += height;
      } else if (rotation === 180) {
        x += width;
        y += height;
      } else if (rotation === 270) {
        y += width;
      }

      newNodePage.drawPage(embeddedPage, {
        width,
        height,
        x,
        y,
        rotate: degrees(rotation),
      });
    }
  }
  
  return await newPdfDoc.save();
}

export async function pdfToImages(
  pdfData: Uint8Array,
  format: 'image/png' | 'image/jpeg' = 'image/png',
  options: { scale?: number; quality?: number } = { scale: 2, quality: 0.95 }
): Promise<Blob[]> {
  const loadingTask = pdfjs.getDocument({ data: pdfData });
  const pdf = await loadingTask.promise;
  const imageBlobs: Blob[] = [];
  const { scale = 2, quality = 0.95 } = options;

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
      canvas.toBlob((b) => resolve(b), format, quality);
    });

    if (blob) imageBlobs.push(blob);
  }

  return imageBlobs;
}
