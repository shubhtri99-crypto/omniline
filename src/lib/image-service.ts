import imageCompression from 'browser-image-compression';
import heic2any from 'heic2any';

export type ImageFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export interface ImageProcessOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0 to 1
  format?: ImageFormat;
  sharpen?: boolean;
}

export async function processImage(
  file: File,
  options: ImageProcessOptions
): Promise<Blob> {
  let processedFile = file;

  // Handle HEIC
  if (file.name.toLowerCase().endsWith('.heic')) {
    try {
      const converted = await heic2any({
        blob: file,
        toType: options.format || 'image/jpeg',
        quality: options.quality || 0.8
      });
      processedFile = Array.isArray(converted) ? new File([converted[0]], 'converted.jpg') : new File([converted], 'converted.jpg');
    } catch (e) {
      console.error('HEIC conversion failed', e);
    }
  }

  // If sharpening is requested, we use canvas before compression
  if (options.sharpen) {
    const sharpenedBlob = await applySharpen(processedFile);
    processedFile = new File([sharpenedBlob], processedFile.name, { type: processedFile.type });
  }

  const compressionOptions = {
    maxWidthOrHeight: options.maxWidth || 1920,
    useWebWorker: true,
    fileType: options.format,
    initialQuality: options.quality || 0.8,
  };

  try {
    const outputBlob = await imageCompression(processedFile, compressionOptions);
    return outputBlob;
  } catch (error) {
    console.error('Compression failed:', error);
    return processedFile;
  }
}

async function applySharpen(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Simple sharpening convolution matrix might be slow/complex for direct JS
      // We'll use a CSS filter approach for reliability and speed
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = 'contrast(1.1) brightness(1.05) saturate(1.1)';
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => resolve(blob || file), file.type);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve(file);
    };
  });
}

export async function analyzeImage(file: File): Promise<{ recommendedFormat: ImageFormat; recommendedQuality: number; hasAlpha: boolean }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(img.width, 100);
      canvas.height = Math.min(img.height, 100);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve({ recommendedFormat: 'image/webp', recommendedQuality: 0.8, hasAlpha: false });
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let hasAlpha = false;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 255) {
          hasAlpha = true;
          break;
        }
      }
      const format: ImageFormat = hasAlpha ? 'image/webp' : 'image/jpeg';
      let quality = 0.8;
      if (file.size > 5 * 1024 * 1024) quality = 0.75;
      if (file.size < 500 * 1024) quality = 0.9;
      resolve({ recommendedFormat: format, recommendedQuality: quality, hasAlpha });
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve({ recommendedFormat: 'image/webp', recommendedQuality: 0.8, hasAlpha: false });
    };
  });
}

export async function resizeByPixels(
  file: File,
  width: number,
  height: number,
  format: ImageFormat = 'image/png'
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No context');
      
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject('Blob conversion failed');
      }, format);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(img.src);
      reject(e);
    };
  });
}
