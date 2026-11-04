import { LanguageSelector, useLanguage } from '../context/LanguageContext';
import React, { useState } from 'react';
import { useRegistry } from '../context/RegistryContext';
import { GiftItem, GiftCategory } from '../types';
import { ContributeModal } from './ContributeModal';
import { Heart, Search, Check, Sparkles, MapPin, Calendar, ShieldCheck, ArrowRight, Gift, Camera, CreditCard } from 'lucide-react';

export const GuestRegistryView: React.FC = () => {
  const { language, t } = useLanguage();
  const { gifts, settings, totalRaised, totalTarget, setActiveView } = useRegistry();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeGiftForContribute, setActiveGiftForContribute] = useState<GiftItem | null>(null);

  const filteredGifts = gifts.filter((gift) => {
    const matchesSearch =
      gift.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gift.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gift.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      [gift.titleEn, gift.subtitleEn, gift.descriptionEn].some(value => value?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const percentOverall = totalTarget > 0 ? Math.min(100, Math.round((totalRaised / totalTarget) * 100)) : 0;
  const stripeReady = settings.stripeEnabled && settings.stripeStatus === 'connected' && Boolean(settings.stripeAccountId);
  const weddingFund: GiftItem = {
    id: 'wedding-fund',
    title: t('Contributo libero per gli sposi', 'A gift for the couple'),
    subtitle: t('Un regalo da destinare ai nostri progetti insieme', 'A gift for our future together'),
    category: 'custom',
    description: t('Scegli liberamente l’importo del tuo dono.', 'Choose the amount you would like to give.'),
    imageUrl: settings.heroImage,
    targetAmount: 0,
    raisedAmount: 0,
    isInfiniteQuota: true,
    status: 'available',
    contributionsCount: 0,
    createdAt: new Date(0).toISOString(),
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] pb-20">
      <LanguageSelector />
      {/* 1. Hero Section: Messaggio degli Sposi (Senza Immagine Copertina) */}
      <section className="relative overflow-hidden border-b border-stone-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 text-center space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#BCBF97]/25 text-[#484c2e] text-xs font-semibold tracking-wider uppercase">
              <MapPin className="w-3.5 h-3.5 text-[#636842]" />
              <span>{settings.eventLocation}</span>
            </div>

            <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-stone-900 leading-tight">
              {settings.coupleNames}
            </h1>
            <p className="text-xs uppercase tracking-widest text-[#636842] font-semibold">
              {language === 'en' ? (settings.eventTitleEn || (settings.eventTitle === 'La nostra lista nozze' ? 'Our wedding registry' : settings.eventTitle)) : settings.eventTitle}
            </p>
          </div>

          {/* Romantic Welcome Card */}
          <div className="p-6 sm:p-8 bg-stone-50/90 rounded-2xl border border-stone-200 shadow-2xs relative text-left">
            <p className="font-editorial italic text-stone-800 text-lg sm:text-xl leading-relaxed text-center">
              "{language === 'en' ? (settings.welcomeMessageEn || settings.welcomeMessage) : settings.welcomeMessage}"
            </p>
            <div className="mt-4 pt-4 border-t border-stone-200/80 flex items-center justify-between text-xs text-stone-500">
              <span>{t('Con affetto profondo,', 'With all our love,')}</span>
              <span className="text-xs sm:text-sm font-semibold text-stone-800">
                {settings.coupleNames}
              </span>
            </div>
          </div>

          {/* Live registry meter & trust pill */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#BCBF97]/15 rounded-xl border border-[#BCBF97]/60 text-left">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-900">
                <span>{t('Stato Raccolta Lista Desideri', 'Registry progress')}</span>
                <span className="text-stone-400">·</span>
                <span className="tabular-nums">{percentOverall}% {t('completato', 'complete')}</span>
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
              <span>{t('Pagamento con carta Stripe o bonifico IBAN', 'Pay by card with Stripe or bank transfer')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Direct payment area for guests who want to make a free contribution. */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/50 shadow-xs">
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
                <Heart className="h-5 w-5" fill="currentColor" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">{t('Un regalo per noi', 'A gift for us')}</span>
                <h2 className="mt-1 font-editorial text-2xl font-bold text-stone-900">{t('Invia un contributo libero agli sposi', 'Give any amount to the couple')}</h2>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-stone-600">{t('Scegli l’importo del tuo regalo e paga in modo sicuro con carta tramite Stripe.', 'Choose your gift amount and pay securely by card with Stripe.')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveGiftForContribute(weddingFund)}
              className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold shadow-sm transition-colors ${stripeReady ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'bg-[#636842] text-white hover:bg-[#525636]'}`}
            >
              {stripeReady ? <CreditCard className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
              {stripeReady ? t('Dona con carta', 'Give by card') : t('Invia un contributo', 'Give a gift')}
            </button>
          </div>
          <div className="flex items-center gap-2 border-t border-emerald-200/80 bg-white/70 px-6 py-3 text-xs text-stone-600 sm:px-8">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            {stripeReady ? t('Il pagamento viene elaborato da Stripe: i dati della carta non passano da questo sito.', 'Stripe processes your payment; your card details do not pass through this site.') : t('Potrai scegliere le modalità di pagamento disponibili per questa lista.', 'You can choose from the payment methods available for this registry.')}
          </div>
        </div>
      </section>

      {/* 3. Search & Desires Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <h3 className="font-editorial text-2xl font-bold text-stone-900">
              {t('I Desideri degli Sposi', 'The Couple’s Wishes')}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {t('Partecipa con un contributo libero al regalo che preferisci', 'Contribute any amount towards the gift of your choice')}
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder={t('Cerca nella lista regali...', 'Search the gift list...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#BCBF97]"
            />
          </div>
        </div>
      </section>

      {/* 4. Gifts Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {gifts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-8 max-w-xl mx-auto shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#BCBF97]/25 text-[#636842] flex items-center justify-center mb-4">
              <Gift className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-1">
              {t('La lista regali è pronta!', 'The gift list is ready!')}
            </h3>
            <p className="text-xs text-stone-600 mb-6 max-w-md mx-auto leading-relaxed">
              {t('Non hai ancora inserito nessun regalo. Aggiungi i primi desideri o le quote per il viaggio di nozze con quota libera PayPal o bonifico.', 'No gifts have been added yet.')}
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
            <p className="text-stone-600 text-sm font-medium">{t('Nessun regalo trovato per questo filtro.', 'No gifts found for this search.')}</p>
            <button
              onClick={() => {
                setSearchQuery('');
              }}
              className="mt-3 text-xs text-[#636842] hover:underline font-bold cursor-pointer"
            >
              {t('Mostra tutti i regali', 'Show all gifts')}
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
                  {/* Image container (vertical aspect ratio) */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
                    <img
                      src={gift.imageUrl}
                      alt={language === 'en' ? (gift.titleEn || gift.title) : gift.title}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    {isCompleted && (
                      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-2xs flex items-center justify-center">
                        <span className="bg-white/95 text-stone-900 text-xs font-semibold px-3 py-1 rounded-md shadow-sm">
                          {t('Completato con Amore', 'Completed with love')}
                        </span>
                      </div>
                    )}
                    {gift.isPriority && !isCompleted && (
                      <div className="absolute top-3 right-3 bg-[#636842] text-white text-[11px] font-semibold px-2.5 py-0.5 rounded shadow-sm">
                        {t('Desiderio Speciale', 'Special wish')}
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[11px] text-stone-400 font-medium">
                        <span>{gift.contributionsCount} {gift.contributionsCount === 1 ? t('quota versata', 'contribution') : t('quote versate', 'contributions')}</span>
                      </div>

                      <h3 className="font-editorial text-[0.80rem] font-semibold text-stone-900 leading-snug">
                        {language === 'en' ? (gift.titleEn || gift.title) : gift.title}
                      </h3>
                      <p className="text-xs text-stone-500 font-medium">{language === 'en' ? (gift.subtitleEn || gift.subtitle) : gift.subtitle}</p>
                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed pt-1">
                        {language === 'en' ? (gift.descriptionEn || gift.description) : gift.description}
                      </p>
                    </div>

                    {/* Progress Bar & Amounts */}
                    <div className="space-y-3 pt-2 border-t border-stone-100">
                      <div>
                        <div className="flex items-baseline justify-between text-xs mb-1.5">
                          <span className="text-stone-500 font-medium">{t('Avanzamento:', 'Progress:')}</span>
                          <span className="font-bold text-[#636842] tabular-nums text-sm">
                            {gift.isInfiniteQuota ? t('Quota libera', 'Any amount') : `${percent}%`}
                          </span>
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
                        <span>{t('Contributo libero', 'Give any amount')}</span>
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
