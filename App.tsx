
import React, { useState, useEffect } from 'react';
import { ApiKeyBanner } from './components/ApiKeyBanner';
import { PostCard } from './components/PostCard';
import { generateSocialText, generateSocialImageVariant, generateAnalyticsInsights, generateHashtags } from './services/geminiService';
import { GeneratedPost, Platform, Tone, ImageSize, AspectRatio, ScheduledPost, AnalyticsMetrics, SavedPost } from './types';
import { Sparkles, Send, ChevronDown, ChevronUp, Wand2, Loader2, LayoutDashboard, Calendar as CalendarIcon, PenTool, TrendingUp, Users, MousePointer2, Eye, Bookmark } from 'lucide-react';

const DEFAULT_ASPECT_RATIOS = {
  [Platform.LINKEDIN]: AspectRatio.RATIO_4_3,
  [Platform.TWITTER]: AspectRatio.RATIO_16_9,
  [Platform.INSTAGRAM]: AspectRatio.RATIO_1_1,
};

// Mock initial analytics data
const INITIAL_METRICS: AnalyticsMetrics = {
    impressions: 45230,
    reach: 32100,
    engagementRate: 4.8,
    clicks: 1250,
    history: [4500, 5200, 4800, 6100, 5900, 7200, 8500]
};

// Helper to migrate old data structure to new if necessary
const migratePostData = (data: any[]): any[] => {
    if (!Array.isArray(data)) return [];
    return data.map(post => {
        if (!post.images || post.images.length === 0) {
             return { ...post, images: [] };
        }
        // Check if images are strings (old format)
        if (typeof post.images[0] === 'string') {
            return {
                ...post,
                images: post.images.map((url: string) => ({ url, isLoading: false, error: false }))
            };
        }
        return post;
    });
};

