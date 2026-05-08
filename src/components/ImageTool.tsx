import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Download, Loader2, RefreshCw, Layers, X, Trash2, Wand2 } from 'lucide-react';
import { Card, Button, Input, cn } from './ui/Base';
import { processImage, ImageFormat, analyzeImage } from '../lib/image-service';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { motion, AnimatePresence } from 'motion/react';

const FORMATS: { label: string; value: ImageFormat }[] = [
  { label: 'JPEG', value: 'image/jpeg' },
  { label: 'PNG', value: 'image/png' },
  { label: 'WebP', value: 'image/webp' },
];

const PRESETS = [
  { label: 'High Fidelity', quality: 0.95, maxWidth: 2560, sharpen: true, description: 'Lossless-grade quality' },
  { label: 'Balanced', quality: 0.8, maxWidth: 1920, sharpen: true, description: 'Optimal for general use' },
  { label: 'Compact', quality: 0.55, maxWidth: 1024, sharpen: false, description: 'Smallest file size' },
];

export default function ImageTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [format, setFormat] = useState<ImageFormat>('image/webp');
  const [quality, setQuality] = useState(0.8);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [sharpen, setSharpen] = useState(false);
  const [autoOptimize, setAutoOptimize] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const previewsRef = React.useRef<string[]>([]);

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    if (autoOptimize && files.length > 0) {
      handleAutoDetect();
    }
  }, [files, autoOptimize]);

  const handleAutoDetect = async () => {
    if (files.length === 0) return;
    // Analyze the first file for batch recommendation
    const recommendation = await analyzeImage(files[0]);
    setFormat(recommendation.recommendedFormat);
    setQuality(recommendation.recommendedQuality);
    setSharpen(recommendation.hasAlpha ? false : true); // Sharpen photos, leave graphics clean
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = (Array.from(e.target.files) as File[]).filter(f => 
        f.type.startsWith('image/') || f.name.toLowerCase().endsWith('.heic')
      );
      const newPreviews = newFiles.map(f => URL.createObjectURL(f));
      setFiles(prev => [...prev, ...newFiles]);
      setPreviews(prev => [...prev, ...newPreviews]);
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
    const uploadedFiles = (Array.from(e.dataTransfer.files) as File[]).filter(f => f.type.startsWith('image/') || f.name.toLowerCase().endsWith('.heic'));
    if (uploadedFiles.length > 0) {
      const newPreviews = uploadedFiles.map(f => URL.createObjectURL(f));
      setFiles(prev => [...prev, ...uploadedFiles]);
      setPreviews(prev => [...prev, ...newPreviews]);
    } else {
      alert('Please drop valid image files.');
    }
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    previews.forEach(url => URL.revokeObjectURL(url));
    setFiles([]);
    setPreviews([]);
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const ext = format.split('/')[1];
      
      if (files.length === 1) {
        const blob = await processImage(files[0], {
          format,
          quality,
          maxWidth,
          sharpen
        });
        saveAs(blob, `optimized-${files[0].name.split('.')[0]}.${ext}`);
      } else {
        const zip = new JSZip();
        for (const file of files) {
          const blob = await processImage(file, {
            format,
            quality,
            maxWidth,
            sharpen
          });
          zip.file(`optimized-${file.name.split('.')[0]}.${ext}`, blob);
        }
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, 'optimized-images.zip');
      }
    } catch (error) {
      console.error(error);
      alert('Error processing image(s)');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card className="h-full flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <ImageIcon className="w-5 h-5 text-blue-400" />
            <h2 className="font-sans font-semibold text-lg">Image Suite</h2>
          </div>

          <div 
            className={cn(
              "relative border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all overflow-hidden",
              isDragging ? "border-blue-400 bg-blue-500/10 scale-[0.99]" : "border-white/10",
              files.length > 0 ? "border-solid p-4 border-white/10 bg-white/5 min-h-[400px]" : "hover:border-blue-500/50 hover:bg-white/5 p-12 min-h-[400px]"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {files.length > 0 ? (
              <div className="w-full h-full flex flex-col gap-4">
                <div className="flex justify-between items-center bg-slate-900 border border-white/10 p-3 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{files.length} Assets in Queue</span>
                  <div className="flex gap-2">
                    <label htmlFor="img-upload-more" className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-white/20 cursor-pointer transition-colors">
                      Add More
                    </label>
                    <button 
                      onClick={clearFiles}
                      className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      Clear
                    </button>
                    <input type="file" accept="image/*,.heic" multiple onChange={handleFileChange} className="hidden" id="img-upload-more" />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  <AnimatePresence mode="popLayout">
                    {previews.map((p, i) => (
                      <motion.div 
                        key={p} 
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="relative group aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/20"
                      >
                        <img src={p} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => removeFile(i)}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-white/20 hover:bg-red-500/20"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <>
                <input type="file" accept="image/*,.heic" multiple onChange={handleFileChange} className="hidden" id="img-upload" />
                <label htmlFor="img-upload" className="flex flex-col items-center cursor-pointer group text-center">
                  <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 border border-white/10 group-hover:scale-110 transition-transform">
                    <RefreshCw className="w-10 h-10 text-blue-400" />
                  </div>
                  <span className="mt-2 font-semibold text-sm">Upload Visual Assets</span>
                  <span className="text-[10px] text-white/40 mt-1 uppercase tracking-wider italic">Batch support active</span>
                </label>
              </>
            )}
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Layers className="w-4 h-4 text-white/30" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Transmission Config</span>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-blue-100 italic">Auto-Optimize</span>
              </div>
              <input 
                type="checkbox" 
                checked={autoOptimize} 
                onChange={e => setAutoOptimize(e.target.checked)}
                className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
              />
            </div>

            <div className={cn("flex flex-col gap-6 transition-all", autoOptimize && "opacity-40 pointer-events-none grayscale")}>
              <div className="flex flex-col gap-3">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Preset Profile</label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESETS.map(p => (
                    <button
                      key={p.label}
                      onClick={() => {
                        setQuality(p.quality);
                        setMaxWidth(p.maxWidth);
                        setSharpen(p.sharpen);
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 border rounded-xl transition-all group",
                        quality === p.quality && maxWidth === p.maxWidth && sharpen === p.sharpen
                          ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20"
                          : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Target Encoding</label>
              <div className="grid grid-cols-3 gap-2">
                {FORMATS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFormat(f.value)}
                    className={`
                      px-2 py-2 text-[10px] font-bold uppercase tracking-wider border rounded-xl transition-all
                      ${format === f.value ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}
                    `}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Bitrate Quality</label>
                <span className="text-[10px] font-bold text-blue-400">{Math.round(quality * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0.1" 
                max="1" 
                step="0.05"
                value={quality}
                onChange={e => setQuality(Number(e.target.value))}
                className="w-full accent-blue-500 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
              />
            </div>

            <Input 
              label="Horizontal Resolution" 
              type="number" 
              value={maxWidth}
              onChange={e => setMaxWidth(Number(e.target.value))}
            />

            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
              <input 
                type="checkbox" 
                id="sharpen" 
                checked={sharpen} 
                onChange={e => setSharpen(e.target.checked)}
                className="w-4 h-4 accent-blue-500 rounded border-white/20 bg-white/5"
              />
              <label htmlFor="sharpen" className="text-xs font-semibold text-white/70 cursor-pointer select-none">Neural Enhance (Sharpen)</label>
            </div>
          </div>
        </div>

          <Button 
            disabled={files.length === 0 || isProcessing} 
            onClick={handleProcess}
            className="w-full flex items-center justify-center gap-2"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isProcessing ? `Processing ${files.length} Assets...` : `Process & Download ${files.length > 1 ? `(${files.length})` : ""}`}
          </Button>
        </Card>

        <Card className="bg-blue-900/20 border-blue-500/20 shadow-none">
          <p className="text-xs text-blue-200 leading-relaxed font-sans italic opacity-80">
            "Preserving dynamic range and spatial frequency is our priority. 
            WebP encoding is optimal for low-latency web distribution."
          </p>
        </Card>
      </div>
    </div>
  );
}
