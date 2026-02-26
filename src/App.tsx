/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { toPng } from 'html-to-image';
import { 
  Link as LinkIcon, 
  Download, 
  RefreshCw, 
  Image as ImageIcon, 
  Type as TypeIcon, 
  Palette, 
  Calendar,
  Globe,
  ChevronDown,
  AlertCircle,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface NewsData {
  title: string;
  imageUrl: string;
  logoUrl: string;
  date: string;
  source: string;
}

const GRADIENTS = [
  { id: 'blue-purple', name: 'Blue Purple', class: 'bg-gradient-to-br from-blue-600 to-purple-700' },
  { id: 'red-dark', name: 'Red Dark', class: 'bg-gradient-to-br from-red-600 to-red-900' },
  { id: 'green-teal', name: 'Green Teal', class: 'bg-gradient-to-br from-emerald-600 to-teal-800' },
  { id: 'orange-red', name: 'Orange Red', class: 'bg-gradient-to-br from-orange-500 to-red-600' },
  { id: 'dark-gray', name: 'Dark Gray', class: 'bg-gradient-to-br from-zinc-800 to-black' },
];

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newsData, setNewsData] = useState<NewsData>({
    title: 'আপনার খবরের শিরোনাম এখানে দেখা যাবে',
    imageUrl: 'https://picsum.photos/seed/news/800/450',
    logoUrl: '', // Default empty, will show fallback logo
    date: new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }),
    source: 'news.example.com'
  });
  const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0]);
  const [fontSize, setFontSize] = useState(24);
  
  const cardRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'imageUrl' | 'logoUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewsData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const extractNewsData = async () => {
    if (!url) return;
    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Extract news information from this URL: ${url}. 
        Provide the title in Bengali if possible, a valid image URL from the article, the publication date, and the domain name.`,
        config: {
          tools: [{ urlContext: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              imageUrl: { type: Type.STRING },
              date: { type: Type.STRING },
              source: { type: Type.STRING },
            },
            required: ["title", "imageUrl", "source"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      setNewsData(prev => ({
        ...prev,
        title: data.title || 'শিরোনাম পাওয়া যায়নি',
        imageUrl: data.imageUrl || 'https://picsum.photos/seed/news/800/450',
        date: data.date || new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }),
        source: data.source || new URL(url).hostname
      }));
    } catch (err) {
      console.error(err);
      setError('খবরটি লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে সঠিক লিংক দিন অথবা ম্যানুয়ালি তথ্য পরিবর্তন করুন।');
    } finally {
      setLoading(false);
    }
  };

  const downloadCard = async () => {
    if (cardRef.current === null) return;
    
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, quality: 1 });
      const link = document.createElement('a');
      link.download = `news-card-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error downloading card:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-200 mb-4"
          >
            <span className="text-yellow-500">✨</span>
            <h1 className="text-sm font-semibold uppercase tracking-wider text-slate-600">ফটোকার্ড জেনারেটর</h1>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800">নিউজ ফটোকার্ড তৈরি করুন</h2>
          <p className="text-slate-500 mt-2">লিংক দিন অথবা ম্যানুয়ালি তথ্য দিয়ে তৈরি করুন প্রফেশনাল নিউজ কার্ড</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Controls */}
          <div className="lg:col-span-5 space-y-6">
            {/* URL Input */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <LinkIcon size={16} /> অটো জেনারেট (লিংক দিন)
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/news-article"
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                <button 
                  onClick={extractNewsData}
                  disabled={loading || !url}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loading ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                  জেনারেট
                </button>
              </div>
              {error && (
                <div className="mt-3 p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}
            </div>

            {/* Manual Controls */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                <Palette size={18} /> ম্যানুয়াল এডিট ও কাস্টমাইজ
              </h3>
              
              {/* Images Upload */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1">
                    <ImageIcon size={12} /> মূল ছবি
                  </label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'imageUrl')}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1">
                    <ImageIcon size={12} /> লোগো
                  </label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'logoUrl')}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">শিরোনাম</label>
                <textarea 
                  value={newsData.title}
                  onChange={(e) => setNewsData({...newsData, title: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Font Size */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">ফন্ট সাইজ (px)</label>
                  <input 
                    type="number" 
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">তারিখ</label>
                  <input 
                    type="text" 
                    value={newsData.date}
                    onChange={(e) => setNewsData({...newsData, date: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Source */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">সোর্স ইউআরএল</label>
                <input 
                  type="text" 
                  value={newsData.source}
                  onChange={(e) => setNewsData({...newsData, source: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              {/* Background Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">ব্যাকগ্রাউন্ড কালার</label>
                <div className="flex flex-wrap gap-2">
                  {GRADIENTS.map((grad) => (
                    <button
                      key={grad.id}
                      onClick={() => setSelectedGradient(grad)}
                      className={`w-10 h-10 rounded-lg ${grad.class} border-2 transition-all ${selectedGradient.id === grad.id ? 'border-blue-500 scale-110 shadow-lg' : 'border-transparent'}`}
                      title={grad.name}
                    />
                  ))}
                </div>
              </div>

              <button 
                onClick={downloadCard}
                className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 mt-4"
              >
                <Download size={20} /> ডাউনলোড করুন
              </button>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="lg:col-span-7 lg:sticky lg:top-8 order-first lg:order-last">
            <div className="flex flex-col items-center">
              <div className="mb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">লাইভ প্রিভিউ</div>
              
              {/* Responsive Card Wrapper */}
              <div className="w-full flex justify-center overflow-hidden py-4">
                <div className="relative origin-top transition-transform duration-300 scale-[0.55] min-[400px]:scale-[0.7] min-[500px]:scale-[0.85] sm:scale-100" style={{ width: '500px', height: '500px' }}>
                  {/* The Card Container */}
                  <div 
                    ref={cardRef}
                    id="news-card-preview"
                    className={`w-[500px] h-[500px] ${selectedGradient.class} relative overflow-hidden shadow-2xl flex flex-col p-6`}
                    style={{ borderRadius: '0' }}
                  >
                    {/* Header/Logo */}
                    <div className="flex justify-end mb-4">
                      <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 flex items-center gap-2">
                        {newsData.logoUrl ? (
                          <img src={newsData.logoUrl} alt="Logo" className="w-6 h-6 object-contain rounded-full" />
                        ) : (
                          <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white">N</div>
                        )}
                        <span className="text-[10px] font-bold text-white tracking-tighter uppercase">News Nest</span>
                      </div>
                    </div>

                    {/* Main Image Container */}
                    <div className="relative flex-1 rounded-3xl overflow-hidden border-[6px] border-white shadow-xl mb-6">
                      <img 
                        src={newsData.imageUrl} 
                        alt="News" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/error/800/450';
                        }}
                      />
                    </div>

                    {/* Content Area */}
                    <div className="space-y-4">
                      <h2 
                        className="text-white font-bold leading-tight text-center"
                        style={{ fontSize: `${fontSize}px` }}
                      >
                        {newsData.title}
                      </h2>

                      <div className="flex justify-center">
                        <div className="bg-red-600 text-white px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg animate-pulse">
                          বিস্তারিত কমেন্টে <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-auto flex justify-between items-end text-white/70 text-[11px] font-medium">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} /> {newsData.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Globe size={12} /> {newsData.source}
                      </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-[-50px] left-[-50px] w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-[-50px] right-[-50px] w-60 h-60 bg-black/10 rounded-full blur-3xl"></div>
                  </div>
                </div>
              </div>

              {/* Mobile Height Adjustment Spacer (because of scale transform) */}
              <div className="h-0 sm:hidden block mt-[-220px] min-[400px]:mt-[-150px] min-[500px]:mt-[-70px]"></div>

              <p className="mt-6 text-slate-400 text-sm italic text-center px-4">
                * কার্ডটি ডাউনলোড করার পর আপনি এটি সোশ্যাল মিডিয়ায় শেয়ার করতে পারবেন।
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