const App: React.FC = () => {
  const [apiKeySelected, setApiKeySelected] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'calendar' | 'analytics' | 'saved'>('create');
  
  // Create Tab State
  const [idea, setIdea] = useState('');
  const [tone, setTone] = useState<Tone>(Tone.PROFESSIONAL);
  const [audience, setAudience] = useState('');
  const [imageSize, setImageSize] = useState<ImageSize>(ImageSize.SIZE_1K);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aspectRatios, setAspectRatios] = useState(DEFAULT_ASPECT_RATIOS);
  
  const [results, setResults] = useState<{
    [Platform.LINKEDIN]: GeneratedPost | null;
    [Platform.TWITTER]: GeneratedPost | null;
    [Platform.INSTAGRAM]: GeneratedPost | null;
  }>({
    [Platform.LINKEDIN]: null,
    [Platform.TWITTER]: null,
    [Platform.INSTAGRAM]: null,
  });

  // Calendar & Saved State
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);

  // Analytics State
  const [metrics, setMetrics] = useState<AnalyticsMetrics>(INITIAL_METRICS);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);

  const audienceSuggestions = [
      'Small Business Owners', 
      'Tech Enthusiasts', 
      'Fashion Lovers', 
      'Gen Z', 
      'Corporate Executives',
      'Digital Nomads',
      'Art Collectors',
      'Sustainable Living Advocates'
  ];

  // Load data from local storage on mount
  useEffect(() => {
    try {
        const loadedScheduled = localStorage.getItem('omnipost_scheduled');
        const loadedSaved = localStorage.getItem('omnipost_saved');
        if (loadedScheduled) setScheduledPosts(migratePostData(JSON.parse(loadedScheduled)));
        if (loadedSaved) setSavedPosts(migratePostData(JSON.parse(loadedSaved)));
    } catch (e) {
        console.error("Failed to load or migrate local storage data", e);
    }
  }, []);

  // Persist to local storage on change
  useEffect(() => {
    localStorage.setItem('omnipost_scheduled', JSON.stringify(scheduledPosts));
  }, [scheduledPosts]);

  useEffect(() => {
    localStorage.setItem('omnipost_saved', JSON.stringify(savedPosts));
  }, [savedPosts]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim() || !apiKeySelected) return;

    setIsGenerating(true);

    // Initialize results with placeholders for images
    const initialImages = [
        { url: null, isLoading: true },
        { url: null, isLoading: true }
    ];

    setResults({
      [Platform.LINKEDIN]: { platform: Platform.LINKEDIN, content: '', images: [...initialImages], selectedImageIndex: 0 },
      [Platform.TWITTER]: { platform: Platform.TWITTER, content: '', images: [...initialImages], selectedImageIndex: 0 },
      [Platform.INSTAGRAM]: { platform: Platform.INSTAGRAM, content: '', images: [...initialImages], selectedImageIndex: 0 },
    });

    try {
      // 1. Generate Text Content (Fastest)
      const textContent = await generateSocialText(idea, tone, audience);

      setResults(prev => ({
        [Platform.LINKEDIN]: { ...prev[Platform.LINKEDIN]!, content: textContent.linkedin },
        [Platform.TWITTER]: { ...prev[Platform.TWITTER]!, content: textContent.twitter },
        [Platform.INSTAGRAM]: { ...prev[Platform.INSTAGRAM]!, content: textContent.instagram },
      }));

      // 2. Generate Images in Parallel (Individually tracked)
      const platforms = [Platform.LINKEDIN, Platform.TWITTER, Platform.INSTAGRAM];
      
      // Fire off all image requests
      platforms.forEach(platform => {
          [0, 1].forEach(async (index) => {
              try {
                  const imageUrl = await generateSocialImageVariant(
                      idea, 
                      platform, 
                      tone, 
                      aspectRatios[platform], 
                      imageSize, 
                      audience, 
                      index
                  );

                  setResults(prev => {
                      const currentPost = prev[platform];
                      if (!currentPost) return prev;
                      const newImages = [...currentPost.images];
                      newImages[index] = { url: imageUrl, isLoading: false, error: false };
                      return {
                          ...prev,
                          [platform]: { ...currentPost, images: newImages }
                      };
                  });
              } catch (err) {
                  console.error(`Error generating image ${index} for ${platform}`, err);
                  setResults(prev => {
                    const currentPost = prev[platform];
                    if (!currentPost) return prev;
                    const newImages = [...currentPost.images];
                    newImages[index] = { url: null, isLoading: false, error: true };
                    return {
                        ...prev,
                        [platform]: { ...currentPost, images: newImages }
                    };
                  });
              }
          });
      });

    } catch (error) {
      console.error("Main generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSchedule = (post: GeneratedPost, date: string) => {
    const newScheduledPost: ScheduledPost = {
        ...post,
        id: Math.random().toString(36).substring(7),
        scheduledDate: date
    };
    setScheduledPosts(prev => [...prev, newScheduledPost].sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()));
    alert(`Scheduled for ${new Date(date).toLocaleString()}`);
  };

  const handleSave = (post: GeneratedPost) => {
      const newSavedPost: SavedPost = {
          ...post,
          id: Math.random().toString(36).substring(7),
          savedDate: new Date().toISOString()
      };
      setSavedPosts(prev => [newSavedPost, ...prev]);
  };

  const handleAnalyze = async () => {
      setIsAnalyzing(true);
      try {
          const insights = await generateAnalyticsInsights(metrics);
          setAiInsights(insights);
      } catch (error) {
          console.error(error);
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleRatioChange = (platform: Platform, value: AspectRatio) => {
    setAspectRatios(prev => ({ ...prev, [platform]: value }));
  };

  const handleSuggestHashtags = async (platform: Platform, content: string) => {
    const hashtags = await generateHashtags(content, platform, audience);
    setResults(prev => {
        const current = prev[platform];
        if (!current) return prev;
        // Append hashtags if not already there (simple check)
        if (!current.content.includes(hashtags.trim())) {
             return {
                ...prev,
                [platform]: { ...current, content: current.content + "\n\n" + hashtags }
             };
        }
        return prev;
    });
    return hashtags;
  };

  const handleImageSelect = (platform: Platform, index: number) => {
      setResults(prev => ({
          ...prev,
          [platform]: { ...prev[platform]!, selectedImageIndex: index }
      }));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 selection:bg-indigo-500/30 flex flex-col">
      <ApiKeyBanner onKeySelected={() => setApiKeySelected(true)} />

      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-bold tracking-tight hidden sm:block">OmniPost <span className="text-zinc-500 font-normal">Creator</span></h1>
            </div>
            
            {/* Navigation Tabs */}
            <nav className="flex items-center bg-zinc-800/50 p-1 rounded-lg overflow-x-auto no-scrollbar">
                <button 
                    onClick={() => setActiveTab('create')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'create' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                    <PenTool className="w-4 h-4" /> Create
                </button>
                <button 
                    onClick={() => setActiveTab('calendar')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'calendar' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                    <CalendarIcon className="w-4 h-4" /> Calendar
                </button>
                 <button 
                    onClick={() => setActiveTab('saved')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'saved' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                    <Bookmark className="w-4 h-4" /> Saved
                </button>
                <button 
                    onClick={() => setActiveTab('analytics')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'analytics' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                    <LayoutDashboard className="w-4 h-4" /> Analytics
                </button>
            </nav>

            <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
                <span className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-800/50 border border-zinc-700/50">
                    <Wand2 className="w-3 h-3 text-purple-400" /> Gemini 3 Pro
                </span>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        
        {/* CREATE VIEW */}
        {activeTab === 'create' && (
            <div className="space-y-12 animate-fade-in">
                <section className="max-w-3xl mx-auto">
                    <form onSubmit={handleGenerate} className="space-y-6">
                        {/* Idea Input */}
                        <div className="space-y-2">
                            <label htmlFor="idea" className="block text-sm font-medium text-zinc-400">What do you want to post about?</label>
                            <textarea 
                                id="idea"
                                value={idea}
                                onChange={(e) => setIdea(e.target.value)}
                                placeholder="e.g., Launching our new AI-powered coffee machine that learns your taste preferences..."
                                className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-lg placeholder-zinc-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-shadow"
                            />
                        </div>

                        {/* Tone */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-zinc-400">Tone of Voice</label>
                            <div className="flex flex-wrap gap-2">
                                {Object.values(Tone).map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setTone(t)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all truncate flex-1 min-w-[100px] ${
                                            tone === t 
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                                            : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700'
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Audience Targeting */}
                        <div className="space-y-3 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800">
                             <label className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                                <Users className="w-4 h-4" /> Target Audience
                             </label>
                             <input 
                                type="text"
                                value={audience}
                                onChange={(e) => setAudience(e.target.value)}
                                placeholder="e.g. Freelancers, Gamers, Health Conscious Moms"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-200 focus:ring-1 focus:ring-indigo-500 outline-none placeholder-zinc-700"
                             />
                             <div className="flex flex-wrap gap-2">
                                {audienceSuggestions.map(aud => (
                                    <button
                                        key={aud}
                                        type="button"
                                        onClick={() => setAudience(aud)}
                                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                            audience === aud 
                                            ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200'
                                            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                                        }`}
                                    >
                                        {aud}
                                    </button>
                                ))}
                             </div>
                        </div>

                        {/* Image Configuration Section */}
                        <div className="border border-zinc-800 rounded-xl bg-zinc-900/30 overflow-hidden">
                            <div className="p-3 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-2">
                                <Wand2 className="w-4 h-4 text-purple-400" />
                                <span className="text-sm font-medium text-zinc-200">Visual Settings</span>
                            </div>
                            
                            <div className="p-4 space-y-6">
                                {/* Image Quality */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider">Quality</label>
                                    <div className="flex gap-2">
                                        {[ImageSize.SIZE_1K, ImageSize.SIZE_2K, ImageSize.SIZE_4K].map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setImageSize(s)}
                                                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all border ${
                                                    imageSize === s 
                                                    ? 'bg-purple-600/20 border-purple-500 text-purple-200' 
                                                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                                }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Aspect Ratios */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider">Aspect Ratios Per Platform</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {Object.values(Platform).map((p) => (
                                            <div key={p} className="space-y-1">
                                                <label className="text-xs text-zinc-400 block">{p}</label>
                                                <select 
                                                    value={aspectRatios[p]}
                                                    onChange={(e) => handleRatioChange(p, e.target.value as AspectRatio)}
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none hover:border-zinc-700 transition-colors cursor-pointer"
                                                >
                                                    {Object.values(AspectRatio).map((ratio) => (
                                                        <option key={ratio} value={ratio}>{ratio}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isGenerating || !idea.trim()}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-indigo-900/20 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 text-lg"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" /> Generating Campaign...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" /> Generate Campaign
                                </>
                            )}
                        </button>
                    </form>
                </section>

                {/* Results Grid */}
                {(results[Platform.LINKEDIN] || isGenerating) && (
                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {Object.values(Platform).map(platform => (
                            <PostCard 
                                key={platform}
                                post={results[platform] || { platform, content: '', images: [], selectedImageIndex: 0 }} 
                                onSchedule={(date) => results[platform] && handleSchedule(results[platform]!, date)}
                                onSave={() => results[platform] && handleSave(results[platform]!)}
                                onSuggestHashtags={() => results[platform] ? handleSuggestHashtags(platform, results[platform]!.content) : Promise.resolve("")}
                                onImageSelect={(idx) => handleImageSelect(platform, idx)}
                            />
                        ))}
                    </section>
                )}
            </div>
        )}

        {/* CALENDAR VIEW */}
        {activeTab === 'calendar' && (
            <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Content Calendar</h2>
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span> Upcoming
                    </div>
                </div>

                {scheduledPosts.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800 border-dashed">
                        <CalendarIcon className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-zinc-400">No posts scheduled yet</h3>
                        <p className="text-zinc-600">Generate content and click the calendar icon to schedule.</p>
                        <button 
                            onClick={() => setActiveTab('create')}
                            className="mt-6 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
                        >
                            Create New Post
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {scheduledPosts.map((post) => (
                            <PostCard 
                                key={post.id} 
                                post={post} 
                                scheduledDate={post.scheduledDate}
                                onImageSelect={(idx) => {
                                    const newPosts = scheduledPosts.map(p => p.id === post.id ? { ...p, selectedImageIndex: idx } : p);
                                    setScheduledPosts(newPosts);
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* SAVED VIEW */}
        {activeTab === 'saved' && (
            <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Saved Drafts</h2>
                    <span className="text-sm text-zinc-500">{savedPosts.length} items</span>
                </div>

                {savedPosts.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800 border-dashed">
                        <Bookmark className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-zinc-400">No saved drafts</h3>
                        <p className="text-zinc-600">Save posts you like to come back to them later.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {savedPosts.map((post) => (
                            <PostCard 
                                key={post.id} 
                                post={post} 
                                isSavedView={true}
                                onSchedule={(date) => handleSchedule(post, date)}
                                onImageSelect={(idx) => {
                                    const newSaved = savedPosts.map(p => p.id === post.id ? { ...p, selectedImageIndex: idx } : p);
                                    setSavedPosts(newSaved);
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* ANALYTICS VIEW */}
        {activeTab === 'analytics' && (
            <div className="max-w-5xl mx-auto animate-fade-in space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Performance Dashboard</h2>
                    <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20">+12% vs last week</span>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                            <Eye className="w-4 h-4" /> Impressions
                        </div>
                        <div className="text-2xl font-bold">{metrics.impressions.toLocaleString()}</div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                            <Users className="w-4 h-4" /> Reach
                        </div>
                        <div className="text-2xl font-bold">{metrics.reach.toLocaleString()}</div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                            <TrendingUp className="w-4 h-4" /> Engagement Rate
                        </div>
                        <div className="text-2xl font-bold">{metrics.engagementRate}%</div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                            <MousePointer2 className="w-4 h-4" /> Link Clicks
                        </div>
                        <div className="text-2xl font-bold">{metrics.clicks.toLocaleString()}</div>
                    </div>
                </div>

                {/* Visualizer (Mock) */}
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl h-64 flex items-end justify-between gap-2">
                    {metrics.history.map((val, i) => (
                        <div key={i} className="w-full bg-indigo-500/20 hover:bg-indigo-500/40 transition-colors rounded-t-md relative group" style={{ height: `${(val / 10000) * 100}%` }}>
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {val.toLocaleString()} imp.
                            </div>
                        </div>
                    ))}
                </div>

                {/* AI Insights Section */}
                <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-400" /> AI Strategic Insights
                        </h3>
                        {!aiInsights && (
                            <button 
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                            >
                                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                Analyze Performance
                            </button>
                        )}
                    </div>

                    {isAnalyzing && (
                         <div className="space-y-3 animate-pulse">
                            <div className="h-4 bg-indigo-500/10 rounded w-3/4"></div>
                            <div className="h-4 bg-indigo-500/10 rounded w-1/2"></div>
                            <div className="h-4 bg-indigo-500/10 rounded w-5/6"></div>
                         </div>
                    )}

                    {aiInsights && (
                        <div className="prose prose-invert prose-sm max-w-none">
                            <p className="whitespace-pre-line text-zinc-200 leading-relaxed">
                                {aiInsights}
                            </p>
                        </div>
                    )}
                    
                    {!isAnalyzing && !aiInsights && (
                        <p className="text-zinc-500 text-sm">Click analyze to let Gemini identify trends and optimization opportunities from your recent performance data.</p>
                    )}
                </div>
            </div>
        )}

      </main>
    </div>
  );
}

export default App;
