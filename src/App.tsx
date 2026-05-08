import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Files, Image as ImageIcon, Settings2, ShieldCheck, Zap, Globe } from 'lucide-react';
import PdfTool from './components/PdfTool';
import ImageTool from './components/ImageTool';
import Tutorial, { TutorialStep } from './components/Tutorial';
import { cn } from './components/ui/Base';

type ToolType = 'PDF' | 'IMAGE';

const APP_STEPS: TutorialStep[] = [
  {
    title: "Welcome to OmniFile v1.0",
    description: "Your files never leave your browser. We use local WASM and GPU acceleration for privacy-first document morphing."
  },
  {
    title: "Document Tools",
    description: "The PDF Resizer lets you scale documents to standard paper sizes or custom dimensions for print optimization."
  },
  {
    title: "Visual Assets",
    description: "Our Image Suite handles JPEG, PNG, and HEIC conversion with neural sharpening to maintain visual fidelity."
  },
  {
    title: "Batch Mode",
    description: "Drop multiple files at once. We'll process them in parallel and deliver a neatly packed ZIP file."
  }
];

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolType>('PDF');
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('omni_tutorial_v1');
    if (!hasSeenTutorial) {
      setIsTutorialOpen(true);
    }
  }, []);

  const completeTutorial = () => {
    localStorage.setItem('omni_tutorial_v1', 'true');
    setIsTutorialOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden relative">
      <Tutorial 
        steps={APP_STEPS} 
        isOpen={isTutorialOpen} 
        onComplete={completeTutorial} 
      />
      {/* Immersive Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-slate-950 to-slate-950"></div>
        <div className="absolute top-[-100px] left-[-100px] w-80 h-80 bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-50px] right-[20%] w-96 h-96 bg-purple-600/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-16 border-b border-white/10 flex items-center justify-between px-8 backdrop-blur-md bg-white/5 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-600/20">Ω</div>
          <h1 className="text-xl font-semibold tracking-tight">OmniFile <span className="text-white/40 font-normal">Suite</span></h1>
        </div>

        <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-sm">
          <button 
            onClick={() => setActiveTool('PDF')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2",
              activeTool === 'PDF' ? "bg-white/10 text-white shadow-inner" : "text-white/40 hover:text-white"
            )}
          >
            <Files className="w-3.5 h-3.5" />
            PDF RESIZER
          </button>
          <button 
            onClick={() => setActiveTool('IMAGE')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2",
              activeTool === 'IMAGE' ? "bg-white/10 text-white shadow-inner" : "text-white/40 hover:text-white"
            )}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            IMAGE SUITE
          </button>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-white/20">
            <span>v1.0.4 PRO</span>
            <span className="w-2 h-2 rounded-full bg-green-500/50"></span>
          </div>
          <button 
            onClick={() => setIsTutorialOpen(true)}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-xs font-semibold backdrop-blur-sm transition-all active:scale-95"
          >
            Guide
          </button>
        </div>
      </nav>

      <main className="relative z-10 pt-24 pb-12 px-6 max-w-7xl mx-auto flex flex-col gap-12">
        {/* Hero Section */}
        <section className="flex flex-col gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-2"
          >
            <span className="text-[10px] uppercase tracking-[0.4em] text-blue-400 font-bold">Privacy-First Transformation</span>
            <h1 className="text-5xl md:text-8xl font-sans font-bold tracking-tighter leading-none">
              REDEFINE YOUR <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/20 italic">WORKFLOW</span>
            </h1>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            {[
              { icon: ShieldCheck, label: "Zero Server Logs" },
              { icon: Zap, label: "GPU Accelerated" },
              { icon: Globe, label: "Universal Formats" },
              { icon: Files, label: "Batch Ready" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-sm">
                <item.icon className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Tool Section */}
        <div className="relative min-h-[600px]">
          <AnimatePresence mode="wait">
            {activeTool === 'PDF' && (
              <motion.div
                key="pdf"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <PdfTool />
              </motion.div>
            )}
            {activeTool === 'IMAGE' && (
              <motion.div
                key="image"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ImageTool />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-12 border-t border-[#141414]/10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-2">
            <p className="font-mono text-xs opacity-40 uppercase tracking-widest">OmniFile Engine v1.0.4</p>
            <p className="text-sm opacity-60">High-performance browser-native document transformation suite.</p>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs font-mono uppercase hover:opacity-100 opacity-40 transition-opacity">Privacy</a>
            <a href="#" className="text-xs font-mono uppercase hover:opacity-100 opacity-40 transition-opacity">Docs</a>
            <a href="#" className="text-xs font-mono uppercase hover:opacity-100 opacity-40 transition-opacity">Github</a>
          </div>
        </footer>
      </main>

      {/* Mobile Tool Switcher */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-[#141414] shadow-xl p-1.5 rounded-xl flex items-center gap-1 z-50">
        <button 
          onClick={() => setActiveTool('PDF')}
          className={cn(
            "p-3 rounded-lg flex items-center justify-center transition-all",
            activeTool === 'PDF' ? "bg-[#141414] text-white" : "text-gray-400"
          )}
        >
          <Files className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setActiveTool('IMAGE')}
          className={cn(
            "p-3 rounded-lg flex items-center justify-center transition-all",
            activeTool === 'IMAGE' ? "bg-[#141414] text-white" : "text-gray-400"
          )}
        >
          <ImageIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

