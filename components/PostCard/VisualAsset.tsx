import React from 'react';
import { ChevronLeft, ChevronRight, Download, Image as ImageIcon, Loader2 } from 'lucide-react';
import { usePostCard } from './PostCardContext';
import { createImageUrl } from '../../types';
import { analytics } from '../../services/telemetryService';

interface VisualAssetProps {
  onImageSelect?: (index: number) => void;
}

export const VisualAsset: React.FC<VisualAssetProps> = ({ onImageSelect }) => {
  const { post, onUpdate } = usePostCard();
  const currentImage = post.images[post.selectedImageIndex];

  const handleDownloadImage = () => {
    if (currentImage && currentImage.state.status === 'SUCCESS') {
      const link = document.createElement('a');
      link.href = currentImage.state.url;
      link.download = `omnipost-${post.platform.toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Telemetry
      analytics.track('IMAGE_DOWNLOADED', {
        platform: post.platform,
        variantId: currentImage.id,
        size: currentImage.state.metadata?.width ? 'known' : 'unknown'
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdate) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            const newImages = [...post.images];
            
            const newVariant = { 
              ...newImages[post.selectedImageIndex], 
              state: { 
                  status: 'SUCCESS' as const, 
                  url: createImageUrl(base64),
                  metadata: {}
              } 
            };
            newImages[post.selectedImageIndex] = newVariant;
            
            onUpdate({ ...post, images: newImages });
        };
        reader.readAsDataURL(file);
    }
  };

  return (
    <div className="px-4 pb-2">
      <div className="relative w-full rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 group aspect-video flex items-center justify-center">
            
        {/* Image Upload Input */}
        <input 
            type="file" 
            accept="image/*"
            id={`upload-${post.platform}-${post.id}`}
            className="hidden"
            onChange={handleImageUpload}
        />

        {/* Navigation (Always visible if multiple images) */}
        {post.images && post.images.length > 1 && onImageSelect && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 z-20 shadow-xl">
                    <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        const prev = (post.selectedImageIndex ?? 0) > 0 ? (post.selectedImageIndex ?? 0) - 1 : post.images.length - 1;
                        onImageSelect(prev);
                    }}
                    className="p-1 text-zinc-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                    <ChevronLeft className="w-3 h-3" />
                    </button>
                    <span className="text-[10px] font-semibold text-white tabular-nums">
                    {(post.selectedImageIndex ?? 0) + 1} / {post.images.length}
                    </span>
                    <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        const next = (post.selectedImageIndex ?? 0) < post.images.length - 1 ? (post.selectedImageIndex ?? 0) + 1 : 0;
                        onImageSelect(next);
                    }}
                    className="p-1 text-zinc-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                    <ChevronRight className="w-3 h-3" />
                    </button>
            </div>
        )}

        {/* Top Right Actions */}
        <div className="absolute top-3 right-3 z-20 flex gap-2">
            {/* Upload Button Overlay */}
                <label 
                htmlFor={`upload-${post.platform}-${post.id}`}
                className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs rounded-full font-medium hover:bg-black/80 transition-colors shadow-lg cursor-pointer"
                title="Upload Custom Image"
            >
                <ImageIcon className="w-3 h-3" />
            </label>

            {/* Download Button */}
            {currentImage && currentImage.state.status === 'SUCCESS' && (
                <button 
                    onClick={handleDownloadImage}
                    className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs rounded-full font-medium hover:bg-black/80 transition-colors shadow-lg"
                    title="Download Image"
                >
                    <Download className="w-3 h-3" /> 
                </button>
            )}
        </div>

        {/* Content Layer */}
        {currentImage?.state.status === 'LOADING' ? (
            <div className="flex flex-col items-center gap-3 text-zinc-400 z-10 animate-in fade-in duration-300">
                <div className="relative">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <div className="absolute inset-0 blur-lg bg-indigo-500/20"></div>
                </div>
                <span className="text-xs font-medium tracking-wide">Generating variation {(post.selectedImageIndex ?? 0) + 1}...</span>
            </div>
        ) : currentImage?.state.status === 'SUCCESS' ? (
            <img 
                src={currentImage.state.url} 
                alt={`Generated for ${post.platform}`} 
                className="w-full h-full object-contain bg-zinc-900/50"
            />
        ) : (
            // Placeholder Image
            <label 
                htmlFor={`upload-${post.platform}-${post.id}`}
                className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 relative cursor-pointer group/placeholder"
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800/30 to-transparent opacity-50"></div>
                <div className="flex flex-col items-center gap-3 z-10">
                    <div className="p-3 bg-zinc-800 rounded-full group-hover/placeholder:bg-zinc-700 transition-colors">
                        <ImageIcon className="w-8 h-8 text-zinc-500 group-hover/placeholder:text-zinc-400" />
                    </div>
                    <span className="text-xs font-medium text-zinc-500 group-hover/placeholder:text-zinc-400 uppercase tracking-widest">
                        {currentImage?.state.status === 'ERROR' ? 'Generation Failed' : 'Upload Image'}
                    </span>
                </div>
            </label>
        )}
      </div>
    </div>
  );
};