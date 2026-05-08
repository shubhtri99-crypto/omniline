import React, { useState, useEffect } from 'react';
import { FileUp, FileDown, Maximize, Loader2, Files, X, Trash2, AlertCircle } from 'lucide-react';
import { Card, Button, Input, cn } from './ui/Base';
import { resizePdf, PAGE_SIZES, getPdfDimensions, pdfToImages, PdfOutputFormat } from '../lib/pdf-service';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'motion/react';
import JSZip from 'jszip';

export default function PdfTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [outputFormat, setOutputFormat] = useState<PdfOutputFormat>('pdf');
  const [isResizingNecessary, setIsResizingNecessary] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState(false);
  const [targetSize, setTargetSize] = useState<string>('A4');
  const [customSize, setCustomSize] = useState({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [scaleContent, setScaleContent] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkNecessity();
    }, 500);
    return () => clearTimeout(timer);
  }, [files, targetSize, customSize]);

  const checkNecessity = async () => {
    if (files.length === 0) return;
    try {
      const dimensions = await getPdfDimensions(files[0]);
      const target = targetSize === 'CUSTOM' 
        ? [customSize.width || dimensions[0], customSize.height || dimensions[1]] 
        : PAGE_SIZES[targetSize as keyof typeof PAGE_SIZES];
      
      const isSame = Math.abs(dimensions[0] - target[0]) < 2 && Math.abs(dimensions[1] - target[1]) < 2;
      setIsResizingNecessary(!isSame);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = (Array.from(e.target.files) as File[]).filter(f => f.type === 'application/pdf');
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const uploadedFiles = (Array.from(e.dataTransfer.files) as File[]).filter(f => f.type === 'application/pdf');
    if (uploadedFiles.length > 0) {
      setFiles(prev => [...prev, ...uploadedFiles]);
    } else {
      alert('Please drop valid PDF files.');
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => setFiles([]);

  const handleProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const size = targetSize === 'CUSTOM' ? [customSize.width, customSize.height] : PAGE_SIZES[targetSize as keyof typeof PAGE_SIZES];
      
      if (files.length === 1) {
        const result = await resizePdf(files[0], size as [number, number], scaleContent);
        if (outputFormat === 'pdf') {
          saveAs(new Blob([result], { type: 'application/pdf' }), `resized-${files[0].name}`);
        } else {
          const images = await pdfToImages(result, outputFormat === 'png' ? 'image/png' : 'image/jpeg');
          if (images.length === 1) {
            saveAs(images[0], `${files[0].name.split('.')[0]}.${outputFormat}`);
          } else {
            const zip = new JSZip();
            images.forEach((blob, idx) => {
              zip.file(`page-${idx + 1}.${outputFormat}`, blob);
            });
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `${files[0].name.split('.')[0]}-images.zip`);
          }
        }
      } else {
        const zip = new JSZip();
        for (const file of files) {
          const result = await resizePdf(file, size as [number, number], scaleContent);
          
          if (outputFormat === 'pdf') {
            zip.file(`resized-${file.name}`, result);
          } else {
            const images = await pdfToImages(result, outputFormat === 'png' ? 'image/png' : 'image/jpeg');
            const fileFolder = zip.folder(file.name.split('.')[0]);
            images.forEach((blob, idx) => {
              fileFolder?.file(`page-${idx + 1}.${outputFormat}`, blob);
            });
          }
        }
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, outputFormat === 'pdf' ? 'resized-pdfs.zip' : 'converted-pdf-images.zip');
      }
    } catch (error) {
      console.error(error);
      alert('Error processing PDF(s)');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <Files className="w-5 h-5 text-blue-400" />
          <h2 className="font-sans font-semibold text-lg">PDF Resizer</h2>
        </div>

        <div 
          className={cn(
            "border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-4 transition-all",
            isDragging ? "border-blue-400 bg-blue-500/10 scale-[0.98]" : "border-white/10",
            files.length > 0 ? "border-blue-500/30 bg-blue-500/5" : "hover:bg-white/5 hover:border-white/20"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input type="file" accept=".pdf" multiple onChange={handleFileChange} className="hidden" id="pdf-upload" />
          <label htmlFor="pdf-upload" className="flex flex-col items-center cursor-pointer group text-center w-full">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-2 border border-white/10 group-hover:scale-110 transition-transform">
              <FileUp className="w-8 h-8 text-blue-400" />
            </div>
            <span className="mt-2 font-semibold text-sm">
              {files.length > 0 ? `${files.length} PDF(s) Selected` : "Drop PDFs here or click"}
            </span>
            <span className="text-[10px] text-white/40 mt-1 uppercase tracking-wider">Supports batch uploading</span>
          </label>
        </div>

        {files.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Queue</span>
              <button 
                onClick={clearFiles}
                className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Clear All
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto pr-2 flex flex-col gap-2 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {files.map((f) => (
                  <motion.div 
                    key={`${f.name}-${f.size}-${f.lastModified}`}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, scale: 0.95 }}
                    className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5 group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Files className="w-3 h-3 text-blue-400 shrink-0" />
                      <span className="text-xs truncate opacity-70 italic">{f.name}</span>
                    </div>
                    <button 
                      onClick={() => setFiles(prev => prev.filter(file => file !== f))}
                      className="p-1 hover:bg-white/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3 h-3 text-white/40" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Paper Size</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(PAGE_SIZES).map(size => (
                <button
                  key={size}
                  onClick={() => setTargetSize(size)}
                  className={`
                    px-4 py-2 text-[10px] font-bold uppercase tracking-wider border rounded-xl transition-all
                    ${targetSize === size ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}
                  `}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {targetSize === 'CUSTOM' && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="grid grid-cols-2 gap-4 overflow-hidden"
              >
                <Input 
                  label="Width (points)" 
                  type="number" 
                  value={customSize.width} 
                  onChange={e => setCustomSize({...customSize, width: Number(e.target.value)})}
                />
                <Input 
                  label="Height (points)" 
                  type="number" 
                  value={customSize.height} 
                  onChange={e => setCustomSize({...customSize, height: Number(e.target.value)})}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3 mt-2 bg-white/5 p-3 rounded-xl border border-white/5">
            <input 
              type="checkbox" 
              id="scale" 
              checked={scaleContent} 
              onChange={e => setScaleContent(e.target.checked)}
              className="w-4 h-4 accent-blue-500 rounded border-white/20 bg-white/5"
            />
            <label htmlFor="scale" className="text-xs font-semibold text-white/70 cursor-pointer select-none">Scale content to fit</label>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Output Format</label>
            <div className="grid grid-cols-3 gap-2">
              {(['pdf', 'png', 'jpeg'] as PdfOutputFormat[]).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setOutputFormat(fmt)}
                  className={`
                    px-4 py-2 text-[10px] font-bold uppercase tracking-wider border rounded-xl transition-all
                    ${outputFormat === fmt ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}
                  `}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button 
          disabled={files.length === 0 || isProcessing} 
          onClick={handleProcess}
          className="w-full flex items-center justify-center gap-2 mt-2"
        >
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          {isProcessing ? `Processing ${files.length} File(s)...` : `Resize & Download ${files.length > 1 ? `(${files.length})` : ""}`}
        </Button>

        <AnimatePresence>
          {!isResizingNecessary && files.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 overflow-hidden"
            >
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-[10px] text-amber-200/70 font-bold leading-tight uppercase italic whitespace-pre-line">
                System Alert: Input dimensions match target. 
                Resizing may be redundant.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <Card className="bg-gradient-to-br from-white/10 to-white/5 border-white/10 text-white flex flex-col justify-between">
        <div>
          <h3 className="font-sans font-bold text-xl mb-6 italic tracking-tight underline decoration-blue-500/50 decoration-2 underline-offset-8">Understanding Dimensions</h3>
          <ul className="space-y-6 text-sm">
            <li className="flex gap-4">
              <span className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 border border-blue-500/20">01</span>
              <div>
                <p className="font-bold text-white mb-1">Point (pt) System</p>
                <p className="text-white/50 leading-relaxed">PDFs use technical points. 1 inch = 72 points. Standard A4 is 595 x 842 pt.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 border border-blue-500/20">02</span>
              <div>
                <p className="font-bold text-white mb-1">Scaling Content</p>
                <p className="text-white/50 leading-relaxed">Proportional scaling ensures visual integrity. Your content is matched to the new canvas size dynamically.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 border border-blue-500/20">03</span>
              <div>
                <p className="font-bold text-white mb-1">Strict Isolation</p>
                <p className="text-white/50 leading-relaxed">Encrypted local session. No cloud storage. No telemetry. Your data is yours alone.</p>
              </div>
            </li>
          </ul>
        </div>
        
        <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
            <Maximize className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Protocol v4.2</p>
            <p className="text-[10px] font-bold text-blue-400">ENGINE ACTIVE</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
