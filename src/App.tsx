/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RegistryProvider, useRegistry } from './context/RegistryContext';
import { Navbar } from './components/Navbar';
import { SidebarDrawer } from './components/SidebarDrawer';
import { GuestRegistryView } from './components/GuestRegistryView';
import { GuestEmbedView } from './components/GuestEmbedView';
import { OrganizerDashboard } from './components/OrganizerDashboard';
import { GuestDonationsManager } from './components/GuestDonationsManager';
import { WishlistManager } from './components/WishlistManager';
import { PayPalPayoutSettings } from './components/PayPalPayoutSettings';
import { ThanksManager } from './components/ThanksManager';
import { StatisticsPage } from './components/StatisticsPage';
import { EmbedCodePage } from './components/EmbedCodePage';
import { HomeImageManager } from './components/HomeImageManager';
import { Heart, ShieldCheck, Code2 } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeView, settings, setActiveView } = useRegistry();

  // If in dedicated embed view (for iframe on external websites)
  if (activeView === 'embed_view') {
    const isExternalEmbed = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('embed') === 'true';

    return (
      <div className="w-full min-h-screen bg-transparent">
        {/* Helper bar shown ONLY when the couple is testing the embed preview internally */}
        {!isExternalEmbed && (
          <div className="sticky top-0 z-50 bg-[#636842] text-white px-4 py-2 shadow-xs flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FFE68A] animate-pulse"></span>
              <span className="font-semibold">
                Anteprima Iframe: Vista Solo Desideri (Zero Titoli, Zero Link Piattaforma)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('organizer_dashboard')}
              className="px-3 py-1 bg-white text-[#484c2e] hover:bg-stone-100 font-bold rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1"
            >
              <span>&larr; Vai alla Dashboard Sposi</span>
            </button>
          </div>
        )}

        <GuestEmbedView />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      {/* Collapsible lateral sidebar menu */}
      <SidebarDrawer />

      <Navbar />

      <main className="flex-1">
        {activeView === 'guest_registry' && <GuestRegistryView />}
        {activeView === 'organizer_dashboard' && <OrganizerDashboard />}
        {activeView === 'organizer_guests' && <GuestDonationsManager />}
        {activeView === 'organizer_gifts' && <WishlistManager />}
        {activeView === 'organizer_paypal' && <PayPalPayoutSettings />}
        {activeView === 'organizer_thanks' && <ThanksManager />}
        {activeView === 'organizer_stats' && <StatisticsPage />}
        {activeView === 'organizer_embed' && <EmbedCodePage />}
        {activeView === 'organizer_image' && <HomeImageManager />}
      </main>

      {/* Quiet Footer */}
      <footer className="bg-stone-100 border-t border-stone-200 py-8 px-4 sm:px-6 lg:px-8 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-800">
              {settings.coupleNames}
            </span>
            <span aria-hidden="true">·</span>
            <span>Lista Nozze & Desideri con Versamento PayPal</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <button
              onClick={() => setActiveView('guest_registry')}
              className="hover:text-[#636842] transition-colors cursor-pointer"
            >
              Vista Invitati
            </button>
            <span className="text-stone-300">·</span>
            <button
              onClick={() => setActiveView('embed_view')}
              className="hover:text-[#636842] transition-colors cursor-pointer font-semibold text-[#636842]"
            >
              Anteprima Embed (Senza Menù)
            </button>
            <span className="text-stone-300">·</span>
            <button
              onClick={() => setActiveView('organizer_dashboard')}
              className="hover:text-[#636842] transition-colors cursor-pointer"
            >
              Dashboard Sposi
            </button>
            <span className="text-stone-300">·</span>
            <button
              onClick={() => setActiveView('organizer_thanks')}
              className="hover:text-[#636842] transition-colors cursor-pointer"
            >
              Ringraziamenti
            </button>
            <span className="text-stone-300">·</span>
            <button
              onClick={() => setActiveView('organizer_stats')}
              className="hover:text-[#636842] transition-colors cursor-pointer"
            >
              Statistiche
            </button>
            <span className="text-stone-300">·</span>
            <button
              onClick={() => setActiveView('organizer_embed')}
              className="hover:text-[#636842] transition-colors cursor-pointer font-semibold text-[#636842]"
            >
              Codice per il Tuo Sito
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <RegistryProvider>
      <MainContent />
    </RegistryProvider>
  );
}
