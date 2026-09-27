import React, { useState } from 'react';
import { useRegistry } from '../context/RegistryContext';
import { Donation } from '../types';
import {
  Heart,
  Send,
  MessageSquare,
  Mail,
  Copy,
  CheckCircle2,
  Clock,
  Search,
  Check,
  Edit3,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';

export const ThanksManager: React.FC = () => {
  const { donations, settings, sendThankYou, guests } = useRegistry();

  const [filter, setFilter] = useState<'all' | 'pending' | 'sent'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingDonationId, setEditingDonationId] = useState<string | null>(null);
  const [customMessages, setCustomMessages] = useState<Record<string, string>>({});

  // Computed counters
  const totalDonations = donations.length;
  const pendingCount = donations.filter((d) => !d.thankYouSent).length;
  const sentCount = donations.filter((d) => d.thankYouSent).length;

  const filteredDonations = donations.filter((don) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'pending' && !don.thankYouSent) ||
      (filter === 'sent' && don.thankYouSent);

    const matchesSearch =
      don.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      don.giftTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (don.guestEmail && don.guestEmail.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const getDefaultMessage = (don: Donation) => {
    return `Carissimo/a ${don.guestName},\n\nDesideriamo ringraziarti di vero cuore per la tua affettuosa vicinanza e per il tuo generoso regalo per "${don.giftTitle}". Il tuo pensiero ci riempie di gioia e ci aiuterà a iniziare questo meraviglioso cammino insieme.\n\nCon immenso affetto,\n${settings.coupleNames}`;
  };

  const getActiveMessage = (don: Donation) => {
    return customMessages[don.id] || don.thankYouMessage || getDefaultMessage(don);
  };

  const handleCopyMessage = (don: Donation) => {
    const msg = getActiveMessage(don);
    navigator.clipboard.writeText(msg);
    setCopiedId(don.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleMarkAsSent = (don: Donation) => {
    const msg = getActiveMessage(don);
    sendThankYou(don.guestId, don.id, msg);
    setEditingDonationId(null);
  };

  const handleFindGuestPhone = (guestId: string) => {
    const guest = guests.find((g) => g.id === guestId);
    return guest?.phone || '';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#636842] font-semibold">
            Pannello Festeggiati
          </span>
          <h2 className="font-editorial text-3xl font-semibold text-stone-900">
            Gestisci Ringraziamenti Sposi
          </h2>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl">
            Tieni traccia delle donazioni ricevute, genera dediche personalizzate e invia i tuoi ringraziamenti con un clic su WhatsApp o via Email.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFE68A]"></span>
            <span className="text-stone-600 font-medium">In attesa:</span>
            <strong className="text-stone-900">{pendingCount}</strong>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-gradient-to-br from-white via-[#FFE68A]/20 to-[#FFE68A]/35 rounded-2xl border-2 border-[#FFE68A] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-stone-700 font-bold">
              Da Ringraziare
            </span>
            <span className="w-7 h-7 rounded-lg bg-[#FFE68A] flex items-center justify-center text-stone-900 shadow-2xs">
              <Clock className="w-4 h-4 text-amber-900" />
            </span>
          </div>
          <div className="font-editorial text-3xl font-bold text-stone-900 tabular-nums">
            {pendingCount}
          </div>
          <p className="text-xs text-stone-600">
            Donazioni ricevute senza messaggio inviato
          </p>
        </div>

        <div className="p-5 bg-gradient-to-br from-white to-[#BCBF97]/25 rounded-2xl border-2 border-[#BCBF97] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-stone-700 font-bold">
              Già Ringraziati
            </span>
            <span className="w-7 h-7 rounded-lg bg-[#BCBF97]/40 flex items-center justify-center text-[#484c2e] shadow-2xs">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="font-editorial text-3xl font-bold text-stone-900 tabular-nums">
            {sentCount}
          </div>
          <p className="text-xs text-stone-600">
            Biglietti e messaggi d'affetto già recapitati
          </p>
        </div>

        <div className="p-5 bg-gradient-to-br from-white to-[#A6C1D8]/25 rounded-2xl border-2 border-[#A6C1D8] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-slate-800 font-bold">
              Totale Donazioni
            </span>
            <span className="w-7 h-7 rounded-lg bg-[#A6C1D8]/50 flex items-center justify-center text-slate-800 shadow-2xs">
              <Heart className="w-4 h-4 fill-current text-rose-500" />
            </span>
          </div>
          <div className="font-editorial text-3xl font-bold text-slate-900 tabular-nums">
            {totalDonations}
          </div>
          <p className="text-xs text-slate-600">
            Quote versate con cifra libera
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
              filter === 'pending'
                ? 'bg-[#636842] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:text-stone-900'
            }`}
          >
            Da Ringraziare ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('sent')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
              filter === 'sent'
                ? 'bg-[#636842] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:text-stone-900'
            }`}
          >
            Già Ringraziati ({sentCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-[#636842] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:text-stone-900'
            }`}
          >
            Tutte ({totalDonations})
          </button>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Cerca donatore o regalo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
          />
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        {filteredDonations.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="font-editorial text-xl font-bold text-stone-900">
              {filter === 'pending' ? 'Tutti gli invitati sono stati ringraziati!' : 'Nessuna donazione trovata'}
            </h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {filter === 'pending'
                ? 'Ottimo lavoro! Tutte le donazioni ricevute finora hanno già ricevuto il vostro messaggio di affetto.'
                : 'Prova a modificare i filtri o la ricerca per visualizzare le altre donazioni.'}
            </p>
          </div>
        ) : (
          filteredDonations.map((don) => {
            const guestPhone = handleFindGuestPhone(don.guestId);
            const activeMsg = getActiveMessage(don);
            const isEditing = editingDonationId === don.id;

            return (
              <div
                key={don.id}
                className={`p-6 rounded-2xl border transition-all ${
                  don.thankYouSent
                    ? 'bg-white border-stone-200 shadow-2xs'
                    : 'bg-white border-2 border-[#BCBF97] shadow-xs'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  {/* Left: Donor & Donation Details */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-editorial text-xl font-bold text-stone-900">
                        {don.guestName}
                      </span>
                      <span className="text-stone-300">·</span>
                      <span className="text-xs text-stone-500">{don.guestEmail}</span>
                      <span className="text-stone-300">·</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          don.paymentMethod === 'paypal'
                            ? 'bg-[#A6C1D8]/40 text-slate-800'
                            : 'bg-[#BCBF97]/30 text-[#484c2e]'
                        }`}
                      >
                        {don.paymentMethod === 'paypal' ? 'PayPal' : 'Bonifico'}
                      </span>

                      {don.thankYouSent ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full ml-auto">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Ringraziamento Inviato</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-900 bg-[#FFE68A] px-2 py-0.5 rounded-full border border-amber-300 ml-auto">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Da Inviare</span>
                        </span>
                      )}
                    </div>

                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-stone-500">Regalo scelto:</span>{' '}
                        <strong className="text-stone-900">{don.giftTitle}</strong>
                      </div>
                      <div className="text-base font-bold text-stone-900 tabular-nums">
                        {settings.currency}{don.amount.toLocaleString()}
                      </div>
                    </div>

                    {/* Guest dedication message if provided */}
                    {don.message && (
                      <div className="p-3 bg-[#FAF9F5] rounded-xl border border-stone-200 text-xs italic text-stone-700">
                        <span className="not-italic text-[10px] uppercase font-bold text-stone-400 block mb-1">
                          Dedica dell'invitato per voi:
                        </span>
                        "{don.message}"
                      </div>
                    )}
                  </div>

                  {/* Right: Suggested Thank-You Message Box & Action Buttons */}
                  <div className="lg:w-1/2 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
                        <span>Messaggio di Ringraziamento:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingDonationId(isEditing ? null : don.id)}
                        className="text-stone-500 hover:text-stone-900 flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{isEditing ? 'Chiudi Modifica' : 'Personalizza Testo'}</span>
                      </button>
                    </div>

                    {isEditing ? (
                      <textarea
                        rows={4}
                        value={activeMsg}
                        onChange={(e) =>
                          setCustomMessages((prev) => ({ ...prev, [don.id]: e.target.value }))
                        }
                        className="w-full p-3 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#BCBF97] font-editorial italic"
                      />
                    ) : (
                      <div className="p-3 bg-stone-50/80 rounded-xl border border-stone-200 text-xs text-stone-800 font-editorial italic leading-relaxed">
                        {activeMsg}
                      </div>
                    )}

                    {/* Quick Send Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {/* WhatsApp Button */}
                      {guestPhone ? (
                        <a
                          href={`https://wa.me/${guestPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            activeMsg
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            if (!don.thankYouSent) handleMarkAsSent(don);
                          }}
                          className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-semibold shadow-2xs transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Invia su WhatsApp</span>
                        </a>
                      ) : (
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(activeMsg)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            if (!don.thankYouSent) handleMarkAsSent(don);
                          }}
                          className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-semibold shadow-2xs transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      )}

                      {/* Email Button */}
                      <a
                        href={`mailto:${don.guestEmail}?subject=${encodeURIComponent(
                          `Un grazie di cuore da ${settings.coupleNames}!`
                        )}&body=${encodeURIComponent(activeMsg)}`}
                        onClick={() => {
                          if (!don.thankYouSent) handleMarkAsSent(don);
                        }}
                        className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-[#636842] hover:bg-[#525636] text-white rounded-xl text-xs font-semibold shadow-2xs transition-all"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Invia Email</span>
                      </a>

                      {/* Copy message button */}
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(don)}
                        className="inline-flex items-center gap-1.5 py-2 px-3 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 rounded-xl text-xs font-medium shadow-2xs transition-colors cursor-pointer"
                      >
                        {copiedId === don.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copiato!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copia</span>
                          </>
                        )}
                      </button>

                      {/* Toggle status */}
                      <button
                        type="button"
                        onClick={() => handleMarkAsSent(don)}
                        className={`ml-auto py-2 px-3 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                          don.thankYouSent
                            ? 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
                            : 'bg-[#BCBF97]/30 hover:bg-[#BCBF97]/50 text-[#383c21]'
                        }`}
                      >
                        {don.thankYouSent ? 'Annulla stato' : 'Segna come Ringraziato'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
