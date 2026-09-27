import React, { useState, useEffect } from 'react';
import { useRegistry } from '../context/RegistryContext';
import { GiftItem } from '../types';
import { ContributeModal } from './ContributeModal';
import { Search, Gift, ArrowRight } from 'lucide-react';

export const GuestEmbedView: React.FC = () => {
  const { gifts, settings, refreshRegistry } = useRegistry();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeGiftForContribute, setActiveGiftForContribute] = useState<GiftItem | null>(null);

  // Auto-fetch fresh registry data on mount and listen to refresh messages
  useEffect(() => {
    refreshRegistry();

    const handleMessage = (event: MessageEvent) => {
      if (event.data && (event.data.type === 'GIVEN2_REFRESH' || event.data.type === 'REGISTRY_UPDATED')) {
        refreshRegistry();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Post dynamic height to parent container (so external website iframe auto-resizes seamlessly without scrollbars)
  useEffect(() => {
    const notifyHeight = () => {
      if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        const height = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.offsetHeight
        );
        window.parent.postMessage({ type: 'GIVEN2_RESIZE_IFRAME', height }, '*');
      }
    };

    notifyHeight();
    const timer = setTimeout(notifyHeight, 250);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => notifyHeight());
      observer.observe(document.body);
    }

    window.addEventListener('resize', notifyHeight);
    return () => {
      clearTimeout(timer);
      if (observer) observer.disconnect();
      window.removeEventListener('resize', notifyHeight);
    };
  }, [gifts, selectedCategory, searchQuery]);

  const categories = [
    { key: 'all', label: 'Tutti i Desideri' },
    { key: 'honeymoon', label: 'Viaggio di Nozze' },
    { key: 'home', label: 'Casa & Arredo' },
    { key: 'experience', label: 'Esperienze' },
    { key: 'custom', label: 'Fondo Libero' },
  ];

  const filteredGifts = gifts.filter((gift) => {
    const matchesCategory = selectedCategory === 'all' || gift.category === selectedCategory;
    const matchesSearch =
      gift.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gift.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gift.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full bg-transparent text-stone-900 font-sans pb-4 selection:bg-[#BCBF97]/40">
      {/* 1. Barra Filtri Categoria e Ricerca Desideri */}
      <div className="max-w-6xl mx-auto px-2 sm:px-4 pt-1 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/80">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.key
                    ? 'bg-[#636842] text-white shadow-2xs'
                    : 'bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Cerca desiderio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-stone-300 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#BCBF97]"
            />
          </div>
        </div>
      </div>

      {/* 2. Griglia Desideri (Solo i Regali / Quote) */}
      <main className="max-w-6xl mx-auto px-2 sm:px-4">
        {filteredGifts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-8 space-y-3">
            <Gift className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-stone-600 text-sm font-medium">Nessun desiderio trovato in questa categoria.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-[#636842] text-white text-xs font-semibold rounded-xl hover:bg-[#525636] transition-colors cursor-pointer"
            >
              Mostra tutti i desideri
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGifts.map((gift) => {
              const percent = gift.isInfiniteQuota
                ? 100
                : gift.targetAmount > 0
                ? Math.min(100, Math.round((gift.raisedAmount / gift.targetAmount) * 100))
                : 0;

              const isCompleted = !gift.isInfiniteQuota && gift.raisedAmount >= gift.targetAmount;

              return (
                <div
                  key={gift.id}
                  className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group"
                >
                  {/* Foto del Regalo */}
                  <div className="relative aspect-16/10 overflow-hidden bg-stone-100">
                    <img
                      src={gift.imageUrl}
                      alt={gift.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                      loading="lazy"
                    />

                    {gift.isPriority && (
                      <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#FFE68A] text-stone-900 rounded-full text-[11px] font-bold shadow-2xs">
                        In Evidenza
                      </div>
                    )}

                    {isCompleted && (
                      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
                        <span className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg uppercase tracking-wider">
                          Traguardo Raggiunto
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Dettagli del Desiderio */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#636842]">
                        {categories.find((c) => c.key === gift.category)?.label || gift.category}
                      </span>
                      <h3 className="font-editorial text-lg font-semibold text-stone-900 leading-snug line-clamp-1">
                        {gift.title}
                      </h3>
                      {gift.subtitle && (
                        <p className="text-xs text-stone-500 line-clamp-1">{gift.subtitle}</p>
                      )}
                      {gift.description && (
                        <p className="text-xs text-stone-600 line-clamp-2 pt-1">{gift.description}</p>
                      )}
                    </div>

                    {/* Stato Quota e Donazione */}
                    <div className="space-y-3 pt-3 border-t border-stone-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-stone-500">
                          {gift.isInfiniteQuota ? 'Quota libera' : `Raccolto (${percent}%)`}
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-bold text-stone-900 tabular-nums text-sm">
                            {settings.currency}{gift.raisedAmount.toLocaleString()}
                          </span>
                          {!gift.isInfiniteQuota && (
                            <span className="text-stone-400 text-xs">
                              / {settings.currency}{gift.targetAmount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {!gift.isInfiniteQuota && (
                        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#636842] rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setActiveGiftForContribute(gift)}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 bg-[#636842] hover:bg-[#525636] text-white shadow-xs transition-colors cursor-pointer"
                      >
                        <span>{isCompleted ? 'Aggiungi un’ulteriore quota' : 'Dona una quota libera'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modale Donazione / Quota (PayPal & Bonifico) */}
      {activeGiftForContribute && (
        <ContributeModal
          gift={activeGiftForContribute}
          onClose={() => setActiveGiftForContribute(null)}
        />
      )}
    </div>
  );
};
