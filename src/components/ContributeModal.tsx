import { useLanguage } from '../context/LanguageContext';
import React, { useState } from 'react';
import { GiftItem, PaymentMethod, Guest } from '../types';
import { useRegistry } from '../context/RegistryContext';
import { X, Check, CreditCard, Heart, ArrowRight, Copy, CheckCircle2, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { ExpressCheckoutButton } from '@mdf/stripe-express-connect';

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
  const { language, t } = useLanguage();
  const { settings, guests, recordDonation } = useRegistry();

  if (!gift) return null;

  const percent = gift.isInfiniteQuota
    ? 100
    : gift.targetAmount > 0
    ? Math.min(100, Math.round((gift.raisedAmount / gift.targetAmount) * 100))
    : 0;

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    settings.stripeEnabled ? 'stripe' : 'bank_transfer'
  );

  const [step, setStep] = useState<'amount_and_info' | 'payment_process' | 'success'>('amount_and_info');
  const [referenceCode] = useState<string>(() => `G2-${Math.floor(10000 + Math.random() * 90000)}`);
  const [copiedIban, setCopiedIban] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [stripeCheckoutError, setStripeCheckoutError] = useState<string | null>(null);

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

  const stripeCheckoutMetadata = {
    giftId: gift.id,
    guestId: guestMode === 'existing' ? selectedExistingGuestId : '',
    guestName: guestName.trim(),
    guestEmail: guestEmail.trim(),
    guestPhone: guestPhone.trim(),
    guestGroup,
    message: message.trim(),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-50 border-b border-stone-200">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#636842] font-bold">
              {t("Partecipa al Regalo", "Contribute to this gift")}
            </span>
            <h3 className="font-editorial text-xl font-semibold text-stone-900 leading-tight">
              {language === 'en' ? (gift.titleEn || gift.title) : gift.title}
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
                  alt={language === 'en' ? (gift.titleEn || gift.title) : gift.title}
                  className="w-16 aspect-[3/4] rounded-lg object-cover border border-stone-200 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-stone-500 line-clamp-1">{language === 'en' ? (gift.subtitleEn || gift.subtitle) : gift.subtitle}</p>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-stone-500 font-medium">{t("Prezzo totale:", "Total price:")}</span>
                      <span className="font-bold text-stone-900 tabular-nums text-sm">
                        {gift.isInfiniteQuota
                          ? t('Quota libera', 'Any amount')
                          : `${settings.currency}${gift.targetAmount.toLocaleString()}`}
                      </span>
                    </div>
                    {!gift.isInfiniteQuota && (
                      <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#636842] rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 1. Scegli quanto versare (Cifra completamente libera) */}
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-1.5">
                  {t("1. Quanto desideri donare? (Cifra libera)", "1. How much would you like to give?")}
                </label>
                <p className="text-xs text-stone-500 mb-2.5">
                  {t("Non ci sono quote preimpostate: inserisci l'importo esatto che desideri donare.", "There are no preset amounts: enter the exact amount you wish to give.")}
                </p>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-stone-500 text-xl font-bold">
                    {settings.currency}
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder={t("Es. 75, 120, 250...", "E.g. 75, 120, 250...")}
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
                    {t("2. I tuoi dati", "2. Your details")}
                  </label>
                </div>

                {guestMode === 'existing' ? (
                  <div>
                    <select
                      value={selectedExistingGuestId}
                      onChange={(e) => handleSelectExistingGuest(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#BCBF97]"
                      required
                    >
                      <option value="">{t("-- Seleziona il tuo nome --", "-- Select your name --")}</option>
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
                        placeholder={t("Nome e Cognome *", "Full name *")}
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#BCBF97]"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder={t("Email (per conferma) *", "Email (for confirmation) *")}
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
                  {t("3. Dedica e auguri per gli sposi", "3. Your message to the couple")}
                </label>
                <textarea
                  rows={2}
                  placeholder={t("Scrivi qui le tue parole d'affetto per accompagnare il tuo dono...", "Write a message to accompany your gift...")}
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
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[#636842] hover:bg-[#525636] disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  <span>{t('Continua con la quota di', 'Continue with')} {settings.currency}{activeAmount}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Scegli metodo di versamento */}
          {step === 'payment_process' && (
            <div className="space-y-6">
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-600">{t("Regalo scelto:", "Selected gift:")}</span>
                  <span className="font-semibold text-stone-900">{language === 'en' ? (gift.titleEn || gift.title) : gift.title}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1.5">
                  <span className="text-stone-600">{t("Donatore:", "From:")}</span>
                  <span className="font-medium text-stone-900">{guestName}</span>
                </div>
                <div className="flex items-center justify-between text-base mt-2 pt-2 border-t border-stone-200 font-bold">
                  <span className="text-stone-900">{t("Importo da versare:", "Amount:")}</span>
                  <span className="text-xl tabular-nums text-[#4f5333]">
                    {settings.currency}{activeAmount}
                  </span>
                </div>
              </div>

              {/* Payment method selector */}
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-3">
                  {t("Seleziona come desideri effettuare il versamento:", "Choose how you would like to pay:")}
                </label>
                <div className="space-y-3">
                  {/* Stripe Card option */}
                  {settings.stripeEnabled && <label
                    className={`block p-4 rounded-xl border transition-all cursor-pointer ${
                      paymentMethod === 'stripe'
                        ? 'border-emerald-700 bg-emerald-50/40 ring-1 ring-emerald-600'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="stripe"
                        checked={paymentMethod === 'stripe'}
                        onChange={() => setPaymentMethod('stripe')}
                        className="mt-1 text-emerald-700 focus:ring-emerald-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-stone-900 text-sm flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-emerald-700" />
                            <span>{t("Carta di Credito o Debito (Stripe)", "Credit or debit card (Stripe)")}</span>
                          </span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            Visa / MC / Amex
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-1">
                          {t("Paga direttamente con la tua carta in sicurezza. Nessun account richiesto.", "Pay securely with your card. No account required.")}
                        </p>
                      </div>
                    </div>
                  </label>}

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
                          {t("Bonifico Bancario", "Bank transfer")}
                        </span>
                        <p className="text-xs text-stone-600 mt-1">
                          {t("Riceverai le coordinate IBAN e la causale personalizzata con il codice riferimento.", "You will receive the bank details and a payment reference.")}
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Method-specific instructions box */}
              {paymentMethod === 'stripe' && (
                <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                      <CreditCard className="w-4 h-4 text-emerald-700" />
                      <span>{t("Checkout sicuro Stripe", "Secure Stripe Checkout")}</span>
                    </div>
                    <span className="text-[10px] font-mono text-stone-500 bg-white px-2 py-0.5 rounded border border-stone-200">
                      Stripe TLS 256-bit
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed">
                    {t("I dati della carta non transitano dal sito: Stripe gestisce il pagamento e accredita il contributo direttamente sul conto degli sposi.", "Your card details do not pass through this site. Stripe processes the payment directly to the couple’s account.")}
                  </p>
                  <ExpressCheckoutButton
                    accountId={settings.stripeAccountId || 'connected-account'}
                    amount={activeAmount}
                    currency="eur"
                    locale={language}
                    loadingLabel={t('Reindirizzamento…', 'Opening checkout…')}
                    metadata={stripeCheckoutMetadata}
                    onError={(error) => setStripeCheckoutError(language === 'en' ? 'Unable to open checkout. Please check that pop-ups are allowed and try again.' : error.message)}
                    className="w-full py-3 px-5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t('Vai al Checkout Stripe', 'Go to Stripe Checkout')} · {settings.currency}{activeAmount}</span>
                  </ExpressCheckoutButton>
                </div>
              )}

              {stripeCheckoutError && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800">
                  {stripeCheckoutError}
                </p>
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
                      <span>{copiedIban ? t('Copiato!', 'Copied!') : t('Copia IBAN', 'Copy IBAN')}</span>
                    </button>
                  </div>
                  <p className="font-mono text-xs font-semibold text-stone-900 bg-white p-2 rounded border border-[#BCBF97]">
                    {settings.bankIban}
                  </p>
                  <div className="grid grid-cols-2 gap-1 pt-1 text-[11px]">
                    <div>
                      <span className="text-stone-500">{t("Intestatario:", "Account holder:")}</span>{' '}
                      <span className="font-medium text-stone-800">{settings.bankAccountHolder}</span>
                    </div>
                    <div>
                      <span className="text-stone-500">{t("Banca:", "Bank:")}</span>{' '}
                      <span className="font-medium text-stone-800">{settings.bankName}</span>
                    </div>
                  </div>
                  <div className="pt-1 text-[11px]">
                    <span className="text-stone-500">{t("Causale consigliata:", "Suggested payment reference:")}</span>{' '}
                    <span className="font-mono font-medium text-stone-900">
                      {t('Regalo Nozze', 'Wedding gift')} {settings.coupleNames} - {referenceCode} - {guestName}
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
                  {t("Indietro", "Back")}
                </button>
                {paymentMethod !== 'apple_pay' && paymentMethod !== 'stripe' && (
                  <button
                    type="button"
                    onClick={handleCompleteContribution}
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-4 bg-[#636842] hover:bg-[#525636] text-white font-semibold text-sm rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <span>{t("Registrazione in corso...", "Recording...")}</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#BCBF97]" />
                        <span>{t('Conferma e Registra Donazione', 'Confirm and record gift')} ({settings.currency}{activeAmount})</span>
                      </>
                    )}
                  </button>
                )}
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
                  {t("Grazie di Cuore!", "Thank you so much!")}
                </span>
                <h4 className="font-editorial text-2xl font-bold text-stone-900 mt-1">
                  {t("Il tuo dono è stato registrato", "Your gift has been recorded")}
                </h4>
                <p className="text-xs text-stone-600 max-w-md mx-auto mt-2 leading-relaxed">
                  {t('Caro/a', 'Dear')} <strong>{guestName}</strong>, {t('il tuo contributo di', 'your gift of')}{' '}
                  <strong className="text-stone-900">{settings.currency}{activeAmount}</strong> {t('per', 'for')}{' '}
                  <strong>"{language === 'en' ? (gift.titleEn || gift.title) : gift.title}"</strong> {t('è stato aggiunto con successo alla lista regali.', 'has been added to the gift list.')}
                </p>
              </div>

              {/* Greeting card preview */}
              {message && (
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-left max-w-md mx-auto">
                  <span className="text-[10px] uppercase font-bold text-stone-400">
                    {t("Il tuo messaggio per gli sposi:", "Your message to the couple:")}
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
                  className="py-2.5 px-6 bg-[#636842] hover:bg-[#525636] text-white font-medium text-xs rounded-xl transition-colors cursor-pointer"
                >
                  {t("Torna alla Lista Regali", "Back to the gift list")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
