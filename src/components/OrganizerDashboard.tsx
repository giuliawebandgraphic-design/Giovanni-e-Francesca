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
  Camera,
  Image as ImageIcon,
  Trash2,
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
    clearAllData,
    loadDemoGifts,
    isFirestoreConnected,
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
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-stone-800 border border-stone-200/60 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#FFE68A] ring-2 ring-stone-300"></span>
                <span className="w-2 h-2 rounded-full bg-[#A6C1D8] ring-2 ring-stone-300 -ml-1"></span>
                <span className="w-2 h-2 rounded-full bg-[#BCBF97] ring-2 ring-stone-300 -ml-1"></span>
                <span>Dashboard Sposi · {settings.coupleNames}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                <span className={`w-2 h-2 rounded-full bg-emerald-500 ${isFirestoreConnected ? 'animate-pulse' : ''}`}></span>
                <span>Cloud Firestore Database: Connesso & Sincronizzato Ovunque</span>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Pannello di Controllo Lista Nozze
            </h2>
            <p className="text-xs text-stone-700 mt-1 max-w-2xl leading-relaxed">
              Monitora quote e desideri con i canali digitali PayPal e Bonifico, gestisci i ringraziamenti e segui i tuoi invitati in tempo reale.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView('organizer_gifts')}
              className="flex items-center gap-2 py-2 px-3.5 bg-white hover:bg-stone-50 text-stone-900 text-xs font-semibold rounded-xl border border-stone-300 shadow-2xs transition-all cursor-pointer"
            >
              <Gift className="w-3.5 h-3.5 text-[#636842]" />
              <span>Aggiungi / Modifica Regali</span>
            </button>

            <button
              onClick={() => setActiveView('guest_registry')}
              className="flex items-center gap-2 py-2 px-3.5 bg-[#636842] hover:bg-[#525636] text-white text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              <span>Anteprima Invitati</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards with #FFE68A, #A6C1D8, and #BCBF97 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Raised */}
        <div className="p-5 bg-gradient-to-br from-white to-[#FFE68A]/20 rounded-2xl border-2 border-[#FFE68A] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-stone-600 font-bold">
              Totale Raccolto
            </span>
            <span className="text-xs font-bold text-stone-900 bg-[#FFE68A] px-2.5 py-0.5 rounded-full border border-amber-300/80 shadow-2xs">
              {percent}% Obiettivo
            </span>
          </div>
          <div className="text-3xl font-bold text-stone-900 tabular-nums">
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

        {/* PayPal Direct Balance */}
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
          <div className="text-3xl font-bold text-slate-900 tabular-nums">
            {settings.currency}{paypalTotal.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-600 line-clamp-1 font-medium">
            Accreditato su @{settings.paypalMeUsername}
          </p>
          <span className="text-[11px] text-slate-800 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Gestisci conto PayPal <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Guests & Attendance */}
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
          <div className="text-3xl font-bold text-stone-900 tabular-nums">
            {guests.filter((g) => g.totalDonated > 0).length} / {guests.length}
          </div>
          <p className="text-[11px] text-stone-600">
            {guests.length > 0
              ? `${Math.round((guests.filter((g) => g.totalDonated > 0).length / guests.length) * 100)}% degli invitati ha partecipato`
              : 'Nessun invitato registrato'}
          </p>
          <span className="text-[11px] text-stone-800 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Apri schede invitati <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Pending Thank-Yous */}
        <div
          onClick={() => setActiveView('organizer_thanks')}
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
          <div className="text-3xl font-bold text-stone-900 tabular-nums">
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

      {/* Dedicated Section: Gestione Immagine Home */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Thumbnail */}
            <div className="relative w-24 h-20 sm:w-32 sm:h-24 rounded-xl overflow-hidden border border-stone-200 bg-stone-100 shrink-0 shadow-inner group">
              <img
                src={settings.heroImage}
                alt="Copertina Home"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-stone-900/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFE68A] text-stone-900 border border-amber-300">
                <Sparkles className="w-3 h-3 text-amber-700" />
                <span>Foto di Copertina Home</span>
              </div>
              <h3 className="text-base font-bold text-stone-900">
                Immagine Principale della Lista
              </h3>
              <p className="text-xs text-stone-600 max-w-lg leading-relaxed">
                Personalizza l'immagine visibile in cima alla pagina nozze. Puoi caricare una vostra foto, inserire un link o scegliere tra i preset fotografici.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setActiveView('organizer_image')}
              className="flex items-center gap-2 py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Gestisci Immagine Home</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Donations Feed + Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Recent Activity Feed */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-lg font-bold text-stone-900">
                Ultime Donazioni Ricevute
              </h3>
              <p className="text-xs text-stone-500">
                Transazioni registrate tramite PayPal o Bonifico Bancario
              </p>
            </div>
            {donations.length > 0 && (
              <button
                onClick={() => setActiveView('organizer_guests')}
                className="text-xs text-[#636842] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                Vedi tutte ({donations.length}) <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {donations.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl border border-dashed border-stone-200 bg-stone-50/50 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 text-stone-400 flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-stone-900">
                Nessuna donazione ancora ricevuta
              </h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                La tua lista è pronta e pulita. Quando gli invitati invieranno le loro quote con PayPal o bonifico, ogni contributo e messaggio d'auguri apparirà qui.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveView('organizer_gifts')}
                  className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  + Aggiungi Desideri alla Lista
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('organizer_paypal')}
                  className="px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  Verifica Conto PayPal
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {recentDonations.map((don) => {
                const guest = guests.find((g) => g.id === don.guestId);
                return (
                  <div
                    key={don.id}
                    onClick={() => {
                      if (guest) setSelectedGuestIdForDrawer(guest.id);
                    }}
                    className="py-3.5 px-2 hover:bg-stone-50 rounded-xl transition-colors cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full ${
                          guest?.avatarColor || 'bg-stone-700'
                        } text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs`}
                      >
                        {don.guestName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-900">
                            {don.guestName}
                          </span>
                          <span className="text-[10px] text-stone-500">
                            {new Date(don.createdAt).toLocaleDateString('it-IT', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 truncate max-w-xs sm:max-w-sm">
                          {don.giftTitle}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-stone-900 tabular-nums">
                        {settings.currency}{don.amount.toLocaleString()}
                      </div>
                      <span
                        className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          don.paymentMethod === 'paypal'
                            ? 'bg-[#A6C1D8]/20 text-slate-800 border border-[#A6C1D8]/50'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {don.paymentMethod === 'paypal' ? 'PayPal' : 'Bonifico'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Quick Actions & Navigation */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Actions Card */}
          <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-stone-900">
                Menu Gestione Sposi
              </h4>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFE68A]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#A6C1D8]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#BCBF97]"></span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {/* Gestisci Lista */}
              <button
                onClick={() => setActiveView('organizer_gifts')}
                className="w-full py-2.5 px-3 bg-stone-50 hover:bg-[#BCBF97]/20 border border-transparent hover:border-[#BCBF97] rounded-xl text-stone-800 font-medium text-left flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#BCBF97]"></span>
                  <span className="font-semibold">Gestisci Lista ({gifts.length} regali)</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-800" />
              </button>

              {/* Gestisci Pagamenti */}
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

              {/* Gestisci Ringraziamenti */}
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

              {/* Statistiche */}
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

              {/* Codice per il Sito */}
              <button
                onClick={() => setActiveView('organizer_embed')}
                className="w-full py-2.5 px-3 bg-stone-50 hover:bg-[#FFE68A]/35 border border-stone-200 rounded-xl text-stone-900 font-semibold text-left flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Codice per il Tuo Sito Web</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-amber-700 group-hover:text-stone-900" />
              </button>
            </div>
          </div>

          {/* Quick reset & demo helpers */}
          <div className="p-4 bg-stone-100/70 rounded-2xl border border-stone-200/80 text-center space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-stone-500 font-bold block">
              Gestione Dati Dashboard
            </span>
            <div className="flex items-center justify-center gap-3 text-xs">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Vuoi cancellare tutti i dati e azzerare la dashboard?')) {
                    clearAllData();
                  }
                }}
                className="text-[11px] text-stone-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
                title="Svuota regali, donazioni e invitati"
              >
                <Trash2 className="w-3 h-3" />
                <span>Svuota tutto</span>
              </button>

              <span className="text-stone-300">·</span>

              <button
                type="button"
                onClick={() => {
                  loadDemoGifts();
                }}
                className="text-[11px] text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer transition-colors"
                title="Carica 2 desideri di esempio"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Carica esempi demo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
