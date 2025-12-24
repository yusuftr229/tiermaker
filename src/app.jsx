import React, { useState, useEffect } from 'react';
import { GripVertical, Plus, X, Upload, Type, Share2, Download } from 'lucide-react';

const DEFAULT_TIERS = [
  { id: 's-tier', name: 'S', color: 'bg-red-500', items: [] },
  { id: 'a-tier', name: 'A', color: 'bg-orange-500', items: [] },
  { id: 'b-tier', name: 'B', color: 'bg-yellow-500', items: [] },
  { id: 'c-tier', name: 'C', color: 'bg-green-500', items: [] },
  { id: 'd-tier', name: 'D', color: 'bg-blue-500', items: [] }
];

const COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 
  'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-gray-500'
];

export default function TierListMaker() {
  const [tiers, setTiers] = useState(DEFAULT_TIERS);
  const [unranked, setUnranked] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedFromTier, setDraggedFromTier] = useState(null);
  const [newTierName, setNewTierName] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Load state from URL or localStorage on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      try {
        const decoded = atob(hash);
        const state = JSON.parse(decoded);
        setTiers(state.tiers || DEFAULT_TIERS);
        setUnranked(state.unranked || []);
      } catch (e) {
        console.error('Failed to load from URL:', e);
        loadFromLocalStorage();
      }
    } else {
      loadFromLocalStorage();
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    const state = { tiers, unranked };
    localStorage.setItem('tierListState', JSON.stringify(state));
  }, [tiers, unranked]);

  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem('tierListState');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        setTiers(state.tiers || DEFAULT_TIERS);
        setUnranked(state.unranked || []);
      } catch (e) {
        console.error('Failed to load from localStorage:', e);
      }
    }
  };

  const generateShareLink = () => {
    const state = { tiers, unranked };
    const encoded = btoa(JSON.stringify(state));
    const url = `${window.location.origin}${window.location.pathname}#${encoded}`;
    setShareUrl(url);
    setShowShareModal(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('Link copied to clipboard!');
  };

  const addTextItem = () => {
    const text = prompt('Enter item text:');
    if (text && text.trim()) {
      const newItem = {
        id: `item-${Date.now()}`,
        type: 'text',
        content: text.trim(),
        label: ''
      };
      setUnranked([...unranked, newItem]);
    }
  };

  const addImageItem = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newItem = {
          id: `item-${Date.now()}`,
          type: 'image',
          content: event.target.result,
          label: ''
        };
        setUnranked([...unranked, newItem]);
      };
      reader.readAsDataURL(file);
    }
  };

  const addTier = () => {
    if (newTierName.trim()) {
      const newTier = {
        id: `tier-${Date.now()}`,
        name: newTierName.trim(),
        color: COLORS[tiers.length % COLORS.length],
        items: []
      };
      setTiers([...tiers, newTier]);
      setNewTierName('');
    }
  };

  const removeTier = (tierId) => {
    const tier = tiers.find(t => t.id === tierId);
    if (tier) {
      setUnranked([...unranked, ...tier.items]);
      setTiers(tiers.filter(t => t.id !== tierId));
    }
  };

  const renameTier = (tierId) => {
    const newName = prompt('Enter new tier name:');
    if (newName && newName.trim()) {
      setTiers(tiers.map(t => 
        t.id === tierId ? { ...t, name: newName.trim() } : t
      ));
    }
  };

  const moveTierUp = (index) => {
    if (index > 0) {
      const newTiers = [...tiers];
      [newTiers[index - 1], newTiers[index]] = [newTiers[index], newTiers[index - 1]];
      setTiers(newTiers);
    }
  };

  const moveTierDown = (index) => {
    if (index < tiers.length - 1) {
      const newTiers = [...tiers];
      [newTiers[index], newTiers[index + 1]] = [newTiers[index + 1], newTiers[index]];
      setTiers(newTiers);
    }
  };

  const handleDragStart = (item, sourceTierId) => {
    setDraggedItem(item);
    setDraggedFromTier(sourceTierId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (targetTierId) => {
    if (!draggedItem) return;

    // Remove from source
    if (draggedFromTier === 'unranked') {
      setUnranked(unranked.filter(i => i.id !== draggedItem.id));
    } else {
      setTiers(tiers.map(t => 
        t.id === draggedFromTier 
          ? { ...t, items: t.items.filter(i => i.id !== draggedItem.id) }
          : t
      ));
    }

    // Add to target
    if (targetTierId === 'unranked') {
      setUnranked([...unranked, draggedItem]);
    } else {
      setTiers(tiers.map(t => 
        t.id === targetTierId 
          ? { ...t, items: [...t.items, draggedItem] }
          : t
      ));
    }

    setDraggedItem(null);
    setDraggedFromTier(null);
  };

  const exportAsImage = () => {
    alert('Export feature: Take a screenshot of your tier list or use browser print to PDF!');
  };

  const reset = () => {
    if (confirm('Reset entire tier list? This cannot be undone.')) {
      setTiers(DEFAULT_TIERS);
      setUnranked([]);
      window.location.hash = '';
    }
  };

  const ItemCard = ({ item, tierId }) => (
    <div
      draggable
      onDragStart={() => handleDragStart(item, tierId)}
      className="bg-white border-2 border-gray-300 rounded p-2 cursor-move hover:border-gray-500 flex-shrink-0 w-20 h-20 flex flex-col items-center justify-center"
    >
      {item.type === 'text' ? (
        <div className="text-xs text-center break-words w-full">{item.content}</div>
      ) : (
        <img src={item.content} alt={item.label} className="w-full h-full object-cover rounded" />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h1 className="text-3xl font-bold mb-4">Zero-Budget Tier List Maker</h1>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={addTextItem}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <Type size={16} /> Add Text Item
            </button>
            
            <label className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer">
              <Upload size={16} /> Add Image Item
              <input type="file" accept="image/*" onChange={addImageItem} className="hidden" />
            </label>

            <button
              onClick={generateShareLink}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              <Share2 size={16} /> Share
            </button>

            <button
              onClick={exportAsImage}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              <Download size={16} /> Export
            </button>

            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Reset
            </button>
          </div>

          {/* Add Tier */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New tier name"
              value={newTierName}
              onChange={(e) => setNewTierName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTier()}
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              onClick={addTier}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
            >
              <Plus size={16} /> Add Tier
            </button>
          </div>
        </div>

        {/* Tier List */}
        <div className="space-y-2">
          {tiers.map((tier, index) => (
            <div key={tier.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="flex">
                {/* Tier Label */}
                <div className={`${tier.color} text-white font-bold text-2xl p-4 flex items-center justify-center min-w-[100px] relative`}>
                  <div className="text-center">
                    <div>{tier.name}</div>
                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={() => moveTierUp(index)}
                        className="text-xs bg-black bg-opacity-30 hover:bg-opacity-50 px-2 py-1 rounded"
                        disabled={index === 0}
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveTierDown(index)}
                        className="text-xs bg-black bg-opacity-30 hover:bg-opacity-50 px-2 py-1 rounded"
                        disabled={index === tiers.length - 1}
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => renameTier(tier.id)}
                    className="absolute top-2 right-2 text-xs bg-black bg-opacity-30 hover:bg-opacity-50 px-2 py-1 rounded"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => removeTier(tier.id)}
                    className="absolute bottom-2 right-2 text-white hover:text-red-200"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(tier.id)}
                  className="flex-1 p-4 min-h-[100px] flex flex-wrap gap-2 items-start bg-gray-50"
                >
                  {tier.items.length === 0 ? (
                    <div className="text-gray-400 italic w-full text-center py-8">
                      Drop items here
                    </div>
                  ) : (
                    tier.items.map(item => (
                      <ItemCard key={item.id} item={item} tierId={tier.id} />
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Unranked Items */}
        <div className="bg-white rounded-lg shadow-md p-4 mt-4">
          <h2 className="text-xl font-bold mb-3">Unranked Items</h2>
          <div
            onDragOver={handleDragOver}
            onDrop={() => handleDrop('unranked')}
            className="min-h-[120px] border-2 border-dashed border-gray-300 rounded p-4 flex flex-wrap gap-2"
          >
            {unranked.length === 0 ? (
              <div className="text-gray-400 italic w-full text-center py-8">
                No unranked items. Add text or image items above.
              </div>
            ) : (
              unranked.map(item => (
                <ItemCard key={item.id} item={item} tierId="unranked" />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-2xl font-bold mb-4">Share Your Tier List</h2>
            <p className="text-gray-600 mb-4">
              Copy this link to share your tier list. Anyone with this link can view it.
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 border rounded bg-gray-50"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Copy
              </button>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}