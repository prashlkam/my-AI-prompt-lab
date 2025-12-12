import React, { useState, useEffect, useMemo } from 'react';
import { Prompt, Category, AIActionType, ChartDataPoint, User } from './types';
import * as StorageService from './services/storageService';
import * as GeminiService from './services/geminiService';
import * as AuthService from './services/authService';
import Sidebar from './components/Sidebar';
import StatsChart from './components/StatsChart';
import AuthPage from './components/AuthPage';
import { 
  IconSearch, IconPlus, IconStar, IconBeaker, 
  IconWand, IconCode, IconActivity, IconTrash, IconCopy, IconInfo 
} from './components/Icons';
import { COST_PER_1K_INPUT } from './constants';

function App() {
  // --- Auth State ---
  const [user, setUser] = useState<User | null>(null);

  // --- App State ---
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Navigation
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isFavoritesSelected, setIsFavoritesSelected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editor / Workspace
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  
  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ type: string; content: string } | null>(null);

  // --- Effects ---
  
  // Check Auth on Mount
  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  // Load Data only when logged in
  useEffect(() => {
    if (user) {
      const loadedPrompts = StorageService.getPrompts();
      const loadedCategories = StorageService.getCategories();
      setPrompts(loadedPrompts);
      setCategories(loadedCategories);
      
      // Select first prompt if available and none selected
      if (loadedPrompts.length > 0 && !selectedPromptId) {
        handleSelectPrompt(loadedPrompts[0]);
      }
    }
  }, [user]);

  // Persist prompts when changed
  useEffect(() => {
    if (user && prompts.length > 0) {
      StorageService.savePrompts(prompts);
    }
  }, [prompts, user]);

  // --- Computed ---
  const filteredPrompts = useMemo(() => {
    let result = prompts;

    if (isFavoritesSelected) {
      result = result.filter(p => p.isFavorite);
    } else if (selectedCategoryId) {
      // Logic to include children categories would go here, simplified to exact match for demo
      result = result.filter(p => p.categoryId === selectedCategoryId);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.content.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [prompts, isFavoritesSelected, selectedCategoryId, searchQuery]);

  const activePrompt = useMemo(() => 
    prompts.find(p => p.id === selectedPromptId) || null
  , [prompts, selectedPromptId]);

  const statsData: ChartDataPoint[] = useMemo(() => {
    if (!activePrompt) return [];
    return [
      { name: 'Tokens', value: activePrompt.metadata.tokens || 0 },
      { name: 'Runtime', value: activePrompt.metadata.runtimeMs || 0 },
      { name: 'Score', value: (activePrompt.metadata.score || 0) * 10 }, // Scale to 100 for visual
    ];
  }, [activePrompt]);

  // --- Handlers ---

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    AuthService.logout();
    setUser(null);
    setSelectedPromptId(null);
  };

  const handleSelectCategory = (id: string | null) => {
    setSelectedCategoryId(id);
    setIsFavoritesSelected(false);
    setSearchQuery('');
  };

  const handleSelectFavorites = () => {
    setIsFavoritesSelected(true);
    setSelectedCategoryId(null);
  };

  const handleSelectPrompt = (prompt: Prompt) => {
    setSelectedPromptId(prompt.id);
    setEditTitle(prompt.title);
    setEditContent(prompt.content);
    setIsEditing(false);
    setAiResult(null);
  };

  const handleCreatePrompt = () => {
    const newPrompt: Prompt = {
      id: crypto.randomUUID(),
      title: 'New Untitled Prompt',
      content: '',
      categoryId: selectedCategoryId,
      tags: [],
      isFavorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {}
    };
    setPrompts([newPrompt, ...prompts]);
    handleSelectPrompt(newPrompt);
    setIsEditing(true);
  };

  const handleDeletePrompt = (id: string) => {
    const confirm = window.confirm("Are you sure you want to delete this prompt?");
    if (confirm) {
      const newPrompts = prompts.filter(p => p.id !== id);
      setPrompts(newPrompts);
      if (selectedPromptId === id) {
        setSelectedPromptId(null);
        setEditTitle('');
        setEditContent('');
      }
    }
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPrompts(prompts.map(p => 
      p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
    ));
  };

  const handleSave = () => {
    if (!activePrompt) return;
    
    setPrompts(prompts.map(p => 
      p.id === activePrompt.id 
        ? { ...p, title: editTitle, content: editContent, updatedAt: Date.now() } 
        : p
    ));
    setIsEditing(false);
  };

  // --- AI Operations ---

  const performAIAction = async (action: AIActionType) => {
    if (!activePrompt) return;
    setAiLoading(true);
    setAiResult(null);

    try {
      const startTime = performance.now();
      let resultText = '';
      let tokensUsed = 0;
      let scoreUpdate = 0;
      let feedback = '';

      switch (action) {
        case AIActionType.EVALUATE:
          const evalRes = await GeminiService.evaluatePrompt(editContent || activePrompt.content);
          resultText = `Score: ${evalRes.score}/10\n\nFeedback: ${evalRes.feedback}`;
          tokensUsed = evalRes.tokens;
          scoreUpdate = evalRes.score;
          feedback = evalRes.feedback;
          break;
          
        case AIActionType.ENHANCE:
          const enhanceRes = await GeminiService.enhancePrompt(editContent || activePrompt.content);
          resultText = enhanceRes.text;
          tokensUsed = enhanceRes.tokens;
          break;

        case AIActionType.CODE_PLAN:
          const planRes = await GeminiService.generateCodePlan(editContent || activePrompt.content);
          resultText = planRes.text;
          tokensUsed = planRes.tokens;
          break;

        case AIActionType.FUN_PROMPT:
          resultText = await GeminiService.generateFunPrompt();
          // Insert into editor directly for fun
          setEditContent(resultText); 
          setEditTitle("A Fun Random Prompt");
          setAiLoading(false);
          return; // Early return as we updated state directly
      }

      const endTime = performance.now();
      
      // Update metadata
      setPrompts(prev => prev.map(p => {
        if (p.id === activePrompt.id) {
          const newMeta = { ...p.metadata };
          newMeta.tokens = tokensUsed;
          newMeta.estimatedCost = (tokensUsed / 1000) * COST_PER_1K_INPUT; // Simplified
          newMeta.runtimeMs = Math.round(endTime - startTime);
          if (scoreUpdate) {
            newMeta.score = scoreUpdate;
            newMeta.feedback = feedback;
          }
          return { ...p, metadata: newMeta };
        }
        return p;
      }));

      setAiResult({ type: action, content: resultText });

    } catch (error) {
      console.error(error);
      alert("AI Operation failed. Check console.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast here
  };

  // --- Render ---

  if (!user) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* LEFT: Sidebar */}
      <Sidebar 
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={handleSelectCategory}
        onSelectFavorites={handleSelectFavorites}
        isFavoritesSelected={isFavoritesSelected}
        user={user}
        onLogout={handleLogout}
      />

      {/* MIDDLE: Prompt List */}
      <div className="w-80 flex flex-col border-r border-slate-800 bg-slate-900/50">
        <div className="p-4 border-b border-slate-800">
          <div className="relative">
            <IconSearch className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search prompts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredPrompts.length === 0 ? (
             <div className="p-8 text-center text-slate-500 text-sm">
               No prompts found.
             </div>
          ) : (
            filteredPrompts.map(prompt => (
              <div 
                key={prompt.id}
                onClick={() => handleSelectPrompt(prompt)}
                className={`p-4 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800/50 transition-colors group relative ${
                  selectedPromptId === prompt.id ? 'bg-slate-800 border-l-2 border-l-blue-500' : 'border-l-2 border-l-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-medium text-sm line-clamp-1 ${selectedPromptId === prompt.id ? 'text-blue-400' : 'text-slate-300'}`}>
                    {prompt.title}
                  </h3>
                  <button 
                    onClick={(e) => handleToggleFavorite(prompt.id, e)}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity ${prompt.isFavorite ? 'opacity-100 text-yellow-500' : 'text-slate-600'}`}
                  >
                    <IconStar className="w-4 h-4" filled={prompt.isFavorite} />
                  </button>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                  {prompt.content || "No content..."}
                </p>
                <div className="flex items-center space-x-2">
                   {prompt.metadata.score && (
                     <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-green-400 font-medium">
                       Score: {prompt.metadata.score}
                     </span>
                   )}
                   {prompt.tags.map(tag => (
                     <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                       #{tag}
                     </span>
                   ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleCreatePrompt}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-blue-900/20"
          >
            <IconPlus className="w-4 h-4" />
            <span>New Prompt</span>
          </button>
        </div>
      </div>

      {/* RIGHT: Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {activePrompt ? (
          <>
            {/* Header */}
            <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/30 backdrop-blur-md sticky top-0 z-10">
              <div className="flex-1">
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editTitle} 
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="bg-transparent border-none text-xl font-bold text-white focus:outline-none w-full"
                    placeholder="Prompt Title"
                  />
                ) : (
                  <h2 className="text-xl font-bold text-white truncate">{activePrompt.title}</h2>
                )}
              </div>
              
              <div className="flex items-center space-x-3 ml-4">
                 {isEditing ? (
                   <>
                     <button onClick={() => setIsEditing(false)} className="text-sm text-slate-400 hover:text-white px-3 py-1">Cancel</button>
                     <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-1.5 rounded-md font-medium transition-colors">Save Changes</button>
                   </>
                 ) : (
                    <>
                      <button 
                        onClick={() => handleCopyToClipboard(activePrompt.content)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors" 
                        title="Copy"
                      >
                        <IconCopy className="w-5 h-5" />
                      </button>
                      <button 
                         onClick={() => { setIsEditing(true); setEditTitle(activePrompt.title); setEditContent(activePrompt.content); }}
                         className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-md transition-colors"
                         title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                      </button>
                      <button 
                        onClick={() => handleDeletePrompt(activePrompt.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
                        title="Delete"
                      >
                        <IconTrash className="w-5 h-5" />
                      </button>
                    </>
                 )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Main Playground Area */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Editor Column */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-slate-900 rounded-xl border border-slate-800 p-1 overflow-hidden shadow-sm">
                    <textarea 
                      value={isEditing ? editContent : activePrompt.content}
                      onChange={(e) => setEditContent(e.target.value)}
                      disabled={!isEditing}
                      className={`w-full h-80 bg-slate-950/50 p-4 text-slate-200 font-mono text-sm focus:outline-none resize-none rounded-lg ${!isEditing ? 'opacity-80' : 'focus:bg-slate-950'}`}
                      placeholder="Enter your prompt here..."
                    />
                  </div>
                  
                  {/* AI Actions Toolbar */}
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => performAIAction(AIActionType.EVALUATE)}
                      disabled={aiLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg text-sm font-medium border border-slate-700 transition-all disabled:opacity-50"
                    >
                      <IconActivity className="w-4 h-4" />
                      Evaluate
                    </button>
                    <button 
                      onClick={() => performAIAction(AIActionType.ENHANCE)}
                      disabled={aiLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-purple-400 rounded-lg text-sm font-medium border border-slate-700 transition-all disabled:opacity-50"
                    >
                      <IconWand className="w-4 h-4" />
                      Enhance
                    </button>
                    <button 
                      onClick={() => performAIAction(AIActionType.CODE_PLAN)}
                      disabled={aiLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-sm font-medium border border-slate-700 transition-all disabled:opacity-50"
                    >
                      <IconCode className="w-4 h-4" />
                      Code Plan
                    </button>
                     <button 
                      onClick={() => performAIAction(AIActionType.FUN_PROMPT)}
                      disabled={aiLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-pink-400 rounded-lg text-sm font-medium border border-slate-700 transition-all disabled:opacity-50"
                    >
                      <IconBeaker className="w-4 h-4" />
                      Fun Prompt
                    </button>
                  </div>

                  {/* AI Results Area */}
                  {(aiLoading || aiResult) && (
                    <div className="bg-slate-900/80 rounded-xl border border-blue-500/20 p-5 mt-4 animate-fade-in relative overflow-hidden">
                       {/* Background decoration */}
                       <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

                       {aiLoading ? (
                         <div className="flex items-center space-x-3 text-blue-400">
                           <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                           <span className="font-medium">AI is thinking...</span>
                         </div>
                       ) : aiResult ? (
                         <div>
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wide">
                                {aiResult.type.replace('_', ' ')} Result
                              </h4>
                              <div className="flex space-x-2">
                                <button onClick={() => setEditContent(aiResult.content)} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded">Apply to Editor</button>
                                <button onClick={() => handleCopyToClipboard(aiResult.content)} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded">Copy</button>
                              </div>
                            </div>
                            <div className="bg-slate-950 rounded-lg p-4 border border-slate-800/50">
                              <pre className="whitespace-pre-wrap text-sm text-slate-300 font-mono leading-relaxed">{aiResult.content}</pre>
                            </div>
                         </div>
                       ) : null}
                    </div>
                  )}
                </div>

                {/* Stats & Info Column */}
                <div className="space-y-6">
                  {/* Stats Card */}
                  <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center justify-between">
                      <span>Prompt Stats</span>
                      <span className="text-xs text-slate-500 font-normal">Est. based on Gemini Flash</span>
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                         <div className="text-xs text-slate-500 mb-1">Cost (USD)</div>
                         <div className="text-lg font-mono text-emerald-400">
                           ${(activePrompt.metadata.estimatedCost || 0).toFixed(6)}
                         </div>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                         <div className="text-xs text-slate-500 mb-1">Tokens</div>
                         <div className="text-lg font-mono text-blue-400">
                           {activePrompt.metadata.tokens || 0}
                         </div>
                      </div>
                    </div>
                    
                    <div className="h-40">
                      <StatsChart data={statsData} />
                    </div>
                  </div>

                  {/* Feedback Card (if evaluated) */}
                  {activePrompt.metadata.feedback && (
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm">
                       <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
                          <IconInfo className="w-4 h-4 text-purple-400" />
                          Evaluation
                       </h3>
                       <div className="text-sm text-slate-300 leading-relaxed italic">
                         "{activePrompt.metadata.feedback}"
                       </div>
                    </div>
                  )}

                  {/* Info Panel */}
                  <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl border border-blue-500/10 p-5">
                    <h4 className="text-blue-200 text-sm font-medium mb-2">Pro Tip</h4>
                    <p className="text-xs text-blue-200/70">
                      Use "Code Plan" mode with the Gemini 2.5 Pro model to get detailed architecture suggestions before you start coding.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 bg-slate-950">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 border border-slate-800 shadow-lg">
              <IconWand className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-lg font-medium">Select a prompt to begin</p>
            <p className="text-sm mt-2">Or create a new one to start experimenting.</p>
            <button 
              onClick={handleCreatePrompt}
              className="mt-6 bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-2 rounded-full border border-slate-700 transition-colors text-sm font-medium"
            >
              Create New Prompt
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
