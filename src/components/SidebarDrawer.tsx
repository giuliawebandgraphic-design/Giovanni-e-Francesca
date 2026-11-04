import { useLanguage } from '../context/LanguageContext';
import React, { useEffect } from 'react';
import { useRegistry, AppView } from '../context/RegistryContext';
import { X, Check, Copy } from 'lucide-react';

export const SidebarDrawer: React.FC = () => {
  const { t } = useLanguage();
  const {
    isSidebarOpen,
    setIsSidebarOpen,
    activeView,
    setActiveView,
    settings,
    gifts,
    guests,
    donations,
    totalRaised,
    totalTarget,
    paypalTotal,
  } = useRegistry();

  const [copiedLink, setCopiedLink] = React.useState<boolean>(false);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen, setIsSidebarOpen]);

  // Prevent background scroll when sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  if (!isSidebarOpen) return null;

  const pendingThankYous = donations.filter((d) => !d.thankYouSent).length;
  const percent = totalTarget > 0 ? Math.min(100, Math.round((totalRaised / totalTarget) * 100)) : 0;

  const handleNavigate = (view: AppView) => {
    setActiveView(view);
    setIsSidebarOpen(false);
  };

  const handleCopyRegistryLink = () => {
    const registryUrl = window.location.origin;
    navigator.clipboard.writeText(registryUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={() => setIsSidebarOpen(false)}
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      {/* Slide-out Menu Panel */}
      <aside className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300 border-r border-stone-200">
        {/* Header Bar */}
        <div className="p-6 bg-gradient-to-br from-[#FFE68A]/25 via-white to-[#BCBF97]/25 border-b border-stone-200/80">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#636842] font-bold block mb-0.5">
                {t("Lista Nozze", "Wedding registry")}
              </span>
              <h3 className="text-base font-bold text-stone-900 leading-snug">
                {settings.coupleNames}
              </h3>
              <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                19 Luglio 2026
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Chiudi menù"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress pill */}
          <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center justify-between text-xs">
            <span className="text-stone-600 font-medium">{t("Raccolta totale:", "Total raised:")}</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-900 tabular-nums">
                {settings.currency}{totalRaised.toLocaleString()}
              </span>
              <span className="text-[11px] font-bold text-stone-800 bg-[#FFE68A] px-2 py-0.5 rounded-full border border-amber-300">
                {percent}%
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items (NO ICONS NEXT TO MENU ITEMS) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Section: Vista Pubblica & Embed */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#636842] font-bold px-3 block mb-1">
              {t("Anteprima per gli Invitati", "Guest preview")}
            </span>

            {/* Vista Dedicata Solo Iframe */}
            <button
              type="button"
              onClick={() => handleNavigate('embed_view')}
              className={`w-full text-left p-3.5 rounded-xl transition-all cursor-pointer border ${
                activeView === 'embed_view'
                  ? 'bg-[#636842] text-white border-[#636842] shadow-sm'
                  : 'bg-[#BCBF97]/15 hover:bg-[#BCBF97]/30 text-stone-900 border-[#BCBF97]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-stone-900">
                  {activeView === 'embed_view' ? (
                    <span className="text-white">{t("Pagina Lista Nozze (Per Iframe)", "Wedding registry page (iframe)")}</span>
                  ) : (
                    <span>{t("Pagina Lista Nozze (Per Iframe)", "Wedding registry page (iframe)")}</span>
                  )}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeView === 'embed_view' ? 'bg-white/20 text-white' : 'bg-[#636842] text-white'
                }`}>
                  {t("Senza Menù", "Without menu")}
                </span>
              </div>
              <div className={`text-xs mt-0.5 ${activeView === 'embed_view' ? 'text-stone-200' : 'text-stone-600'}`}>
                {t("Visualizzazione pulita da incorporare nel sito degli sposi", "A clean view to embed on the couple’s website")}
              </div>
            </button>
          </div>

          {/* Section: Dashboard Sposi */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3 mb-1">
              <span className="text-[10px] uppercase tracking-wider text-[#636842] font-bold block">
                {t("Dashboard Sposi", "Couple dashboard")}
              </span>
              <span className="w-2 h-2 rounded-full bg-[#BCBF97]"></span>
            </div>

            {/* Dashboard Panoramica */}
            <button
              type="button"
              onClick={() => handleNavigate('organizer_dashboard')}
              className={`w-full text-left p-3.5 rounded-xl transition-all cursor-pointer ${
                activeView === 'organizer_dashboard'
                  ? 'bg-[#636842] text-white shadow-sm'
                  : 'text-stone-800 hover:bg-stone-100 hover:text-stone-950'
              }`}
            >
              <div className="text-sm font-semibold">{t("Panoramica Dashboard", "Dashboard overview")}</div>
              <div className={`text-xs mt-0.5 ${activeView === 'organizer_dashboard' ? 'text-stone-200' : 'text-stone-500'}`}>
                {t("Riepilogo generale e avanzamento", "Overview and progress")}
              </div>
            </button>

            {/* 1. Gestisci Lista */}
            <button
              type="button"
              onClick={() => handleNavigate('organizer_gifts')}
              className={`w-full text-left p-3.5 rounded-xl transition-all cursor-pointer ${
                activeView === 'organizer_gifts'
                  ? 'bg-[#636842] text-white shadow-sm'
                  : 'text-stone-800 hover:bg-[#BCBF97]/20 hover:text-stone-950'
              }`}
            >
              <div className="text-sm font-semibold">{t("Gestisci Lista", "Manage registry")}</div>
              <div className={`text-xs mt-0.5 ${activeView === 'organizer_gifts' ? 'text-stone-200' : 'text-stone-500'}`}>
                {gifts.length} {t('desideri · quote libere', 'gifts · any amount')}
              </div>
            </button>

            {/* 2. Gestisci Pagamenti */}
            <button
              type="button"
              onClick={() => handleNavigate('organizer_paypal')}
              className={`w-full text-left p-3.5 rounded-xl transition-all cursor-pointer ${
                activeView === 'organizer_paypal'
                  ? 'bg-[#636842] text-white shadow-sm'
                  : 'text-stone-800 hover:bg-[#A6C1D8]/25 hover:text-stone-950'
              }`}
            >
              <div className="text-sm font-semibold">{t("Gestisci Pagamenti", "Manage payments")}</div>
              <div className={`text-xs mt-0.5 ${activeView === 'organizer_paypal' ? 'text-stone-200' : 'text-stone-500'}`}>
                {t("Carta con Stripe e bonifico IBAN", "Card via Stripe and bank transfer")}
              </div>
            </button>

            {/* 3. Gestisci Ringraziamenti */}
            <button
              type="button"
              onClick={() => handleNavigate('organizer_thanks')}
              className={`w-full text-left p-3.5 rounded-xl transition-all cursor-pointer ${
                activeView === 'organizer_thanks'
                  ? 'bg-[#636842] text-white shadow-sm'
                  : 'text-stone-800 hover:bg-[#FFE68A]/30 hover:text-stone-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{t("Gestisci Ringraziamenti", "Manage thank you notes")}</div>
                {pendingThankYous > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold text-stone-900 bg-[#FFE68A] rounded-full border border-amber-300">
                    {pendingThankYous} {t('in attesa', 'pending')}
                  </span>
                )}
              </div>
              <div className={`text-xs mt-0.5 ${activeView === 'organizer_thanks' ? 'text-stone-200' : 'text-stone-500'}`}>
                {t("WhatsApp, Email e dediche personalizzate", "WhatsApp, email and personalised messages")}
              </div>
            </button>
          </div>

          {/* Section: Codice per il Sito */}
          <div className="space-y-1 pt-2">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold px-3 block mb-1">
              {t("Integrazione Sito Nozze", "Wedding website integration")}
            </span>
            <button
              type="button"
              onClick={() => handleNavigate('organizer_embed')}
              className={`w-full text-left p-3.5 rounded-xl transition-all cursor-pointer border ${
                activeView === 'organizer_embed'
                  ? 'bg-[#636842] text-white border-[#636842] shadow-sm'
                  : 'bg-[#FFE68A]/20 hover:bg-[#FFE68A]/35 text-stone-900 border-[#FFE68A]'
              }`}
            >
              <div className="text-sm font-semibold">{t("Codice per il Tuo Sito", "Code for your website")}</div>
              <div className={`text-xs mt-0.5 ${activeView === 'organizer_embed' ? 'text-stone-200' : 'text-stone-600'}`}>
                {t("Copia codice iframe, widget e link per il sito", "Copy iframe code, widget and website link")}
              </div>
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-500">{t("Link pubblico lista:", "Public registry link:")}</span>
            <button
              type="button"
              onClick={handleCopyRegistryLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-800 hover:text-stone-950 bg-white border border-stone-300 rounded-lg shadow-2xs cursor-pointer transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t("Copiato!", "Copied!")}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t("Copia link", "Copy link")}</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3 bg-white rounded-xl border border-stone-200 text-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] text-stone-500 block">{t("Conto PayPal Spose:", "Couple’s PayPal account:")}</span>
              <span className="font-semibold text-stone-900 font-mono text-[11px]">
                {settings.paypalEmail}
              </span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500" title="Attivo"></div>
          </div>
        </div>
      </aside>
    </div>
  );
};
