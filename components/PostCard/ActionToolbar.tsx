
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { usePostCard } from './PostCardContext';
import { Platform } from '../../types';

export const ActionToolbar: React.FC = () => {
  const { post } = usePostCard();

  const handleShare = () => {
    let url = '';
    const text = encodeURIComponent(post.content);
    switch (post.platform) {
        case Platform.LINKEDIN:
            url = `https://www.linkedin.com/feed/?shareActive=true&text=${text}`;
            break;
        case Platform.TWITTER:
            url = `https://twitter.com/intent/tweet?text=${text}`;
            break;
        case Platform.INSTAGRAM:
            url = `https://www.instagram.com/`;
            break;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="pt-2 pb-4 px-4 mt-auto border-t border-zinc-800/50 flex justify-end">
        <button 
        onClick={handleShare}
        className="text-xs font-medium text-zinc-400 hover:text-indigo-400 flex items-center gap-1.5 px-3 py-1.5 hover:bg-indigo-500/10 rounded-lg transition-colors"
        >
            Share to {post.platform} <ChevronRight className="w-3 h-3" />
        </button>
    </div>
  );
};
