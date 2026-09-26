import React from 'react';
import { useRegistry } from '../context/RegistryContext';
import {
  Heart,
  CreditCard,
  Users,
  Gift,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const OrganizerDashboard: React.FC = () => {
  const {
    gifts,
    guests,
    donations,
    settings,
    totalRaised,
    totalTarget,
    paypalTotal,
    bankTotal,
    setActiveView,
    setSelectedGuestIdForDrawer,
    resetToDefaults,
  } = useRegistry();

  const percent = totalTarget > 0 ? Math.min(100, Math.round((totalRaised / totalTarget) * 100)) : 0;
  const pendingThankYous = donations.filter((d) => !d.thankYouSent);
  const recentDonations = [...donations].slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Bar */}
      <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-[#FFE68A]/35 via-[#A6C1D8]/30 to-[#BCBF97]/35 border border-stone-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-stone-800 border border-stone-200/60 shadow-2xs mb-2">
              <span className="w-2 h-2 rounded-full bg-[#FFE68A] ring-2 ring-stone-300"></span>
              <span className="w-2 h-2 rounded-full bg-[#A6C1D8] ring-2 ring-stone-300 -ml-1"></span>
              <span className="w-2 h-2 rounded-full bg-[#BCBF97] ring-2 ring-stone-300 -ml-1"></span>
              <span>Dashboard Sposi · {settings.coupleNames}</span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-stone-900 tracking-tight">
              Pannello di Controllo Lista Nozze
            </h2>
            <p className="text-xs text-stone-700 mt-1 max-w-2xl leading-relaxed">
              Monitora quote e desideri con i canali digitali PayPal e Bonifico, gestisci i ringraziamenti e segui i tuoi invitati in tempo reale.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView('guest_registry')}
              className="flex items-center gap-2 py-2.5 px-4 bg-white hover:bg-stone-50 text-stone-900 text-xs font-semibold rounded-xl border border-stone-300/80 shadow-2xs transition-all cursor-pointer"
            >
              <span>Anteprima Invitati</span>
              <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards with #FFE68A, #A6C1D8, and #BCBF97 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Raised - Accented with #FFE68A (Gold/Butter) */}
        <div className="p-5 bg-gradient-to-br from-white to-[#FFE68A]/20 rounded-2xl border-2 border-[#FFE68A] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-stone-600 font-bold">
              Totale Raccolto
            </span>
            <span className="text-xs font-bold text-stone-900 bg-[#FFE68A] px-2.5 py-0.5 rounded-full border border-amber-300/80 shadow-2xs">
              {percent}% Obiettivo
            </span>
          </div>
          <div className="font-editorial text-3xl font-bold text-stone-900 tabular-nums">
            {settings.currency}{totalRaised.toLocaleString()}
          </div>
          <div className="w-full h-2 bg-stone-200/80 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-gradient-to-r from-[#FFE68A] via-[#BCBF97] to-[#A6C1D8] rounded-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
            <span>Obiettivo: {settings.currency}{totalTarget.toLocaleString()}</span>
            <span className="font-medium text-stone-700">{donations.length} donazioni</span>
          </div>
        </div>

        {/* PayPal Direct Balance - Accented with #A6C1D8 (Soft Airy Blue) */}
        <div
          onClick={() => setActiveView('organizer_paypal')}
          className="p-5 bg-gradient-to-br from-white to-[#A6C1D8]/25 hover:to-[#A6C1D8]/40 transition-all cursor-pointer rounded-2xl border-2 border-[#A6C1D8] shadow-xs space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-slate-700 font-bold">
              Conto PayPal Diretto
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#A6C1D8] flex items-center justify-center text-slate-800 shadow-2xs">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="font-editorial text-3xl font-bold text-slate-900 tabular-nums">
            {settings.currency}{paypalTotal.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-600 line-clamp-1 font-medium">
            Accreditato su @{settings.paypalMeUsername}
          </p>
          <span className="text-[11px] text-slate-800 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Gestisci conto PayPal <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Guests & Attendance - Accented with #BCBF97 (Sage Green) */}
        <div
          onClick={() => setActiveView('organizer_guests')}
          className="p-5 bg-gradient-to-br from-white to-[#BCBF97]/25 hover:to-[#BCBF97]/40 transition-all cursor-pointer rounded-2xl border-2 border-[#BCBF97] shadow-xs space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-stone-700 font-bold">
              Invitati Donatori
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#BCBF97] flex items-center justify-center text-stone-800 shadow-2xs">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-editorial text-3xl font-bold text-stone-900 tabular-nums">
            {guests.filter((g) => g.totalDonated > 0).length} / {guests.length}
          </div>
          <p className="text-[11px] text-stone-600">
            {Math.round((guests.filter((g) => g.totalDonated > 0).length / Math.max(1, guests.length)) * 100)}% degli invitati ha già partecipato
          </p>
          <span className="text-[11px] text-stone-800 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Apri schede invitati <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Pending Thank-Yous - Blended Palette Card */}
        <div
          onClick={() => setActiveView('organizer_guests')}
          className="p-5 bg-gradient-to-br from-white via-[#FFE68A]/15 to-[#BCBF97]/20 hover:from-white hover:to-[#FFE68A]/30 transition-all cursor-pointer rounded-2xl border border-stone-300 shadow-xs space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-stone-700 font-bold">
              Da Ringraziare
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FFE68A] flex items-center justify-center text-stone-800 shadow-2xs">
              <Heart className="w-4 h-4 text-stone-800 fill-current" />
            </div>
          </div>
          <div className="font-editorial text-3xl font-bold text-stone-900 tabular-nums">
            {pendingThankYous.length}
          </div>
          <p className="text-[11px] text-stone-600">
            Biglietti e messaggi in attesa di invio
          </p>
          <span className="text-[11px] text-stone-900 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Invia ringraziamenti <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* Main Grid: Recent Donations Feed + Top Desires */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Recent Activity Feed */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h3 className="font-editorial text-xl font-bold text-stone-900">
                Ultime Donazioni Ricevute
              </h3>
              <p className="text-xs text-stone-500">
                Clicca su qualsiasi invitato per aprire la sua scheda e gestire la donazione o inviare un ringraziamento.
              </p>
            </div>
            <button
              onClick={() => setActiveView('organizer_guests')}
              className="text-xs text-[#636842] hover:underline font-bold cursor-pointer"
            >
              Vedi tutte ({donations.length})
            </button>
          </div>

          <div className="space-y-3">
            {recentDonations.map((don) => (
              <div
                key={don.id}
                onClick={() => {
                  setSelectedGuestIdForDrawer(don.guestId);
                  setActiveView('organizer_guests');
                }}
                className="p-3.5 bg-stone-50/70 hover:bg-[#FFE68A]/15 rounded-xl border border-stone-200/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-900 text-xs">
                      {don.guestName}
                    </span>
                    <span className="text-stone-300">·</span>
                    <span className="text-[11px] text-stone-500">{don.giftTitle}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        don.paymentMethod === 'paypal'
                          ? 'bg-[#A6C1D8]/40 text-slate-800 border-[#A6C1D8]'
                          : 'bg-[#BCBF97]/40 text-stone-800 border-[#BCBF97]'
                      }`}
                    >
                      {don.paymentMethod === 'paypal' ? 'PayPal' : 'Bonifico'}
                    </span>
                  </div>

                  {don.message && (
                    <p className="text-xs italic text-stone-600 line-clamp-1">
                      "{don.message}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 sm:self-center">
                  <span className="font-bold text-base text-stone-900 tabular-nums">
                    +{settings.currency}{don.amount}
                  </span>
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-stone-700 hover:text-stone-950 bg-white px-2.5 py-1 rounded-lg border border-stone-200 shadow-2xs"
                  >
                    Profilo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Quick Actions & Wishlist Snapshot */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Actions Card with Palette Accents */}
          <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-editorial text-lg font-bold text-stone-900">
                Menu Gestione Sposi
              </h4>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFE68A]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#A6C1D8]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#BCBF97]"></span>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              {/* 1. Gestisci Lista */}
              <button
                onClick={() => setActiveView('organizer_gifts')}
                className="w-full py-2.5 px-3 bg-stone-50 hover:bg-[#BCBF97]/20 border border-transparent hover:border-[#BCBF97] rounded-xl text-stone-800 font-medium text-left flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#BCBF97]"></span>
                  <span className="font-semibold">Gestisci Lista</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-800" />
              </button>

              {/* 2. Gestisci Pagamenti */}
              <button
                onClick={() => setActiveView('organizer_paypal')}
                className="w-full py-2.5 px-3 bg-stone-50 hover:bg-[#A6C1D8]/30 border border-transparent hover:border-[#A6C1D8] rounded-xl text-stone-800 font-medium text-left flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#A6C1D8]"></span>
                  <span className="font-semibold">Gestisci Pagamenti (PayPal & IBAN)</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-900" />
              </button>

              {/* 3. Gestisci Ringraziamenti */}
              <button
                onClick={() => setActiveView('organizer_thanks')}
                className="w-full py-2.5 px-3 bg-stone-50 hover:bg-[#FFE68A]/25 border border-transparent hover:border-[#FFE68A] rounded-xl text-stone-800 font-medium text-left flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FFE68A]"></span>
                  <span className="font-semibold">Gestisci Ringraziamenti</span>
                  {pendingThankYous.length > 0 && (
                    <span className="text-[10px] font-bold text-stone-900 bg-[#FFE68A] px-1.5 py-0.2 rounded-full">
                      {pendingThankYous.length}
                    </span>
                  )}
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-800" />
              </button>

              {/* 4. Statistiche */}
              <button
                onClick={() => setActiveView('organizer_stats')}
                className="w-full py-2.5 px-3 bg-stone-50 hover:bg-stone-100 border border-transparent hover:border-stone-300 rounded-xl text-stone-800 font-medium text-left flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-stone-700"></span>
                  <span className="font-semibold">Statistiche & Analisi</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-800" />
              </button>

              {/* 5. Codice per il Sito */}
              <button
                onClick={() => setActiveView('organizer_embed')}
                className="w-full py-2.5 px-3 bg-[#FFE68A]/20 hover:bg-[#FFE68A]/35 border border-[#FFE68A] rounded-xl text-stone-900 font-semibold text-left flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Codice per il Tuo Sito Web</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-amber-700 group-hover:text-stone-900" />
              </button>
            </div>
          </div>

          {/* PayPal Integration Highlight with #A6C1D8 and #FFE68A */}
          <div className="p-5 bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 text-white rounded-2xl border border-stone-800 shadow-md space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#A6C1D8]/20 to-[#FFE68A]/15 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center gap-2 text-[#FFE68A] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#FFE68A]" />
              <span>Conto Ricevente PayPal</span>
            </div>
            <p className="font-editorial text-xl font-medium leading-tight text-white">
              {settings.paypalEmail}
            </p>
            <p className="text-xs text-stone-300 leading-relaxed">
              Tutti gli invitati che scelgono PayPal versano direttamente a questo indirizzo o tramite il link sicuro paypal.me/{settings.paypalMeUsername}.
            </p>
            <button
              onClick={() => setActiveView('organizer_paypal')}
              className="py-2 px-3.5 bg-[#FFE68A] hover:bg-[#fedd6b] text-stone-900 text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
            >
              <span>Configura o Cambia Coordinate</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Reset Demo Data button */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                if (confirm('Vuoi ripristinare i dati dimostrativi iniziali della lista?')) {
                  resetToDefaults();
                }
              }}
              className="text-[11px] text-stone-400 hover:text-stone-600 flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Ripristina dati demo iniziali</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
