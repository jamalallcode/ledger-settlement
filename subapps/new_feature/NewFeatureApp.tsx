import React, { useState, useRef } from 'react';
import './style.css';
import { useNavigate } from 'react-router-dom';
import { Home, Sparkles, Rocket, Shield, Zap, Upload, FileText, Copy, Check, Loader2, Image as ImageIcon, Trash2, XCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const NewFeatureApp: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newFiles = [...selectedFiles, ...files];
      setSelectedFiles(newFiles);
      
      const newUrls = files.map((file: File) => URL.createObjectURL(file));
      setPreviewUrls([...previewUrls, ...newUrls]);
      setOcrResult(null);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const filesList = Array.from(e.dataTransfer.files);
    const files: File[] = filesList.filter((file: any) => file.type.startsWith('image/')) as File[];
    if (files.length > 0) {
      const newFiles = [...selectedFiles, ...files];
      setSelectedFiles(newFiles);
      
      const newUrls = files.map((file: File) => URL.createObjectURL(file));
      setPreviewUrls([...previewUrls, ...newUrls]);
      setOcrResult(null);
      setError(null);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);

    const newUrls = [...previewUrls];
    URL.revokeObjectURL(newUrls[index]);
    newUrls.splice(index, 1);
    setPreviewUrls(newUrls);
    
    if (newFiles.length === 0) {
      setOcrResult(null);
      setError(null);
    }
  };

  const clearFiles = () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setOcrResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const performOCR = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      let combinedResult = "";

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Convert file to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(file);
        });

        const base64Data = await base64Promise;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            {
              parts: [
                { text: `Please extract all text from this image accurately. This is document ${i + 1} of ${selectedFiles.length}. Maintain the original formatting.` },
                {
                  inlineData: {
                    mimeType: file.type,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
        });

        const text = response.text || "No text found.";
        combinedResult += `--- ডকুমেন্ট ${i + 1} ---\n\n${text}\n\n`;
      }

      setOcrResult(combinedResult.trim());
    } catch (err) {
      console.error("OCR Error:", err);
      setError("OCR প্রক্রিয়াকরণে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (ocrResult) {
      navigator.clipboard.writeText(ocrResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="new-feature-root h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
      {/* Main Content */}
      <main className="flex-1 overflow-hidden p-4 md:p-6">
        <div className="max-w-6xl mx-auto h-full flex flex-col space-y-4">
          {/* Header Section - Premium with Side Menus */}
          <div className="flex items-center justify-between gap-4 shrink-0 mb-2">
            {/* Left Menu Bar */}
            <div className="flex-1 flex justify-start">
              <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-4 backdrop-blur-md shadow-2xl">
                <button 
                  onClick={() => navigate('/')}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white group"
                  title="হোম"
                >
                  <Home size={20} />
                </button>
              </div>
            </div>

            {/* Center Title Section */}
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-600/10 text-blue-400 rounded-full border border-blue-500/20 text-[9px] font-black uppercase tracking-widest">
                <Zap size={10} /> Powered by Gemini AI
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter leading-tight">
                স্মার্ট ডকুমেন্ট <span className="text-blue-500">OCR</span>
              </h1>
              <p className="text-slate-400 text-[11px] font-medium max-w-xl mx-auto">
                যেকোনো ছবি আপলোড করুন এবং মুহূর্তেই সেটিকে এডিটেবল টেক্সটে রূপান্তর করুন।
              </p>
            </div>

            {/* Right Menu Bar */}
            <div className="flex-1 flex justify-end">
              <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-4 backdrop-blur-md shadow-2xl min-w-[60px] h-[52px]">
                {/* Future options here */}
              </div>
            </div>
          </div>

          {/* Grid Section - Compact */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 min-h-0">
            {/* Upload Section - Sidebar */}
            <div className="flex flex-col space-y-3 min-h-0">
              <div 
                className={`relative group flex-1 border-2 border-dashed rounded-2xl transition-all flex flex-col items-center justify-center p-4 text-center overflow-hidden
                  ${selectedFiles.length > 0 ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10 bg-white/5 hover:border-blue-500/30 hover:bg-white/10'}`}
              >
                {previewUrls.length > 0 ? (
                  <div className="absolute inset-0 w-full h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2 no-scrollbar">
                      {previewUrls.map((url, idx) => (
                        <div key={idx} className="relative aspect-square bg-slate-900 rounded-lg border border-white/10 overflow-hidden group/item">
                          <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                            className="absolute top-1 right-1 p-1 bg-red-600/80 text-white rounded-md opacity-0 group-hover/item:opacity-100 transition-opacity"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="p-2 bg-slate-900/80 backdrop-blur-md border-t border-white/10 flex items-center justify-center gap-2">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 bg-white text-slate-900 rounded-md font-black text-[9px] shadow-xl hover:scale-105 transition-transform"
                      >
                        আরো যোগ করুন
                      </button>
                      <button 
                        onClick={clearFiles}
                        className="px-2.5 py-1 bg-red-600 text-white rounded-md font-black text-[9px] shadow-xl hover:scale-105 transition-transform"
                      >
                        সব মুছুন
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-blue-600/20 text-blue-500 rounded-lg flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Upload size={18} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black mb-0.5">ফাইল ড্র্যাগ করুন</h3>
                      <p className="text-slate-500 font-bold text-[9px]">অথবা কম্পিউটার থেকে সিলেক্ট করুন</p>
                    </div>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-md font-black text-[9px] shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-all"
                    >
                      ফাইল সিলেক্ট
                    </button>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  multiple
                  className="hidden" 
                />
              </div>

              <button 
                onClick={performOCR}
                disabled={selectedFiles.length === 0 || isProcessing}
                className={`w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-xl shrink-0
                  ${selectedFiles.length === 0 || isProcessing 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-900/40 hover:-translate-y-0.5 active:scale-[0.98]'}`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> প্রসেসিং...
                  </>
                ) : (
                  <>
                    <Zap size={14} /> রূপান্তর করুন ({selectedFiles.length})
                  </>
                )}
              </button>
            </div>

            {/* Result Section - Compact & Scrollable */}
            <div className="flex flex-col min-h-0">
              <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col relative">
                <div className="px-5 py-2.5 border-b border-white/5 flex items-center justify-between bg-white/5 shrink-0">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-blue-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Extracted Text</span>
                  </div>
                  {ocrResult && (
                    <button 
                      onClick={copyToClipboard}
                      className="p-1 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-white"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
                
                <div className="flex-1 p-5 overflow-y-auto no-scrollbar">
                  {error ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-300">
                      <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center border border-red-500/20">
                        <XCircle size={32} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-black text-red-500">প্রসেসিং ব্যর্থ হয়েছে</h3>
                        <p className="text-slate-400 text-[11px] font-medium max-w-[200px] mx-auto">
                          {error}
                        </p>
                      </div>
                      <button 
                        onClick={performOCR}
                        className="px-4 py-1.5 bg-red-600 text-white rounded-lg font-black text-[10px] shadow-lg shadow-red-900/20 hover:bg-red-700 transition-all active:scale-95"
                      >
                        আবার চেষ্টা করুন
                      </button>
                    </div>
                  ) : ocrResult ? (
                    <div className="text-slate-200 font-medium leading-relaxed whitespace-pre-wrap text-[13px]">
                      {ocrResult}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
                      <div className="w-10 h-10 border-2 border-dashed border-slate-800 rounded-lg flex items-center justify-center">
                        <ImageIcon size={18} />
                      </div>
                      <p className="font-bold text-[10px]">এখানে টেক্সট দেখা যাবে</p>
                    </div>
                  )}
                </div>

                {isProcessing && (
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-2 animate-in fade-in duration-300">
                    <div className="relative">
                      <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles size={16} className="text-blue-500 animate-pulse" />
                      </div>
                    </div>
                    <p className="font-black text-[10px] text-blue-400 animate-pulse">AI টেক্সট রিড করছে...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Background Decoration */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[150px] rounded-full"></div>
      </div>
    </div>
  );
};

export default NewFeatureApp;
