import React from 'react';
import { Category, User } from '../types';
import { IconFolder, IconStar, IconLogOut, IconUser } from './Icons';

interface SidebarProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  onSelectFavorites: () => void;
  isFavoritesSelected: boolean;
  user: User | null;
  onLogout: () => void;
}

// Define a recursive type for tree nodes to handle children property correctly
type CategoryNode = Omit<Category, 'children'> & { children: CategoryNode[] };

const Sidebar: React.FC<SidebarProps> = ({ 
  categories, 
  selectedCategoryId, 
  onSelectCategory, 
  onSelectFavorites, 
  isFavoritesSelected,
  user,
  onLogout
}) => {
  
  // Helper to build tree
  const buildTree = (cats: Category[]) => {
    const map = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];
    
    // Initialize map with CategoryNodes (casting as we know we are adding children property)
    cats.forEach(c => map.set(c.id, { ...c, children: [] } as CategoryNode));
    
    cats.forEach(c => {
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId)!.children.push(map.get(c.id)!);
      } else {
        roots.push(map.get(c.id)!);
      }
    });
    return roots;
  };

  const tree = buildTree(categories);

  const renderCategory = (cat: CategoryNode, depth: number) => {
    return (
      <div key={cat.id}>
        <div 
          onClick={() => onSelectCategory(cat.id)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
            selectedCategoryId === cat.id 
              ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' 
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
          style={{ marginLeft: `${depth * 12}px` }}
        >
          <IconFolder className="w-4 h-4" />
          <span className="text-sm font-medium">{cat.name}</span>
        </div>
        {cat.children.map(child => renderCategory(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full flex-shrink-0">
      <div className="p-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <span className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
             <span className="text-lg">⚡</span>
          </span>
          AI Prompt Lab
        </h1>
      </div>

      <div className="p-3 flex-1 overflow-y-auto">
        {/* Main Nav */}
        <div className="mb-6">
          <button 
            onClick={onSelectFavorites}
            className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md transition-colors mb-2 ${
              isFavoritesSelected 
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <IconStar className="w-4 h-4" />
            <span className="text-sm font-medium">Favorites</span>
          </button>
        </div>

        {/* Categories Tree */}
        <div className="space-y-1">
          <div className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Categories
          </div>
          {tree.map(node => renderCategory(node, 0))}
        </div>
      </div>
      
      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                <IconUser className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-medium text-slate-200 truncate w-24">{user.name}</div>
                <div className="text-xs text-slate-500 truncate w-24">Free Plan</div>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
              title="Sign Out"
            >
              <IconLogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
           <div className="text-xs text-slate-500 text-center">
             v1.0.0 &bull; Powered by Gemini
           </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;