import React, { useState } from 'react';
import { GiftItem, PaymentMethod, Guest } from '../types';
import { useRegistry } from '../context/RegistryContext';
import { X, Check, CreditCard, Heart, ArrowRight, Copy, CheckCircle2, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';

interface ContributeModalProps {
  gift: GiftItem | null;
  onClose: () => void;
  defaultGuestId?: string;
}

export const ContributeModal: React.FC<ContributeModalProps> = ({
  gift,
  onClose,
  defaultGuestId,
}) => {
  const { settings, guests, recordDonation, getPayPalLink } = useRegistry();

  if (!gift) return null;

  const remaining = gift.isInfiniteQuota
    ? null
    : Math.max(0, gift.targetAmount - gift.raisedAmount);

  // Free custom amount (no preset buttons)
  const [customAmount, setCustomAmount] = useState<string>('50');

  // Guest details
  const preselectedGuest = defaultGuestId ? guests.find((g) => g.id === defaultGuestId) : undefined;
  const [guestMode, setGuestMode] = useState<'existing' | 'new'>(preselectedGuest ? 'existing' : 'new');
  const [selectedExistingGuestId, setSelectedExistingGuestId] = useState<string>(preselectedGuest?.id || '');
  const [guestName, setGuestName] = useState<string>(preselectedGuest?.fullName || '');
  const [guestEmail, setGuestEmail] = useState<string>(preselectedGuest?.email || '');
  const [guestPhone, setGuestPhone] = useState<string>(preselectedGuest?.phone || '');
  const [guestGroup, setGuestGroup] = useState<Guest['group']>('Amici Sposo');
  const [message, setMessage] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paypal');

  const [step, setStep] = useState<'amount_and_info' | 'payment_process' | 'success'>('amount_and_info');
  const [referenceCode] = useState<string>(() => `G2-${Math.floor(10000 + Math.random() * 90000)}`);
  const [copiedIban, setCopiedIban] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const activeAmount = Number(customAmount) || 0;

  const handleSelectExistingGuest = (id: string) => {
    setSelectedExistingGuestId(id);
    const found = guests.find((g) => g.id === id);
    if (found) {
      setGuestName(found.fullName);
      setGuestEmail(found.email);
      setGuestPhone(found.phone || '');
      setGuestGroup(found.group);
    }
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeAmount <= 0) return;
    if (guestMode === 'new' && (!guestName.trim() || !guestEmail.trim())) return;
    if (guestMode === 'existing' && !selectedExistingGuestId) return;

    setStep('payment_process');
  };

  const handleCompleteContribution = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      recordDonation({
        guestId: guestMode === 'existing' ? selectedExistingGuestId : undefined,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone.trim(),
        guestGroup: guestGroup,
        giftId: gift.id,
        amount: activeAmount,
        paymentMethod: paymentMethod,
        message: message.trim(),
        status: 'completed',
      });
      setIsSubmitting(false);
      setStep('success');
    }, 400);
  };

  const handleCopyIban = () => {
    navigator.clipboard.writeText(settings.bankIban);
    setCopiedIban(true);
    setTimeout(() => setCopiedIban(false), 2000);
  };

  const payPalUrl = getPayPalLink(activeAmount, referenceCode, gift.title);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-50 border-b border-stone-200">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#636842] font-bold">
              Partecipa al Regalo
            </span>
            <h3 className="font-editorial text-xl font-semibold text-stone-900 leading-tight">
              {gift.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal content body */}
        <div className="p-6">
          {step === 'amount_and_info' && (
            <form onSubmit={handleProceedToPayment} className="space-y-6">
              {/* Product quick summary */}
              <div className="flex items-center gap-4 p-3.5 bg-stone-50 rounded-xl border border-stone-100">
                <img
                  src={gift.imageUrl}
                  alt={gift.title}
                  className="w-16 h-16 rounded-lg object-cover border border-stone-200"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-stone-500 line-clamp-1">{gift.subtitle}</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-xs text-stone-500">Già raccolti:</span>
                    <span className="text-sm font-semibold tabular-nums text-stone-900">
                      {settings.currency}{gift.raisedAmount.toLocaleString()}
                    </span>
                    {!gift.isInfiniteQuota && (
                      <>
                        <span className="text-stone-300">/</span>
                        <span className="text-xs text-stone-500 tabular-nums">
                          Obiettivo: {settings.currency}{gift.targetAmount.toLocaleString()}
                        </span>
                      </>
                    )}
                  </div>
                  {remaining !== null && (
                    <p className="text-[11px] text-[#636842] font-semibold mt-0.5">
                      Mancano {settings.currency}{remaining.toLocaleString()} al completamento
                    </p>
                  )}
                </div>
              </div>

              {/* 1. Scegli quanto versare (Cifra completamente libera) */}
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-1.5">
                  1. Quanto desideri donare? (Cifra libera)
                </label>
                <p className="text-xs text-stone-500 mb-2.5">
                  Non ci sono quote preimpostate: inserisci l'importo esatto che desideri donare.
                </p>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-stone-500 text-xl font-bold">
                    {settings.currency}
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Es. 75, 120, 250..."
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-bold text-2xl focus:outline-none focus:ring-2 focus:ring-[#BCBF97] focus:border-[#BCBF97]"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* 2. Dati Invitato */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-stone-900">
                    2. I tuoi dati
                  </label>
                  {guests.length > 0 && (
                    <div className="flex gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setGuestMode('new')}
                        className={`cursor-pointer ${
                          guestMode === 'new' ? 'text-[#636842] font-bold underline' : 'text-stone-500'
                        }`}
                      >
                        Nuovo invitato
                      </button>
                      <span className="text-stone-300">·</span>
                      <button
                        type="button"
                        onClick={() => setGuestMode('existing')}
                        className={`cursor-pointer ${
                          guestMode === 'existing' ? 'text-[#636842] font-bold underline' : 'text-stone-500'
                        }`}
                      >
                        Seleziona dalla lista
                      </button>
                    </div>
                  )}
                </div>

                {guestMode === 'existing' ? (
                  <div>
                    <select
                      value={selectedExistingGuestId}
                      onChange={(e) => handleSelectExistingGuest(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#BCBF97]"
                      required
                    >
                      <option value="">-- Seleziona il tuo nome --</option>
                      {guests.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.fullName} ({g.group})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        placeholder="Nome e Cognome *"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#BCBF97]"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Email (per conferma) *"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#BCBF97]"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Messaggio di Auguri per gli sposi */}
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-1.5">
                  3. Dedica e auguri per gli sposi
                </label>
                <textarea
                  rows={2}
                  placeholder="Scrivi qui le tue parole d'affetto per accompagnare il tuo dono..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#BCBF97]"
                />
              </div>

              {/* Submit button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={activeAmount <= 0}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  <span>Continua con la quota di {settings.currency}{activeAmount}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Scegli metodo di versamento (PayPal, Bonifico, Contanti) */}
          {step === 'payment_process' && (
            <div className="space-y-6">
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-600">Regalo scelto:</span>
                  <span className="font-semibold text-stone-900">{gift.title}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1.5">
                  <span className="text-stone-600">Donatore:</span>
                  <span className="font-medium text-stone-900">{guestName}</span>
                </div>
                <div className="flex items-center justify-between text-base mt-2 pt-2 border-t border-stone-200 font-bold">
                  <span className="text-stone-900">Importo da versare:</span>
                  <span className="text-xl tabular-nums text-[#4f5333]">
                    {settings.currency}{activeAmount}
                  </span>
                </div>
              </div>

              {/* Payment method selector */}
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-3">
                  Seleziona come desideri effettuare il versamento:
                </label>
                <div className="space-y-3">
                  {/* PayPal option */}
                  <label
                    className={`block p-4 rounded-xl border transition-all cursor-pointer ${
                      paymentMethod === 'paypal'
                        ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="paypal"
                        checked={paymentMethod === 'paypal'}
                        onChange={() => setPaymentMethod('paypal')}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-stone-900 text-sm">
                            Versamento diretto su Conto PayPal
                          </span>
                          <span className="text-[11px] font-bold text-slate-800 bg-[#A6C1D8] px-2 py-0.5 rounded">
                            Istantaneo
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-1">
                          Invia l'importo direttamente al conto PayPal degli sposi (
                          <strong className="text-stone-800">{settings.paypalEmail}</strong>).
                          Nessun intermediario, accredito immediato.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Bank Transfer option */}
                  <label
                    className={`block p-4 rounded-xl border transition-all cursor-pointer ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-[#BCBF97] bg-[#BCBF97]/15 ring-1 ring-[#BCBF97]'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank_transfer"
                        checked={paymentMethod === 'bank_transfer'}
                        onChange={() => setPaymentMethod('bank_transfer')}
                        className="mt-1 text-[#636842] focus:ring-[#BCBF97]"
                      />
                      <div className="flex-1">
                        <span className="font-semibold text-stone-900 text-sm">
                          Bonifico Bancario
                        </span>
                        <p className="text-xs text-stone-600 mt-1">
                          Riceverai le coordinate IBAN e la causale personalizzata con il codice riferimento.
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Method-specific instructions box */}
              {paymentMethod === 'paypal' && (
                <div className="p-4 bg-sky-50 rounded-xl border border-sky-100 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-sky-900">
                    <ShieldCheck className="w-4 h-4 text-sky-700" />
                    <span>Istruzioni Pagamento PayPal:</span>
                  </div>
                  <p className="text-xs text-sky-800 leading-relaxed">
                    Cliccando sul pulsante qui sotto, si aprirà il link sicuro di PayPal per inviare esattamente{' '}
                    <strong>{settings.currency}{activeAmount}</strong> a <strong>@{settings.paypalMeUsername}</strong> con riferimento <strong>{referenceCode}</strong>.
                  </p>
                  <a
                    href={payPalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#0070BA] hover:bg-[#005ea6] text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                  >
                    <span>Apri PayPal per inviare {settings.currency}{activeAmount}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {paymentMethod === 'bank_transfer' && (
                <div className="p-4 bg-[#BCBF97]/15 rounded-xl border border-[#BCBF97]/60 space-y-2 text-xs text-stone-700">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-900">IBAN:</span>
                    <button
                      type="button"
                      onClick={handleCopyIban}
                      className="flex items-center gap-1 text-[11px] font-bold text-[#555a38] hover:text-stone-950 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedIban ? 'Copiato!' : 'Copia IBAN'}</span>
                    </button>
                  </div>
                  <p className="font-mono text-xs font-semibold text-stone-900 bg-white p-2 rounded border border-[#BCBF97]">
                    {settings.bankIban}
                  </p>
                  <div className="grid grid-cols-2 gap-1 pt-1 text-[11px]">
                    <div>
                      <span className="text-stone-500">Intestatario:</span>{' '}
                      <span className="font-medium text-stone-800">{settings.bankAccountHolder}</span>
                    </div>
                    <div>
                      <span className="text-stone-500">Banca:</span>{' '}
                      <span className="font-medium text-stone-800">{settings.bankName}</span>
                    </div>
                  </div>
                  <div className="pt-1 text-[11px]">
                    <span className="text-stone-500">Causale consigliata:</span>{' '}
                    <span className="font-mono font-medium text-stone-900">
                      Regalo Nozze {settings.coupleNames} - {referenceCode} - {guestName}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('amount_and_info')}
                  className="py-3 px-4 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Indietro
                </button>
                <button
                  type="button"
                  onClick={handleCompleteContribution}
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Registrazione in corso...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#BCBF97]" />
                      <span>Conferma e Registra Donazione ({settings.currency}{activeAmount})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Success Screen */}
          {step === 'success' && (
            <div className="text-center py-6 px-4 space-y-4">
              <div className="w-16 h-16 bg-[#BCBF97]/30 text-[#4f5333] rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Sparkles className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs uppercase tracking-widest text-[#555a38] font-bold">
                  Grazie di Cuore!
                </span>
                <h4 className="font-editorial text-2xl font-bold text-stone-900 mt-1">
                  Il tuo dono è stato registrato
                </h4>
                <p className="text-xs text-stone-600 max-w-md mx-auto mt-2 leading-relaxed">
                  Caro/a <strong>{guestName}</strong>, il tuo contributo di{' '}
                  <strong className="text-stone-900">{settings.currency}{activeAmount}</strong> per{' '}
                  <strong>"{gift.title}"</strong> è stato aggiunto con successo alla lista regali.
                </p>
              </div>

              {/* Greeting card preview */}
              {message && (
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-left max-w-md mx-auto">
                  <span className="text-[10px] uppercase font-bold text-stone-400">
                    Il tuo messaggio per gli sposi:
                  </span>
                  <p className="font-editorial italic text-stone-800 text-sm mt-1">
                    "{message}"
                  </p>
                </div>
              )}

              <div className="pt-4 flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-6 bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Torna alla Lista Regali
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
