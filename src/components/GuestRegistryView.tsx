import React, { useState } from 'react';
import { useRegistry } from '../context/RegistryContext';
import { GiftItem, GiftCategory } from '../types';
import { ContributeModal } from './ContributeModal';
import { Heart, Search, Check, Sparkles, MapPin, Calendar, ShieldCheck, ArrowRight, Gift, Camera } from 'lucide-react';

export const GuestRegistryView: React.FC = () => {
  const { gifts, settings, totalRaised, totalTarget, setActiveView } = useRegistry();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeGiftForContribute, setActiveGiftForContribute] = useState<GiftItem | null>(null);

  const categories: { key: string; label: string }[] = [
    { key: 'all', label: 'Tutti i Desideri' },
    { key: 'honeymoon', label: 'Viaggio di Nozze' },
    { key: 'home', label: 'Casa & Design' },
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
    <div className="min-h-screen bg-[#FAF9F5] pb-20">
      {/* 1. Hero Section: Messaggio degli Sposi (Senza Immagine Copertina) */}
      <section className="relative overflow-hidden border-b border-stone-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 text-center space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#BCBF97]/25 text-[#484c2e] text-xs font-semibold tracking-wider uppercase">
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

            <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-stone-900 leading-tight">
              {settings.coupleNames}
            </h1>
            <p className="text-xs uppercase tracking-widest text-[#636842] font-semibold">
              {settings.eventTitle}
            </p>
          </div>

          {/* Romantic Welcome Card */}
          <div className="p-6 sm:p-8 bg-stone-50/90 rounded-2xl border border-stone-200 shadow-2xs relative text-left">
            <p className="font-editorial italic text-stone-800 text-lg sm:text-xl leading-relaxed text-center">
              "{settings.welcomeMessage}"
            </p>
            <div className="mt-4 pt-4 border-t border-stone-200/80 flex items-center justify-between text-xs text-stone-500">
              <span>Con affetto profondo,</span>
              <span className="text-xs sm:text-sm font-semibold text-stone-800">
                {settings.coupleNames}
              </span>
            </div>
          </div>

          {/* Live registry meter & trust pill */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#BCBF97]/15 rounded-xl border border-[#BCBF97]/60 text-left">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-900">
                <span>Stato Raccolta Lista Desideri</span>
                <span className="text-stone-400">·</span>
                <span className="tabular-nums">{percentOverall}% completato</span>
              </div>
              <div className="w-48 sm:w-64 h-2 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#8c9167] transition-all duration-500 rounded-full"
                  style={{ width: `${percentOverall}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-stone-700 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#696d48]" />
              <span>Versamento diretto su PayPal & Bonifico</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Filter & Search Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          {/* Interactive filter tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.key
                    ? 'bg-[#636842] text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Cerca regalo o esperienza..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#BCBF97]"
            />
          </div>
        </div>
      </section>

      {/* 3. Gifts Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {gifts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-8 max-w-xl mx-auto shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#BCBF97]/25 text-[#636842] flex items-center justify-center mb-4">
              <Gift className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-1">
              La lista regali è pronta!
            </h3>
            <p className="text-xs text-stone-600 mb-6 max-w-md mx-auto leading-relaxed">
              Non hai ancora inserito nessun regalo. Aggiungi i primi desideri o le quote per il viaggio di nozze con quota libera PayPal o bonifico.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setActiveView('organizer_gifts')}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#636842] hover:bg-[#525636] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                + Aggiungi Primo Desiderio
              </button>
              <button
                type="button"
                onClick={() => setActiveView('organizer_image')}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#FFE68A]/30 hover:bg-[#FFE68A]/50 text-stone-900 border border-amber-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Personalizza Foto Copertina
              </button>
            </div>
          </div>
        ) : filteredGifts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-200">
            <Gift className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-600 text-sm font-medium">Nessun regalo trovato per questo filtro.</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="mt-3 text-xs text-[#636842] hover:underline font-bold cursor-pointer"
            >
              Mostra tutti i regali
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredGifts.map((gift) => {
              const isCompleted = gift.status === 'completed';
              const percent = gift.isInfiniteQuota
                ? 100
                : Math.min(100, Math.round((gift.raisedAmount / gift.targetAmount) * 100));

              return (
                <div
                  key={gift.id}
                  className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col"
                >
                  {/* Image container */}
                  <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
                    <img
                      src={gift.imageUrl}
                      alt={gift.title}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    {isCompleted && (
                      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-2xs flex items-center justify-center">
                        <span className="bg-white/95 text-stone-900 text-xs font-semibold px-3 py-1 rounded-md shadow-sm">
                          Completato con Amore
                        </span>
                      </div>
                    )}
                    {gift.isPriority && !isCompleted && (
                      <div className="absolute top-3 right-3 bg-[#636842] text-white text-[11px] font-semibold px-2.5 py-0.5 rounded shadow-sm">
                        Desiderio Speciale
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[11px] text-stone-400 font-medium">
                        <span className="uppercase tracking-wider">
                          {gift.category === 'honeymoon'
                            ? 'Luna di Miele'
                            : gift.category === 'home'
                            ? 'Casa & Arredo'
                            : gift.category === 'experience'
                            ? 'Esperienza'
                            : 'Fondo Libero'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{gift.contributionsCount} {gift.contributionsCount === 1 ? 'quota versata' : 'quote versate'}</span>
                      </div>

                      <h3 className="font-editorial text-2xl font-semibold text-stone-900 leading-snug">
                        {gift.title}
                      </h3>
                      <p className="text-xs text-stone-500 font-medium">{gift.subtitle}</p>
                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed pt-1">
                        {gift.description}
                      </p>
                    </div>

                    {/* Progress Bar & Amounts */}
                    <div className="space-y-3 pt-2 border-t border-stone-100">
                      <div>
                        <div className="flex items-baseline justify-between text-xs mb-1.5">
                          <span className="text-stone-500">Raccolti:</span>
                          <div className="flex items-baseline gap-1">
                            <span className="font-semibold text-stone-900 tabular-nums text-sm">
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
                              className="h-full bg-[#8c9167] rounded-full transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <button
                        type="button"
                        onClick={() => setActiveGiftForContribute(gift)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isCompleted
                            ? 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            : 'bg-[#636842] hover:bg-[#525636] text-white shadow-xs'
                        }`}
                      >
                        <span>{isCompleted ? 'Aggiungi quota libera' : 'Dona quota libera a questo regalo'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Contribution Modal */}
      {activeGiftForContribute && (
        <ContributeModal
          gift={activeGiftForContribute}
          onClose={() => setActiveGiftForContribute(null)}
        />
      )}
    </div>
  );
};
