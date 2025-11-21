
import React, { createContext, useContext } from 'react';
import { GeneratedPost } from '../../types';

interface PostCardContextType {
  post: GeneratedPost;
  onUpdate?: (post: GeneratedPost) => void;
}

const PostCardContext = createContext<PostCardContextType | null>(null);

export const usePostCard = () => {
  const context = useContext(PostCardContext);
  if (!context) throw new Error("PostCard.* components must be used within <PostCard.Root>");
  return context;
};

export const PostCardRoot = ({ 
  children, 
  post, 
  onUpdate 
}: { 
  children: React.ReactNode; 
  post: GeneratedPost;
  onUpdate?: (post: GeneratedPost) => void;
}) => {
  return (
    <PostCardContext.Provider value={{ post, onUpdate }}>
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-full transition-all hover:border-zinc-700 group/card shadow-sm hover:shadow-lg hover:shadow-indigo-900/10 relative">
        {children}
      </div>
    </PostCardContext.Provider>
  );
};
