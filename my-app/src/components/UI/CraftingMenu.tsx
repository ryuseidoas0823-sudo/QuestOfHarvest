import React, { useState } from 'react';
import { Item, CraftingRecipe, PlayerEntity } from '../../features/game/types';

interface CraftingMenuProps {
  player: PlayerEntity;
  recipes: CraftingRecipe[];
  onClose: () => void;
  onCraft: (recipe: CraftingRecipe) => void;
}

export const CraftingMenu: React.FC<CraftingMenuProps> = ({ player, recipes, onClose, onCraft }) => {
  const [selectedRecipe, setSelectedRecipe] = useState<CraftingRecipe | null>(null);

  // 素材を持っているかチェック
  const checkMaterials = (recipe: CraftingRecipe) => {
    for (const mat of recipe.materials) {
      const count = player.inventory.filter(i => i.materialType === mat.materialType).length;
      if (count < mat.count) return false;
    }
    return true;
  };

  const handleCraft = () => {
    if (selectedRecipe && checkMaterials(selectedRecipe) && player.gold >= selectedRecipe.cost) {
      onCraft(selectedRecipe);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-slate-800 w-[800px] h-[600px] rounded-xl shadow-2xl border border-slate-600 flex overflow-hidden">
        
        {/* Recipe List */}
        <div className="w-1/3 bg-slate-900 border-r border-slate-700 overflow-y-auto p-4">
          <h3 className="text-xl font-bold text-yellow-500 mb-4 border-b border-slate-700 pb-2">Blacksmith</h3>
          <div className="space-y-2">
            {recipes.map(recipe => (
              <button
                key={recipe.id}
                onClick={() => setSelectedRecipe(recipe)}
                className={`w-full text-left p-3 rounded flex items-center gap-3 transition-colors ${
                  selectedRecipe?.id === recipe.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                }`}
              >
                <span className="text-2xl">{recipe.result.icon}</span>
                <div>
                  <div className="font-bold">{recipe.name}</div>
                  <div className="text-xs opacity-70">{recipe.category}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Details & Craft */}
        <div className="flex-1 p-6 flex flex-col">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold text-white">Crafting</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
          </div>

          {selectedRecipe ? (
            <div className="mt-6 flex-1 flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-24 h-24 bg-slate-700 rounded-lg flex items-center justify-center text-6xl border-2 border-slate-500">
                  {selectedRecipe.result.icon}
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white">{selectedRecipe.result.name}</h3>
                  <p className="text-gray-400 mt-1">{selectedRecipe.description}</p>
                  {selectedRecipe.result.weaponStats && (
                    <div className="mt-2 text-sm text-blue-300">
                      ATK: {selectedRecipe.result.weaponStats.slash + selectedRecipe.result.weaponStats.blunt} | Speed: {selectedRecipe.result.weaponStats.attackSpeed}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 mb-6">
                <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Required Materials</h4>
                <div className="space-y-2">
                  {selectedRecipe.materials.map((mat, idx) => {
                    const have = player.inventory.filter(i => i.materialType === mat.materialType).length;
                    const hasEnough = have >= mat.count;
                    return (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-gray-300 capitalize">{mat.materialType}</span>
                        <span className={`font-mono ${hasEnough ? 'text-green-400' : 'text-red-400'}`}>
                          {have} / {mat.count}
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-700 mt-2">
                    <span className="text-yellow-500">Gold Cost</span>
                    <span className={`font-mono ${player.gold >= selectedRecipe.cost ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedRecipe.cost} G
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <button
                  onClick={handleCraft}
                  disabled={!checkMaterials(selectedRecipe) || player.gold < selectedRecipe.cost}
                  className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
                    checkMaterials(selectedRecipe) && player.gold >= selectedRecipe.cost
                      ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg hover:shadow-yellow-500/20'
                      : 'bg-slate-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Craft Item
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a recipe to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
