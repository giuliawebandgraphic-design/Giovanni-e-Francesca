import React from 'react';
import { useRegistry } from '../context/RegistryContext';
import { Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeView, settings, donations, toggleSidebar, isSidebarOpen } = useRegistry();

  const pendingThankYous = donations.filter((d) => !d.thankYouSent).length;

  const viewTitles: Record<string, string> = {
    guest_registry: 'Lista Regali (Vista Invitati)',
    organizer_dashboard: 'Dashboard Sposi',
    organizer_gifts: 'Gestisci Lista',
    organizer_paypal: 'Gestisci Pagamenti',
    organizer_thanks: 'Gestisci Ringraziamenti',
    organizer_stats: 'Statistiche',
    organizer_guests: 'Rubrica Invitati',
    organizer_embed: 'Codice per il Sito',
    organizer_image: 'Immagine della Home',
  };

  const currentViewTitle = viewTitles[activeView] || 'Lista Nozze';

  return (
    <header className="sticky top-0 z-40 bg-stone-50/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Menu button + Couple Names */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-stone-800 hover:text-stone-950 bg-white hover:bg-stone-100 border border-stone-300 shadow-2xs transition-colors cursor-pointer"
              title="Apri menù laterale a scomparsa"
              aria-label="Apri menù laterale a scomparsa"
            >
              {isSidebarOpen ? (
                <X className="w-5 h-5 text-[#636842]" />
              ) : (
                <Menu className="w-5 h-5 text-[#636842]" />
              )}
              <span className="text-xs font-bold text-stone-900 tracking-wide uppercase">
                Menù
              </span>
            </button>

            <div className="flex items-center gap-2 sm:gap-2.5">
              <span className="text-xs sm:text-sm font-semibold tracking-normal text-stone-900">
                {settings.coupleNames}
              </span>
              <span className="hidden sm:inline-block text-stone-300 font-light">|</span>
              <span className="hidden sm:inline-block text-[11px] uppercase tracking-widest text-stone-500 font-medium">
                19 Luglio 2026
              </span>
            </div>
          </div>

          {/* Right: Active Section Indicator & Menu Trigger */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-stone-500">
              <span>Sezione:</span>
              <span className="font-semibold text-stone-900 bg-white px-2.5 py-1 rounded-lg border border-stone-200 shadow-2xs">
                {currentViewTitle}
              </span>
            </div>

            <button
              type="button"
              onClick={toggleSidebar}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-stone-800 hover:text-stone-950 bg-[#BCBF97]/25 hover:bg-[#BCBF97]/40 border border-[#BCBF97] rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <span>Tutte le Voci</span>
              <span className="text-stone-400">&rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
