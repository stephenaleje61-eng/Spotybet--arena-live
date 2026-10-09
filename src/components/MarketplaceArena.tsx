import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { MarketplaceItem } from '../types';
import {
  ShoppingBag,
  Search,
  PlusCircle,
  MapPin,
  ShieldCheck,
  Trash2,
  X,
  MessageSquare,
  Info,
} from 'lucide-react';

interface MarketplaceArenaProps {
  onOpenChatWithSeller?: (sellerId: string, sellerName: string) => void;
}

export const MarketplaceArena: React.FC<MarketplaceArenaProps> = ({ onOpenChatWithSeller }) => {
  const { user, isAdmin, openAuthModal } = useAuth();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected item modal
  const [activeItem, setActiveItem] = useState<MarketplaceItem | null>(null);

  // New item modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MarketplaceItem['category']>('Jersey & Apparel');
  const [price, setPrice] = useState('50');
  const [currency, setCurrency] = useState<'USD' | 'NGN' | 'EUR' | 'GBP'>('USD');
  const [condition, setCondition] = useState<MarketplaceItem['condition']>('Brand New');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [location, setLocation] = useState('London, UK');
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.getMarketplace(selectedCategory, searchQuery);
      setItems(res.items);
    } catch (err) {
      console.error('Error fetching marketplace:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [selectedCategory, searchQuery]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }

    setSubmitting(true);
    try {
      await api.createMarketplaceItem({
        title,
        category,
        price: Number(price) || 0,
        currency,
        condition,
        description,
        imageUrl: imageUrl || undefined,
        location,
      });

      setCreateModalOpen(false);
      setTitle('');
      setDescription('');
      setImageUrl('');
      fetchItems();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error creating listing');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this listing?')) return;
    try {
      await api.deleteMarketplaceItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
      setActiveItem(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting item');
    }
  };

  const categories = [
    'All',
    'Jersey & Apparel',
    'Footwear & Boots',
    'Memorabilia',
    'Guides & Strategy',
    'Match Tickets',
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-2">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>SPORTS MARKETPLACE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">ARENA SPORTS EXCHANGE</h2>
            <p className="text-xs text-neutral-400 mt-1">
              Real community marketplace for football kits, authentic match gear, collectibles, and strategy guides.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (!user) openAuthModal('login');
                else setCreateModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-blue-500/25 hover:bg-blue-500 transition-all hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post New Listing</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'border border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mt-4 pt-4 border-t border-neutral-800">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search gear, jerseys, tickets..."
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:border-blue-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Free Community Exchange Transparency Notice */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-xs text-neutral-400 flex items-center gap-2.5">
        <Info className="h-4 w-4 text-blue-400 shrink-0" />
        <span>
          <strong className="text-white">Community Direct Exchange:</strong> Safe Picks Arena does not charge transaction fees or take commissions. Buyers and sellers communicate directly via Arena Chat. Exercise common sense safety for physical shipments.
        </span>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-3xl border border-neutral-800 bg-neutral-900">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-12 text-center text-neutral-400">
          <ShoppingBag className="mx-auto h-8 w-8 text-neutral-600 mb-2" />
          <p className="text-sm">No items found matching your criteria.</p>
          <button
            onClick={() => {
              if (!user) openAuthModal('login');
              else setCreateModalOpen(true);
            }}
            className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white"
          >
            Create First Listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {items.map(item => (
            <div
              key={item.id}
              onClick={() => setActiveItem(item)}
              className="group rounded-3xl border border-neutral-800 bg-neutral-900/80 p-4 hover:border-blue-400/50 hover:bg-neutral-900 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="relative mb-3 h-36 w-full rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      onError={e => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-neutral-600 group-hover:text-blue-400 transition-colors">
                      <ShoppingBag className="h-10 w-10 stroke-[1.5]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>
                  )}

                  <span className="absolute top-2 right-2 rounded-lg bg-neutral-900/90 border border-neutral-700 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                    {item.condition}
                  </span>
                </div>

                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">
                  {item.category}
                </div>
                <h3 className="text-sm font-black text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{item.description}</p>
              </div>

              <div className="pt-3 border-t border-neutral-800/80 mt-3 flex items-center justify-between">
                <div className="font-mono text-base font-black text-white">
                  {item.currency === 'USD' ? '$' : item.currency === 'EUR' ? '€' : item.currency === 'GBP' ? '£' : '₦'}
                  {item.price}
                </div>

                <span className="text-[11px] font-bold text-blue-400 group-hover:underline">
                  View Details →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ITEM DETAILS MODAL */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-3xl border border-blue-500/30 bg-neutral-900 p-6 text-white shadow-2xl">
            <button
              onClick={() => setActiveItem(null)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2.5 py-0.5 text-xs font-bold">
                {activeItem.category}
              </span>
              <span className="rounded-lg bg-neutral-800 px-2.5 py-0.5 text-xs text-neutral-300">
                {activeItem.condition}
              </span>
            </div>

            <h3 className="text-xl font-black text-white mb-2">{activeItem.title}</h3>

            <div className="font-mono text-2xl font-black text-blue-400 mb-4">
              {activeItem.currency === 'USD' ? '$' : activeItem.currency === 'EUR' ? '€' : activeItem.currency === 'GBP' ? '£' : '₦'}
              {activeItem.price} {activeItem.currency}
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed mb-4 bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
              {activeItem.description}
            </p>

            <div className="space-y-2 text-xs text-neutral-400 border-t border-neutral-800 pt-3 mb-6">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>Location: {activeItem.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Seller: {activeItem.sellerName}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (!user) {
                    openAuthModal('login');
                    return;
                  }
                  if (onOpenChatWithSeller) {
                    onOpenChatWithSeller(activeItem.sellerId, activeItem.sellerName);
                    setActiveItem(null);
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-black text-white hover:bg-blue-500 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Contact Seller in Arena Chat</span>
              </button>

              {(user?.id === activeItem.sellerId || isAdmin) && (
                <button
                  onClick={() => handleDelete(activeItem.id)}
                  className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-400 hover:bg-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW LISTING MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-3xl border border-blue-500/30 bg-neutral-900 p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white mb-1">Post Item to Marketplace</h3>
            <p className="text-xs text-neutral-400 mb-4">
              List authentic jerseys, memorabilia, or equipment for arena members.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Item Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. 2024/25 Arsenal Home Jersey (Size L)"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-xs text-white focus:border-blue-400 focus:outline-none"
                  >
                    <option value="Jersey & Apparel">Jersey & Apparel</option>
                    <option value="Footwear & Boots">Footwear & Boots</option>
                    <option value="Memorabilia">Memorabilia</option>
                    <option value="Guides & Strategy">Guides & Strategy</option>
                    <option value="Match Tickets">Match Tickets</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                    Condition
                  </label>
                  <select
                    value={condition}
                    onChange={e => setCondition(e.target.value as any)}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-xs text-white focus:border-blue-400 focus:outline-none"
                  >
                    <option value="Brand New">Brand New</option>
                    <option value="Like New">Like New</option>
                    <option value="Good Condition">Good Condition</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                    Price *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value as any)}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-xs text-white focus:border-blue-400 focus:outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="NGN">NGN (₦)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Item Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Detail authenticity, condition, sizing, and shipment notes..."
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Location / Shipping
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Lagos, Nigeria / Worldwide"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-blue-600 py-3 font-black text-white text-xs hover:bg-blue-500 transition-all disabled:opacity-50"
              >
                {submitting ? 'Publishing...' : 'Publish Item Listing'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
