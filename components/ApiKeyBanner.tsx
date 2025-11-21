import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface ApiKeyBannerProps {
  onKeySelected: () => void;
}

export const ApiKeyBanner: React.FC<ApiKeyBannerProps> = ({ onKeySelected }) => {
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio?.hasSelectedApiKey) {
      const selected = await aistudio.hasSelectedApiKey();
      setHasKey(selected);
      if (selected) {
        onKeySelected();
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    checkKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio?.openSelectKey) {
      await aistudio.openSelectKey();
      // Optimistically assume success or re-check immediately
      setHasKey(true);
      onKeySelected();
    }
  };

  if (loading) return null;
  if (hasKey) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-indigo-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Welcome to OmniPost</h2>
          <p className="text-zinc-400">
            To generate high-quality 4K images and professional content with Gemini 3 Pro, please select a paid API key from your Google Cloud project.
          </p>
        </div>
        
        <button
          onClick={handleSelectKey}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] active:scale-95"
        >
          Select API Key
        </button>
        
        <p className="text-xs text-zinc-500">
          Need help? <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-zinc-300">View billing documentation</a>.
        </p>
      </div>
    </div>
  );
};