
import React, { useState, useMemo } from 'react';
import { Calendar, Copy, Check, Hash, Save, X, TrendingUp, Loader2 } from 'lucide-react';
import { Platform } from '../../types';
import { usePostCard } from './PostCardContext';
import { geminiService } from '../../services/geminiService';

interface HeaderProps {
  onSchedule?: (date: string) => void;
  onSave?: () => void;
  onSuggestHashtags?: () => Promise<string>;
  onDelete?: () => void;
  scheduledDate?: string;
  isSavedView?: boolean;
}

const PlatformIcon: React.FC<{ platform: Platform }> = ({ platform }) => {
  switch (platform) {
    case Platform.LINKEDIN:
      return (
        <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
        </div>
      );
    case Platform.TWITTER:
      return (
        <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </div>
      );
    case Platform.INSTAGRAM:
      return (
        <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400">
           <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.645.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
        </div>
      );
  }
};

export const Header: React.FC<HeaderProps> = ({ 
  onSchedule, 
  onSave, 
  onSuggestHashtags, 
  onDelete, 
  scheduledDate, 
  isSavedView 
}) => {
  const { post } = usePostCard();
  const [copied, setCopied] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [hashtagsLoading, setHashtagsLoading] = useState(false);

  // Virality Calculation
  const viralityScore = useMemo(() => geminiService.calculateViralityScore(post.content), [post.content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(post.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmSchedule = () => {
    if (selectedDate && onSchedule) {
        onSchedule(selectedDate);
        setIsScheduling(false);
    }
  };

  const handleGetHashtags = async () => {
    if (onSuggestHashtags) {
        setHashtagsLoading(true);
        try {
            await onSuggestHashtags();
        } finally {
            setHashtagsLoading(false);
        }
    }
  };

  return (
    <>
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80 backdrop-blur-sm relative z-20">
        <div className="flex items-center gap-3">
            <PlatformIcon platform={post.platform} />
            <div className="flex flex-col">
                <h3 className="font-semibold text-zinc-200">{post.platform}</h3>
                {scheduledDate ? (
                    <span className="text-xs text-indigo-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(scheduledDate).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                ) : (
                    <div className="flex items-center gap-1 text-xs font-medium text-amber-400/80" title="Predicted Virality Score">
                       <TrendingUp className="w-3 h-3" /> Score: {viralityScore}
                    </div>
                )}
            </div>
        </div>
        <div className="flex items-center gap-1">
            {onSuggestHashtags && (
                <button
                    onClick={handleGetHashtags}
                    disabled={hashtagsLoading}
                    className="p-2 text-zinc-400 hover:text-pink-400 hover:bg-pink-500/10 rounded-md transition-colors disabled:opacity-50"
                    title="Suggest Hashtags"
                >
                    {hashtagsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4" />}
                </button>
            )}
            {onSave && !isSavedView && (
                <button
                    onClick={() => setShowSaveConfirm(true)}
                    className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors"
                    title="Save to Library"
                >
                    <Save className="w-4 h-4" />
                </button>
            )}
            {onSchedule && !scheduledDate && !isScheduling && (
                <button
                    onClick={() => setIsScheduling(true)}
                    className="p-2 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-colors"
                    title="Schedule Post"
                >
                    <Calendar className="w-4 h-4" />
                </button>
            )}
            <button 
                onClick={handleCopy}
                className="p-2 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-colors"
                title="Copy text"
            >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
             {onDelete && (
                <button 
                    onClick={onDelete}
                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                    title="Delete"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
      </div>

       {/* Save Confirmation Dialog */}
       {showSaveConfirm && (
        <div className="absolute inset-0 z-30 bg-zinc-950/95 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200 rounded-xl">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                    <Save className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                    <h4 className="text-white font-medium">Save to Library?</h4>
                    <p className="text-sm text-zinc-400 mt-1">This post will be saved to your local library.</p>
                </div>
                <div className="flex gap-2 justify-center pt-2">
                    <button 
                        onClick={() => setShowSaveConfirm(false)}
                        className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => {
                            onSave?.();
                            setShowSaveConfirm(false);
                        }}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-md font-medium transition-colors"
                    >
                        Confirm Save
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Scheduling Overlay */}
      {isScheduling && (
        <div className="p-4 bg-indigo-900/20 border-b border-indigo-500/30 animate-in slide-in-from-top-2">
            <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                    <label className="text-xs font-medium text-indigo-300">Pick date & time</label>
                    <input 
                        type="datetime-local" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-2 py-1.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <button 
                    onClick={handleConfirmSchedule}
                    disabled={!selectedDate}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-md"
                >
                    Save
                </button>
                <button 
                    onClick={() => setIsScheduling(false)}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
      )}
    </>
  );
};
