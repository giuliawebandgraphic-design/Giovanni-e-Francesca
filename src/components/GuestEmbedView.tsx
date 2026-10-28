import React, { useState, useEffect } from 'react';
import { useRegistry } from '../context/RegistryContext';
import { GiftItem } from '../types';
import { ContributeModal } from './ContributeModal';
import { Gift, ArrowRight } from 'lucide-react';

export const GuestEmbedView: React.FC = () => {
  const { gifts, refreshRegistry } = useRegistry();
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
  }, [gifts]);

  return (
    <div className="w-full bg-transparent text-stone-900 font-sans pb-4 selection:bg-[#BCBF97]/40">
      <main className="max-w-6xl mx-auto px-2 sm:px-4">
        {gifts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-8 space-y-3">
            <Gift className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-stone-600 text-sm font-medium">Non ci sono ancora desideri da mostrare.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gifts.map((gift) => {
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
                  {/* Foto del Regalo (Proporzione Verticale) */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
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
                      <div className="absolute top-3 right-3 px-2.5 py-1 bg-emerald-700/90 text-white text-[11px] font-bold rounded-full shadow-2xs backdrop-blur-xs flex items-center gap-1">
                        <span>Obiettivo 100% ✓</span>
                      </div>
                    )}
                  </div>

                  {/* Dettagli del Desiderio */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <h3 className="font-editorial text-[16px] font-semibold text-stone-900 leading-snug line-clamp-1">
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
                        <span className="text-stone-500 font-medium">
                          {gift.isInfiniteQuota ? 'Quota libera' : 'Avanzamento'}
                        </span>
                        {!gift.isInfiniteQuota && (
                          <span className="font-bold text-[#636842] tabular-nums text-sm">
                            {percent}%
                          </span>
                        )}
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
                        <span>Contributo libero</span>
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
