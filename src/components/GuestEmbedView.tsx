import React, { useState, useEffect } from 'react';
import { useRegistry } from '../context/RegistryContext';
import { GiftItem } from '../types';
import { ContributeModal } from './ContributeModal';
import { Calendar, MapPin, Heart, Search, Gift, ShieldCheck, ArrowRight } from 'lucide-react';

interface GuestEmbedViewProps {
  showHeroPhoto?: boolean;
}

export const GuestEmbedView: React.FC<GuestEmbedViewProps> = ({ showHeroPhoto = true }) => {
  const { gifts, settings, totalRaised, totalTarget, setActiveView } = useRegistry();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeGiftForContribute, setActiveGiftForContribute] = useState<GiftItem | null>(null);

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
    const timer = setTimeout(notifyHeight, 350);

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

  const percentOverall = totalTarget > 0 ? Math.min(100, Math.round((totalRaised / totalTarget) * 100)) : 0;

  return (
    <div className="w-full min-h-screen bg-[#FAF9F5] text-stone-900 font-sans pb-16 selection:bg-[#BCBF97]/40">
      {/* 1. Header con Messaggio degli Sposi */}
      <header className="bg-white border-b border-stone-200/90 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* Sottotitolo data e luogo */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#BCBF97]/25 text-[#484c2e] text-xs font-semibold tracking-wider uppercase">
              <Calendar className="w-3.5 h-3.5 text-[#636842]" />
              <span>
                {new Date(settings.eventDate).toLocaleDateString('it-IT', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span className="text-stone-300">·</span>
              <MapPin className="w-3.5 h-3.5 text-[#636842]" />
              <span>{settings.eventLocation}</span>
            </div>

            <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-stone-900">
              {settings.coupleNames}
            </h1>
            <p className="text-xs uppercase tracking-widest text-[#636842] font-semibold">
              Lista Nozze & Progetti di Vita
            </p>
          </div>

          {/* Card Messaggio degli Sposi */}
          <div className="bg-stone-50/90 rounded-2xl border border-stone-200 p-6 sm:p-8 max-w-3xl mx-auto shadow-2xs relative">
            <div className="w-8 h-8 rounded-full bg-[#BCBF97]/30 text-[#636842] flex items-center justify-center mx-auto mb-3">
              <Heart className="w-4 h-4 fill-current" />
            </div>

            <p className="font-editorial italic text-stone-800 text-lg sm:text-xl text-center leading-relaxed max-w-2xl mx-auto">
              "{settings.welcomeMessage}"
            </p>

            <div className="mt-5 pt-4 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
              <span>Con tutto il nostro affetto,</span>
              <span className="font-semibold text-stone-800 text-sm">{settings.coupleNames}</span>
            </div>
          </div>

          {/* Barra Informativa e Sicurezza */}
          <div className="mt-6 max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-[#BCBF97]/15 rounded-xl border border-[#BCBF97]/40 text-xs">
            <div className="flex items-center gap-2 text-stone-800 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#636842]" />
              <span>Versamenti diretti e sicuri tramite <strong>PayPal</strong> o <strong>Bonifico Bancario</strong></span>
            </div>
            <div className="text-stone-600 font-semibold tabular-nums">
              {gifts.length} Desideri disponibili
            </div>
          </div>
        </div>
      </header>

      {/* 2. Barra Filtri e Ricerca */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.key
                    ? 'bg-[#636842] text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Cerca regalo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-stone-300 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#BCBF97]"
            />
          </div>
        </div>
      </section>

      {/* 3. Griglia Desideri */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {filteredGifts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-8 space-y-3">
            <Gift className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-stone-600 text-sm font-medium">Nessun regalo trovato in questa categoria.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-[#636842] hover:bg-[#525636] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Mostra tutti i regali
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGifts.map((gift) => {
              const isCompleted = gift.status === 'completed';
              const percent = gift.isInfiniteQuota
                ? 100
                : Math.min(100, Math.round((gift.raisedAmount / gift.targetAmount) * 100));

              return (
                <div
                  key={gift.id}
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* Immagine */}
                    <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
                      <img
                        src={gift.imageUrl}
                        alt={gift.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-102"
                        referrerPolicy="no-referrer"
                      />
                      {isCompleted && (
                        <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-2xs flex items-center justify-center">
                          <span className="bg-white/95 text-stone-900 text-xs font-bold px-3 py-1 rounded-md shadow-sm">
                            Completato con Amore
                          </span>
                        </div>
                      )}
                      {gift.isPriority && !isCompleted && (
                        <div className="absolute top-2.5 right-2.5 bg-[#636842] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                          Desiderio Speciale
                        </div>
                      )}
                    </div>

                    {/* Dettagli */}
                    <div className="p-5 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#636842] font-semibold uppercase tracking-wider">
                        <span>
                          {gift.category === 'honeymoon'
                            ? 'Luna di Miele'
                            : gift.category === 'home'
                            ? 'Casa & Arredo'
                            : gift.category === 'experience'
                            ? 'Esperienza'
                            : 'Fondo Libero'}
                        </span>
                      </div>

                      <h3 className="font-editorial text-xl font-semibold text-stone-900 leading-snug">
                        {gift.title}
                      </h3>
                      <p className="text-xs text-stone-500 font-medium">{gift.subtitle}</p>
                      <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed pt-1">
                        {gift.description}
                      </p>
                    </div>
                  </div>

                  {/* Quota & Pulsante Verde Salvia */}
                  <div className="p-5 pt-0 space-y-3">
                    <div className="pt-3 border-t border-stone-100">
                      <div className="flex items-baseline justify-between text-xs mb-1.5">
                        <span className="text-stone-500">Raccolti:</span>
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
                    </div>

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
              );
            })}
          </div>
        )}
      </main>

      {/* Discreet footer with link back to Dashboard for the wedding couple */}
      <footer className="mt-16 pt-6 pb-4 border-t border-stone-200/80 text-center text-xs text-stone-400">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <span>{settings.coupleNames} · Lista Nozze Online</span>
          <span>·</span>
          <button
            type="button"
            onClick={() => setActiveView('organizer_dashboard')}
            className="text-stone-600 hover:text-[#636842] underline cursor-pointer font-semibold transition-colors"
          >
            Accesso Sposi &rarr; Apri Dashboard
          </button>
        </div>
      </footer>

      {/* Modale Donazione / Quota */}
      {activeGiftForContribute && (
        <ContributeModal
          gift={activeGiftForContribute}
          onClose={() => setActiveGiftForContribute(null)}
        />
      )}
    </div>
  );
};
