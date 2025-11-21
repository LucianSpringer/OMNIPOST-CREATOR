
import React from 'react';
import { usePostCard } from './PostCardContext';

export const Content: React.FC = () => {
  const { post, onUpdate } = usePostCard();

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onUpdate) {
      onUpdate({ ...post, content: e.target.value });
    }
  };

  return (
    <div className="px-4 pt-4 flex-1 relative">
      <textarea 
          value={post.content}
          onChange={handleContentChange}
          className="w-full h-full min-h-[100px] bg-transparent text-zinc-300 text-sm leading-relaxed font-light resize-none focus:outline-none focus:bg-zinc-800/30 rounded-md p-2 -ml-2 transition-colors"
          spellCheck={false}
      />
    </div>
  );
};
