import React, { useState } from 'react';
import { useRegistry } from '../context/RegistryContext';
import { Guest, Donation } from '../types';
import { DirectRecordDonationModal } from './DirectRecordDonationModal';
import {
  Users,
  Search,
  Plus,
  Heart,
  Mail,
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock,
  Send,
  X,
  CreditCard,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronRight,
  Copy,
} from 'lucide-react';

export const GuestDonationsManager: React.FC = () => {
  const {
    guests,
    donations,
    settings,
    selectedGuestIdForDrawer,
    setSelectedGuestIdForDrawer,
    addGuest,
    updateGuest,
    deleteGuest,
    sendThankYou,
    updateDonationStatus,
  } = useRegistry();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [donationFilter, setDonationFilter] = useState<'all' | 'has_donated' | 'no_donation' | 'needs_thanks'>('all');

  // Modals state
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState<boolean>(false);
  const [isRecordDonationModalOpen, setIsRecordDonationModalOpen] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // New Guest Form State
  const [newFullName, setNewFullName] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newGroup, setNewGroup] = useState<Guest['group']>('Amici Sposo');
  const [newRsvp, setNewRsvp] = useState<Guest['rsvpStatus']>('attending');
  const [newNotes, setNewNotes] = useState<string>('');

  // Selected Guest for drawer
  const selectedGuest = selectedGuestIdForDrawer
    ? guests.find((g) => g.id === selectedGuestIdForDrawer) || null
    : null;

  // Donations of selected guest
  const selectedGuestDonations = selectedGuest
    ? donations.filter((d) => d.guestId === selectedGuest.id)
    : [];

  // Filtered guest list
  const filteredGuests = guests.filter((guest) => {
    const matchesSearch =
      guest.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (guest.phone && guest.phone.includes(searchQuery));

    const matchesGroup = groupFilter === 'all' || guest.group === groupFilter;

    let matchesDonation = true;
    if (donationFilter === 'has_donated') matchesDonation = guest.totalDonated > 0;
    if (donationFilter === 'no_donation') matchesDonation = guest.totalDonated === 0;
    if (donationFilter === 'needs_thanks') matchesDonation = guest.totalDonated > 0 && !guest.thankYouSent;

    return matchesSearch && matchesGroup && matchesDonation;
  });

  // KPI calculations
  const totalGuestsCount = guests.length;
  const donatingGuestsCount = guests.filter((g) => g.totalDonated > 0).length;
  const pendingThanksCount = guests.filter((g) => g.totalDonated > 0 && !g.thankYouSent).length;
  const totalCollectedFromGuests = guests.reduce((sum, g) => sum + g.totalDonated, 0);

  const handleCreateGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim()) return;

    const created = addGuest({
      fullName: newFullName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim(),
      group: newGroup,
      rsvpStatus: newRsvp,
      notes: newNotes.trim(),
    });

    setIsAddGuestModalOpen(false);
    setNewFullName('');
    setNewEmail('');
    setNewPhone('');
    setNewNotes('');
    setSelectedGuestIdForDrawer(created.id);
  };

  const getSuggestedThankYouText = (guest: Guest, guestDons: Donation[]) => {
    const giftsList = guestDons.map((d) => `"${d.giftTitle}"`).join(' e ');
    return `Carissimo/a ${guest.fullName},\n\nDesideriamo ringraziarti con tutto il nostro cuore per la tua affettuosa vicinanza e per il tuo generoso contributo per ${
      giftsList || 'la nostra lista nozze'
    }.\n\nIl tuo pensiero ci riempie di gioia e ci aiuterà a realizzare questo grande sogno.\n\nCon immenso affetto,\n${settings.coupleNames}`;
  };

  const handleCopyThankYou = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#636842] font-semibold">
            Pannello Festeggiati
          </span>
          <h2 className="font-editorial text-3xl font-semibold text-stone-900">
            Gestione Donazioni dai Profili Invitati
          </h2>
          <p className="text-xs text-stone-600 mt-1">
            Visualizza ogni invitato, traccia e assegna donazioni direttamente alla loro scheda personale e gestisci i ringraziamenti.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddGuestModalOpen(true)}
            className="flex items-center gap-2 py-2 px-4 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Invitato</span>
          </button>
        </div>
      </div>

      {/* KPI Cards with #FFE68A, #A6C1D8, and #BCBF97 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-br from-white to-[#BCBF97]/25 rounded-2xl border-2 border-[#BCBF97] shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-stone-700 font-bold">
            Totale Invitati
          </span>
          <p className="font-editorial text-2xl font-bold text-stone-900 mt-1 tabular-nums">
            {totalGuestsCount}
          </p>
          <span className="text-[11px] text-stone-500 font-medium">in rubrica invitati</span>
        </div>

        <div className="p-4 bg-gradient-to-br from-white to-[#A6C1D8]/25 rounded-2xl border-2 border-[#A6C1D8] shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-800 font-bold">
            Invitati Donatori
          </span>
          <p className="font-editorial text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {donatingGuestsCount}
          </p>
          <span className="text-[11px] text-slate-600 font-medium">
            {Math.round((donatingGuestsCount / Math.max(1, totalGuestsCount)) * 100)}% del totale
          </span>
        </div>

        <div className="p-4 bg-gradient-to-br from-white to-[#FFE68A]/25 rounded-2xl border-2 border-[#FFE68A] shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-stone-700 font-bold">
            Totale Raccolto
          </span>
          <p className="font-editorial text-2xl font-bold text-stone-900 mt-1 tabular-nums">
            {settings.currency}{totalCollectedFromGuests.toLocaleString()}
          </p>
          <span className="text-[11px] text-stone-500 font-medium">versamenti complessivi</span>
        </div>

        <div className="p-4 bg-gradient-to-br from-white via-[#FFE68A]/15 to-[#BCBF97]/20 rounded-2xl border border-stone-300 shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-stone-700 font-bold">
            Da Ringraziare
          </span>
          <p className="font-editorial text-2xl font-bold text-stone-900 mt-1 tabular-nums">
            {pendingThanksCount}
          </p>
          <span className="text-[11px] text-stone-500 font-medium">messaggi in attesa</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Donation status filter buttons */}
          <button
            type="button"
            onClick={() => setDonationFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              donationFilter === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:text-stone-900'
            }`}
          >
            Tutti ({guests.length})
          </button>
          <button
            type="button"
            onClick={() => setDonationFilter('has_donated')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              donationFilter === 'has_donated'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:text-stone-900'
            }`}
          >
            Hanno donato ({donatingGuestsCount})
          </button>
          <button
            type="button"
            onClick={() => setDonationFilter('needs_thanks')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              donationFilter === 'needs_thanks'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:text-stone-900'
            }`}
          >
            Da ringraziare ({pendingThanksCount})
          </button>
          <button
            type="button"
            onClick={() => setDonationFilter('no_donation')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              donationFilter === 'no_donation'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:text-stone-900'
            }`}
          >
            In attesa ({totalGuestsCount - donatingGuestsCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Cerca nome o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
          />
        </div>
      </div>

      {/* Guests Directory Grid / Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Invitato</th>
                <th className="py-3 px-4">Gruppo</th>
                <th className="py-3 px-4">RSVP</th>
                <th className="py-3 px-4">Totale Donato</th>
                <th className="py-3 px-4">Quote / Regali</th>
                <th className="py-3 px-4">Ringraziamento</th>
                <th className="py-3 px-4 text-right">Azione</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-500">
                    Nessun invitato corrispondente ai criteri selezionati.
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => {
                  const hasDonated = guest.totalDonated > 0;
                  return (
                    <tr
                      key={guest.id}
                      onClick={() => setSelectedGuestIdForDrawer(guest.id)}
                      className="hover:bg-[#BCBF97]/15 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full ${guest.avatarColor} text-white flex items-center justify-center font-bold text-xs shadow-2xs`}
                          >
                            {guest.fullName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-stone-900 block">
                              {guest.fullName}
                            </span>
                            <span className="text-[11px] text-stone-400 block">
                              {guest.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-stone-600 font-medium">
                        {guest.group}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                            guest.rsvpStatus === 'attending'
                              ? 'bg-emerald-50 text-emerald-800'
                              : guest.rsvpStatus === 'declined'
                              ? 'bg-rose-50 text-rose-800'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {guest.rsvpStatus === 'attending'
                            ? 'Confermato'
                            : guest.rsvpStatus === 'declined'
                            ? 'Non presente'
                            : 'In attesa'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold tabular-nums text-sm ${
                            hasDonated ? 'text-[#484c2e] font-bold' : 'text-stone-400'
                          }`}
                        >
                          {settings.currency}{guest.totalDonated.toLocaleString()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-stone-600">
                        {guest.donationsCount > 0 ? (
                          <span>
                            {guest.donationsCount} {guest.donationsCount === 1 ? 'donazione' : 'donazioni'}
                          </span>
                        ) : (
                          <span className="text-stone-400">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {!hasDonated ? (
                          <span className="text-stone-300">-</span>
                        ) : guest.thankYouSent ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Inviato</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#72774f]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Da inviare</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGuestIdForDrawer(guest.id);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors cursor-pointer"
                        >
                          <span>Gestisci</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. GUEST PROFILE DRAWER (Slide-Over Panel) */}
      {selectedGuest && (
        <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/40 backdrop-blur-2xs">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200 border-l border-stone-200">
            {/* Drawer Header */}
            <div className="p-6 bg-stone-50 border-b border-stone-200 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full ${selectedGuest.avatarColor} text-white flex items-center justify-center font-bold text-lg shadow-sm`}
                >
                  {selectedGuest.fullName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-editorial text-2xl font-bold text-stone-900">
                      {selectedGuest.fullName}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                    <span>{selectedGuest.group}</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={`font-semibold ${
                        selectedGuest.rsvpStatus === 'attending'
                          ? 'text-emerald-700'
                          : 'text-stone-600'
                      }`}
                    >
                      {selectedGuest.rsvpStatus === 'attending' ? 'Presenza Confermata' : selectedGuest.rsvpStatus}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedGuestIdForDrawer(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 flex-1">
              {/* Contact Information Quick Card */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                <div>
                  <span className="text-stone-400 block text-[11px]">Email:</span>
                  <a
                    href={`mailto:${selectedGuest.email}`}
                    className="font-medium text-stone-800 hover:text-[#636842] truncate block"
                  >
                    {selectedGuest.email}
                  </a>
                </div>
                <div>
                  <span className="text-stone-400 block text-[11px]">Telefono:</span>
                  <span className="font-medium text-stone-800">
                    {selectedGuest.phone || 'Non specificato'}
                  </span>
                </div>
              </div>

              {/* Donation Metric Highlights */}
              <div className="p-4 bg-[#BCBF97]/15 rounded-xl border border-[#BCBF97]/60 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#636842] font-semibold">
                    Totale Versato
                  </span>
                  <div className="font-editorial text-3xl font-bold text-stone-900 tabular-nums">
                    {settings.currency}{selectedGuest.totalDonated.toLocaleString()}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                    Donazioni Registrate
                  </span>
                  <div className="font-editorial text-2xl font-bold text-stone-800 tabular-nums">
                    {selectedGuestDonations.length}
                  </div>
                </div>
              </div>

              {/* ACTION: Register Donation DIRECTLY on Guest Profile */}
              <div className="flex items-center justify-between p-4 bg-stone-900 text-white rounded-xl shadow-xs">
                <div>
                  <h4 className="font-editorial text-lg font-semibold leading-tight">
                    Gestisci Donazioni di {selectedGuest.fullName}
                  </h4>
                  <p className="text-[11px] text-stone-300">
                    Aggiungi una quota versata direttamente su PayPal o tramite bonifico bancario.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRecordDonationModalOpen(true)}
                  className="py-2 px-3.5 bg-[#636842] hover:bg-[#525636] text-white font-semibold text-xs rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registra Donazione</span>
                </button>
              </div>

              {/* List of Donations for this specific guest */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-stone-900 text-sm">
                    Storico Donazioni per Prodotto ({selectedGuestDonations.length})
                  </h4>
                </div>

                {selectedGuestDonations.length === 0 ? (
                  <div className="p-6 text-center bg-stone-50 rounded-xl border border-stone-200">
                    <Heart className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="text-xs text-stone-600">
                      Nessuna donazione ancora associata a questo profilo.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsRecordDonationModalOpen(true)}
                      className="mt-2 text-xs font-semibold text-[#636842] hover:underline cursor-pointer"
                    >
                      + Registra la prima quota
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedGuestDonations.map((don) => (
                      <div
                        key={don.id}
                        className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-bold text-stone-900 block">
                              {don.giftTitle}
                            </span>
                            <span className="text-[11px] text-stone-400">
                              {new Date(don.createdAt).toLocaleDateString('it-IT', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <span className="font-bold text-base text-[#484c2e] tabular-nums">
                            {settings.currency}{don.amount.toLocaleString()}
                          </span>
                        </div>

                        {/* Payment channel tag & PayPal transaction ID */}
                        <div className="flex items-center gap-2 pt-1 text-[11px]">
                          <span
                            className={`px-2 py-0.5 rounded font-medium ${
                              don.paymentMethod === 'paypal'
                                ? 'bg-blue-50 text-blue-800'
                                : 'bg-[#BCBF97]/20 text-[#484c2e]'
                            }`}
                          >
                            {don.paymentMethod === 'paypal'
                              ? `PayPal (${don.paypalTransactionId || 'Verificato'})`
                              : 'Bonifico Bancario'}
                          </span>

                          <span className="text-stone-300">·</span>

                          <span
                            className={`font-medium ${
                              don.status === 'completed' ? 'text-emerald-700' : 'text-[#72774f]'
                            }`}
                          >
                            {don.status === 'completed' ? 'Accreditato' : 'In verifica'}
                          </span>
                        </div>

                        {/* Dedication message */}
                        {don.message && (
                          <div className="mt-2 p-2.5 bg-stone-50 rounded-lg border border-stone-100 text-xs italic text-stone-700">
                            "{don.message}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Thank You Note Center */}
              {selectedGuest.totalDonated > 0 && (
                <div className="p-4 bg-[#BCBF97]/15 rounded-xl border border-[#BCBF97]/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-[#636842]" />
                      <span className="font-semibold text-xs text-stone-900">
                        Biglietto di Ringraziamento per {selectedGuest.fullName}
                      </span>
                    </div>
                    {selectedGuest.thankYouSent ? (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        Già Ringraziato
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-[#484c2e] bg-[#BCBF97]/30 px-2 py-0.5 rounded">
                        In attesa di ringraziamento
                      </span>
                    )}
                  </div>

                  {/* Generated thank-you preview */}
                  <div className="p-3 bg-white rounded-lg border border-[#BCBF97]/60 text-xs text-stone-800 font-editorial italic leading-relaxed">
                    {getSuggestedThankYouText(selectedGuest, selectedGuestDonations)}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyThankYou(
                          getSuggestedThankYouText(selectedGuest, selectedGuestDonations)
                        )
                      }
                      className="py-1.5 px-3 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium text-stone-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedText ? 'Copiato!' : 'Copia Testo'}</span>
                    </button>

                    {selectedGuest.phone && (
                      <a
                        href={`https://wa.me/${selectedGuest.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          getSuggestedThankYouText(selectedGuest, selectedGuestDonations)
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Invia WhatsApp</span>
                      </a>
                    )}

                    <a
                      href={`mailto:${selectedGuest.email}?subject=${encodeURIComponent(
                        `Un grazie di cuore da ${settings.coupleNames}!`
                      )}&body=${encodeURIComponent(
                        getSuggestedThankYouText(selectedGuest, selectedGuestDonations)
                      )}`}
                      className="py-1.5 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Invia Email</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => sendThankYou(selectedGuest.id)}
                      className={`ml-auto py-1.5 px-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        selectedGuest.thankYouSent
                          ? 'text-stone-500 hover:text-stone-800'
                          : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs'
                      }`}
                    >
                      {selectedGuest.thankYouSent ? 'Contrassegna come già fatto' : 'Segna come Ringraziato'}
                    </button>
                  </div>
                </div>
              )}

              {/* Private Notes from Organizer */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-800">
                  Note riservate sposi per questo invitato:
                </label>
                <textarea
                  rows={2}
                  value={selectedGuest.notes || ''}
                  onChange={(e) => updateGuest(selectedGuest.id, { notes: e.target.value })}
                  placeholder="Es. Esigenze alimentari, accordi particolari..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              {/* Danger Zone: Delete guest */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-between text-xs">
                <span className="text-stone-400">ID Profilo: {selectedGuest.id}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Sei sicuro di voler eliminare l'invitato ${selectedGuest.fullName}?`)) {
                      deleteGuest(selectedGuest.id);
                      setSelectedGuestIdForDrawer(null);
                    }
                  }}
                  className="text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                >
                  Elimina Invitato
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Direct Record Donation on this Guest Profile */}
      {isRecordDonationModalOpen && selectedGuest && (
        <DirectRecordDonationModal
          guest={selectedGuest}
          onClose={() => setIsRecordDonationModalOpen(false)}
        />
      )}

      {/* Modal: Add New Guest */}
      {isAddGuestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 bg-stone-50 border-b border-stone-200">
              <h3 className="font-editorial text-xl font-semibold text-stone-900">
                Aggiungi Nuovo Invitato
              </h3>
              <button
                onClick={() => setIsAddGuestModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGuest} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Nome e Cognome *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. Andrea Martini"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="andrea.martini@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Telefono
                  </label>
                  <input
                    type="tel"
                    placeholder="+39 340 0000000"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Gruppo
                  </label>
                  <select
                    value={newGroup}
                    onChange={(e) => setNewGroup(e.target.value as Guest['group'])}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                  >
                    <option value="Famiglia">Famiglia</option>
                    <option value="Amici Sposo">Amici Sposo</option>
                    <option value="Amici Sposa">Amici Sposa</option>
                    <option value="Testimoni">Testimoni</option>
                    <option value="Colleghi">Colleghi</option>
                    <option value="Altri">Altri</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Stato RSVP
                </label>
                <select
                  value={newRsvp}
                  onChange={(e) => setNewRsvp(e.target.value as Guest['rsvpStatus'])}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                >
                  <option value="attending">Confermato (Presente)</option>
                  <option value="pending">In attesa di risposta</option>
                  <option value="declined">Non potrà partecipare</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Note
                </label>
                <textarea
                  rows={2}
                  placeholder="Informazioni aggiuntive..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddGuestModalOpen(false)}
                  className="py-2.5 px-4 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Salva Invitato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
