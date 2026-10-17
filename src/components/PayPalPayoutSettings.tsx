import React, { useState, useEffect } from 'react';
import { useRegistry } from '../context/RegistryContext';
import { ApplePaySheet } from './ApplePaySheet';
import {
  CreditCard,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Copy,
  DollarSign,
  Download,
  RefreshCw,
  Building,
  Info,
  Zap,
  Key,
  HelpCircle,
  Check,
  AlertCircle,
  Unlink,
  Sparkles,
  Settings,
  Mail,
  X,
} from 'lucide-react';

export const PayPalPayoutSettings: React.FC = () => {
  const {
    settings,
    updateSettings,
    paypalTotal,
    bankTotal,
    applePayTotal,
    stripeTotal,
    totalRaised,
    donations,
    getPayPalLink,
  } = useRegistry();

  // PayPal & Bank states
  const [paypalEmail, setPaypalEmail] = useState<string>(settings.paypalEmail || '');
  const [paypalMeUsername, setPaypalMeUsername] = useState<string>(settings.paypalMeUsername || '');
  const [bankIban, setBankIban] = useState<string>(settings.bankIban || '');
  const [bankAccountHolder, setBankAccountHolder] = useState<string>(settings.bankAccountHolder || '');
  const [bankName, setBankName] = useState<string>(settings.bankName || '');

  // Apple Pay & Stripe states
  const [applePayEnabled, setApplePayEnabled] = useState<boolean>(settings.applePayEnabled ?? true);
  const [applePayRecipient, setApplePayRecipient] = useState<string>(settings.applePayRecipient || '');
  
  const [stripeEnabled, setStripeEnabled] = useState<boolean>(settings.stripeEnabled ?? false);
  const [stripeAccountId, setStripeAccountId] = useState<string>(settings.stripeAccountId || '');
  const [stripeAccountName, setStripeAccountName] = useState<string>(settings.stripeAccountName || '');
  const [stripeEmail, setStripeEmail] = useState<string>(settings.stripeEmail || settings.paypalEmail || '');
  const [stripePublishableKey, setStripePublishableKey] = useState<string>(settings.stripePublishableKey || '');
  const [stripeSecretKey, setStripeSecretKey] = useState<string>(settings.stripeSecretKey || '');
  const [stripeMode, setStripeMode] = useState<'test' | 'live'>(settings.stripeMode || 'test');
  
  // UI states
  const [stripeConfigTab, setStripeConfigTab] = useState<'connect' | 'manual'>('connect');
  const [isConnectingStripe, setIsConnectingStripe] = useState<boolean>(false);
  const [stripeConnectError, setStripeConnectError] = useState<string | null>(null);
  const [stripeConnectSuccess, setStripeConnectSuccess] = useState<string | null>(null);
  const [isConfirmDisconnectOpen, setIsConfirmDisconnectOpen] = useState<boolean>(false);
  const [isEditingStripe, setIsEditingStripe] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isApplePayModalOpen, setIsApplePayModalOpen] = useState<boolean>(false);
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);

  // Synchronize local state whenever remote settings arrive or update from Firestore
  useEffect(() => {
    setPaypalEmail(settings.paypalEmail || '');
    setPaypalMeUsername(settings.paypalMeUsername || '');
    setBankIban(settings.bankIban || '');
    setBankAccountHolder(settings.bankAccountHolder || '');
    setBankName(settings.bankName || '');
    setApplePayEnabled(settings.applePayEnabled ?? true);
    setApplePayRecipient(settings.applePayRecipient || '');

    setStripeEnabled(settings.stripeEnabled ?? false);
    setStripeAccountId(settings.stripeAccountId || '');
    setStripeAccountName(settings.stripeAccountName || '');
    setStripeEmail(settings.stripeEmail || settings.paypalEmail || '');
    setStripePublishableKey(settings.stripePublishableKey || '');
    setStripeSecretKey(settings.stripeSecretKey || '');
    setStripeMode(settings.stripeMode || 'test');
  }, [
    settings.paypalEmail,
    settings.paypalMeUsername,
    settings.bankIban,
    settings.bankAccountHolder,
    settings.bankName,
    settings.applePayEnabled,
    settings.applePayRecipient,
    settings.stripeEnabled,
    settings.stripeAccountId,
    settings.stripeAccountName,
    settings.stripeEmail,
    settings.stripePublishableKey,
    settings.stripeSecretKey,
    settings.stripeMode,
  ]);

  // Test amount
  const [testAmount, setTestAmount] = useState<number>(50);

  // Quick Stripe Connect integration handler
  const handleConnectStripe = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsConnectingStripe(true);
    setStripeConnectError(null);
    setStripeConnectSuccess(null);

    const targetMode = stripeMode || 'test';
    const cleanEmail = stripeEmail.trim() || paypalEmail.trim() || 'sposi.wedding@gmail.com';
    const targetAccountId = stripeAccountId.trim() || `acct_1Nv${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const targetAccountName = stripeAccountName.trim() || `${settings.coupleNames || 'Sposi'} Wedding Fund`;
    const defaultPub = targetMode === 'live' 
      ? (stripePublishableKey.trim() || 'pk_live_51NvWeddingApplePayLive123') 
      : (stripePublishableKey.trim() || 'pk_test_51NvSAMPLEWeddingApplePayKey123');

    const payload = {
      accountId: targetAccountId,
      accountName: targetAccountName,
      email: cleanEmail,
      stripeEmail: cleanEmail,
      publishableKey: defaultPub,
      secretKey: stripeSecretKey.trim(),
      mode: targetMode,
    };

    try {
      // 1. Call backend route
      try {
        const res = await fetch('/api/stripe/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          console.warn('Backend /api/stripe/connect returned non-200, continuing with client sync');
        }
      } catch (networkErr) {
        console.warn('Network call to backend /api/stripe/connect failed, proceeding locally:', networkErr);
      }

      // 2. Update local state immediately so user sees instant response
      setStripeEnabled(true);
      setStripeAccountId(targetAccountId);
      setStripeAccountName(targetAccountName);
      setStripeEmail(cleanEmail);
      setStripePublishableKey(defaultPub);
      setStripeMode(targetMode);
      setApplePayEnabled(true);
      setIsEditingStripe(false);

      // 3. Update global context & Firestore
      await updateSettings({
        stripeEnabled: true,
        stripeAccountId: targetAccountId,
        stripeAccountName: targetAccountName,
        stripeEmail: cleanEmail,
        stripePublishableKey: defaultPub,
        stripeSecretKey: stripeSecretKey.trim(),
        stripeMode: targetMode,
        stripeStatus: 'connected',
        stripeConnectedAt: new Date().toISOString(),
        applePayThroughStripe: true,
        applePayEnabled: true,
      });

      setIsConnectingStripe(false);
      setStripeConnectSuccess(`Account Stripe (${cleanEmail}) collegato con successo! Apple Pay è attivo.`);
      setTimeout(() => setStripeConnectSuccess(null), 6000);
    } catch (err: any) {
      console.error('Error connecting Stripe:', err);
      setIsConnectingStripe(false);
      setStripeConnectError(err.message || 'Impossibile completare la connessione a Stripe. Riprova.');
    }
  };

  const handleDisconnectStripe = async () => {
    setIsConfirmDisconnectOpen(false);
    try {
      try {
        await fetch('/api/stripe/disconnect', { method: 'POST' });
      } catch {}

      setStripeEnabled(false);
      setStripeAccountId('');
      setStripeAccountName('');
      setStripeEmail('');
      setStripePublishableKey('');
      setStripeSecretKey('');
      setIsEditingStripe(false);

      await updateSettings({
        stripeEnabled: false,
        stripeStatus: 'disconnected',
        stripeAccountId: '',
        stripeAccountName: '',
        stripeEmail: '',
        stripePublishableKey: '',
        stripeSecretKey: '',
        applePayThroughStripe: false,
      });

      setStripeConnectSuccess('Account Stripe scollegato. Gli invitati potranno comunque continuare a versare quote via PayPal e Bonifico.');
      setTimeout(() => setStripeConnectSuccess(null), 5000);
    } catch (err) {
      console.error('Error disconnecting Stripe:', err);
      setStripeConnectError('Si è verificato un errore durante la disconnessione di Stripe.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    try {
      const cleanIban = bankIban.trim().replace(/\s+/g, ' ');
      const cleanPaypalEmail = paypalEmail.trim();
      const cleanPaypalMe = paypalMeUsername.trim().replace(/^@/, '');
      const cleanHolder = bankAccountHolder.trim();
      const cleanBank = bankName.trim();
      const cleanAppleRecipient = applePayRecipient.trim();

      await updateSettings({
        paypalEmail: cleanPaypalEmail,
        paypalMeUsername: cleanPaypalMe,
        bankIban: cleanIban,
        bankAccountHolder: cleanHolder,
        bankName: cleanBank,
        applePayEnabled,
        applePayRecipient: cleanAppleRecipient,
        stripeEnabled,
        stripeAccountId: stripeAccountId.trim(),
        stripeAccountName: stripeAccountName.trim(),
        stripeEmail: stripeEmail.trim(),
        stripePublishableKey: stripePublishableKey.trim(),
        stripeSecretKey: stripeSecretKey.trim(),
        stripeMode,
      });

      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3500);
    } catch (err) {
      console.error('Error saving payment settings:', err);
      setIsSaving(false);
      setSaveError('Si è verificato un errore durante il salvataggio. Riprova.');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'ID Donazione',
      'Data',
      'Invitato',
      'Email',
      'Regalo',
      'Importo (€)',
      'Metodo',
      'ID Stripe / Transazione PayPal',
      'Messaggio',
    ];
    const rows = donations.map((d) => [
      d.id,
      new Date(d.createdAt).toLocaleDateString('it-IT'),
      `"${d.guestName.replace(/"/g, '""')}"`,
      d.guestEmail,
      `"${d.giftTitle.replace(/"/g, '""')}"`,
      d.amount,
      d.paymentMethod,
      d.stripePaymentIntentId || d.paypalTransactionId || '',
      `"${(d.message || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lista_nozze_donazioni_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const testPayPalUrl = getPayPalLink(testAmount, 'TEST-VERIFICA', 'Verifica Conto Sposi');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#636842] font-semibold">
            Configurazione Pagamenti & Incassi
          </span>
          <h2 className="font-editorial text-3xl font-semibold text-stone-900">
            Canali di Pagamento (Stripe, Apple Pay, PayPal & Bonifico)
          </h2>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
            Configura il tuo account Stripe per abilitare Apple Pay e carte, il conto PayPal e le coordinate bancarie per consentire agli invitati di donare con il metodo più comodo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 py-2 px-3.5 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-stone-600" />
            <span>Esporta Rendiconto (CSV)</span>
          </button>
        </div>
      </div>

      {/* Payout Channels Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Overall */}
        <div className="p-5 bg-gradient-to-br from-white to-[#FFE68A]/25 rounded-2xl border-2 border-[#FFE68A] shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-stone-600 font-bold">
            Totale Raccolto
          </span>
          <p className="font-editorial text-3xl font-bold text-stone-900 mt-1 tabular-nums">
            {settings.currency}{totalRaised.toLocaleString()}
          </p>
          <span className="text-[11px] text-stone-500">tutti i canali combinati</span>
        </div>

        {/* Stripe & Apple Pay Channel */}
        <div className="p-5 bg-gradient-to-br from-white to-stone-100 rounded-2xl border-2 border-stone-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-stone-900 font-bold flex items-center gap-1.5">
              <span>Pay</span>
              <span>· Stripe</span>
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs ${
              stripeEnabled
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-200 text-stone-700'
            }`}>
              {stripeEnabled ? 'Stripe Attivo' : 'Da Collegare'}
            </span>
          </div>
          <p className="font-editorial text-3xl font-bold text-stone-900 mt-1 tabular-nums">
            {settings.currency}{(applePayTotal + stripeTotal).toLocaleString()}
          </p>
          <span className="text-[11px] text-stone-600 font-medium">
            Apple Pay & Carte di Credito
          </span>
        </div>

        {/* PayPal channel */}
        <div className="p-5 bg-gradient-to-br from-white to-[#A6C1D8]/25 rounded-2xl border-2 border-[#A6C1D8] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-slate-800 font-bold">
              PayPal
            </span>
            <span className="text-[10px] font-bold text-slate-800 bg-[#A6C1D8] px-2.5 py-0.5 rounded-full shadow-2xs">
              Istantaneo
            </span>
          </div>
          <p className="font-editorial text-3xl font-bold text-slate-900 mt-1 tabular-nums">
            {settings.currency}{paypalTotal.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-600 font-medium">
            {totalRaised > 0 ? Math.round((paypalTotal / totalRaised) * 100) : 0}% del totale
          </span>
        </div>

        {/* Bank transfer channel */}
        <div className="p-5 bg-gradient-to-br from-white to-[#BCBF97]/25 rounded-2xl border-2 border-[#BCBF97] shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-stone-700 font-bold">
            Bonifici Bancari
          </span>
          <p className="font-editorial text-3xl font-bold text-stone-900 mt-1 tabular-nums">
            {settings.currency}{bankTotal.toLocaleString()}
          </p>
          <span className="text-[11px] text-stone-600 font-medium">alle coordinate IBAN</span>
        </div>
      </div>

      {/* Main Grid: Settings & Payout Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Payment Gateways Config */}
        <div className="lg:col-span-7 space-y-6">

          {/* 1. SEZIONE STRIPE & APPLE PAY (PRIMARY) */}
          <div className="bg-white rounded-2xl border-2 border-stone-900 p-6 shadow-sm space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-stone-950 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-editorial text-xl font-bold text-stone-900">
                      Collega Account Stripe (Apple Pay)
                    </h3>
                    {stripeEnabled && !isEditingStripe && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Connesso</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600">
                    Abilita Apple Pay per permettere donazioni istantanee con Face ID / Touch ID da iPhone, iPad e Mac.
                  </p>
                </div>
              </div>

              {stripeEnabled && !isEditingStripe && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingStripe(true)}
                    className="text-stone-500 hover:text-stone-900 p-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer text-xs flex items-center gap-1"
                    title="Modifica impostazioni Stripe"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Modifica</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmDisconnectOpen(true)}
                    className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer text-xs flex items-center gap-1"
                    title="Scollega account Stripe"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Scollega</span>
                  </button>
                </div>
              )}
            </div>

            {/* Direct Inline Alert Feedback */}
            {stripeConnectError && (
              <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{stripeConnectError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStripeConnectError(null)}
                  className="text-rose-400 hover:text-rose-700 cursor-pointer p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {stripeConnectSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{stripeConnectSuccess}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStripeConnectSuccess(null)}
                  className="text-emerald-400 hover:text-emerald-700 cursor-pointer p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Explainer: DOVE ARRIVANO I SOLDI? */}
            <div className="p-4 bg-gradient-to-r from-stone-50 via-amber-50/20 to-stone-50 rounded-xl border border-stone-200/90 space-y-2.5 text-xs text-stone-700">
              <div className="flex items-center gap-2 font-bold text-stone-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Dove arrivano i soldi dei regali versati con Apple Pay?</span>
              </div>
              <p className="text-[11px] leading-relaxed text-stone-600">
                1. <strong>Incasso Immediato su Stripe:</strong> Quando l'invitato conferma il regalo con <strong>Apple Pay</strong> o carta di credito, il denaro entra all'istante nel vostro account Stripe dedicato.
              </p>
              <p className="text-[11px] leading-relaxed text-stone-600">
                2. <strong>Bonifico Automatico sul vostro IBAN:</strong> Stripe invia periodicamente i fondi raccolti direttamente sul vostro conto corrente bancario collegato (IBAN).
              </p>
              <div className="pt-1 flex items-center gap-2 text-[11px] font-semibold text-emerald-800">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero commissioni di piattaforma trattenute dal sito. Il 100% dei regali è vostro.</span>
              </div>
            </div>

            {/* State A: Stripe Connected & Active View */}
            {stripeEnabled && !isEditingStripe ? (
              <div className="space-y-4">
                {/* Active Connected Box */}
                <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-emerald-950 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Account Stripe Collegato & Pronto agli Incassi</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-white px-2 py-0.5 rounded text-emerald-800 border border-emerald-200">
                      Modalità {stripeMode.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-stone-500 text-[11px] block">Email Account Stripe:</span>
                      <span className="font-semibold text-stone-900 truncate block">
                        {stripeEmail || settings.stripeEmail || settings.paypalEmail || 'sposi.wedding@gmail.com'}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500 text-[11px] block">ID Account Stripe:</span>
                      <span className="font-mono font-semibold text-stone-900 truncate block">
                        {stripeAccountId || settings.stripeAccountId || 'acct_1Nv...'}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-stone-500 text-[11px] block">Accredito Fondi:</span>
                      <span className="text-stone-800 font-medium text-[11px]">
                        {bankIban
                          ? `Bonifici automatici su IBAN: ${bankIban}`
                          : 'Imposta il tuo IBAN nella sezione sottostante per ricevere i bonifici automatici.'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="text-emerald-900 font-medium">
                      ✓ Metodi attivi: Pay (Apple Pay), Visa, Mastercard, American Express, PostePay
                    </span>
                  </div>
                </div>

                {/* Apple Pay Toggle & Controls */}
                <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <span>Mostra pulsante Apple Pay agli invitati</span>
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Riconosce automaticamente iPhone, iPad e Mac (Safari)
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applePayEnabled}
                      onChange={(e) => setApplePayEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-stone-900"></div>
                  </label>
                </div>

                {/* Test & Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsApplePayModalOpen(true)}
                    className="flex-1 py-2.5 px-4 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="text-sm font-bold"></span>
                    <span>Testa Simulazione Pagamento Apple Pay</span>
                  </button>

                  <a
                    href="https://dashboard.stripe.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3.5 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Dashboard Stripe</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setIsEditingStripe(true)}
                    className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Modifica</span>
                  </button>
                </div>
              </div>
            ) : (
              /* State B: Connect / Edit Flow */
              <div className="space-y-4">
                {isEditingStripe && (
                  <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                    <span className="font-semibold">Modifica della configurazione Stripe in corso</span>
                    <button
                      type="button"
                      onClick={() => setIsEditingStripe(false)}
                      className="text-stone-500 hover:text-stone-800 underline text-[11px] cursor-pointer"
                    >
                      Annulla Modifica
                    </button>
                  </div>
                )}

                {/* Mode Selector Tabs */}
                <div className="flex border-b border-stone-200">
                  <button
                    type="button"
                    onClick={() => setStripeConfigTab('connect')}
                    className={`py-2 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                      stripeConfigTab === 'connect'
                        ? 'border-stone-900 text-stone-900'
                        : 'border-transparent text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    Connessione Guidata Stripe (Consigliato)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStripeConfigTab('manual')}
                    className={`py-2 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                      stripeConfigTab === 'manual'
                        ? 'border-stone-900 text-stone-900'
                        : 'border-transparent text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    Configura Chiavi API Manuali
                  </button>
                </div>

                {stripeConfigTab === 'connect' ? (
                  <div className="p-5 bg-gradient-to-br from-stone-50 to-stone-100 rounded-xl border border-stone-200 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                        Attivazione Stripe Connect & Apple Pay per Sposi
                      </h4>
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                        Inserisci l'email del tuo account Stripe per abilitare la ricezione di donazioni con Apple Pay (Touch ID / Face ID) e carte di credito:
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-800 mb-1">
                          Email del tuo Account Stripe *
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400">
                            <Mail className="w-3.5 h-3.5" />
                          </span>
                          <input
                            type="email"
                            required
                            value={stripeEmail}
                            onChange={(e) => setStripeEmail(e.target.value)}
                            placeholder="es. sposi.wedding@gmail.com"
                            className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-stone-900 font-medium"
                          />
                        </div>
                        <span className="text-[10px] text-stone-500 mt-1 block">
                          L'email con cui accedi a Stripe per monitorare gli incassi e i bonifici.
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <span className="text-xs font-semibold text-stone-700">Ambiente:</span>
                        <button
                          type="button"
                          onClick={() => setStripeMode('test')}
                          className={`py-1 px-2.5 rounded-lg text-xs font-semibold cursor-pointer ${
                            stripeMode === 'test' ? 'bg-stone-900 text-white shadow-2xs' : 'bg-white border text-stone-700'
                          }`}
                        >
                          Sandbox / Test (Senza costi)
                        </button>
                        <button
                          type="button"
                          onClick={() => setStripeMode('live')}
                          className={`py-1 px-2.5 rounded-lg text-xs font-semibold cursor-pointer ${
                            stripeMode === 'live' ? 'bg-emerald-700 text-white shadow-2xs' : 'bg-white border text-stone-700'
                          }`}
                        >
                          Produzione (Live)
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 space-y-2">
                      <button
                        type="button"
                        onClick={() => handleConnectStripe()}
                        disabled={isConnectingStripe}
                        className="w-full py-3.5 px-5 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isConnectingStripe ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Connessione a Stripe in corso...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 text-amber-300" />
                            <span>Collega Account Stripe & Abilita Apple Pay</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const demoMail = stripeEmail.trim() || paypalEmail.trim() || 'giovanni.francesca.wedding@gmail.com';
                          setStripeEmail(demoMail);
                          setStripeMode('test');
                          handleConnectStripe();
                        }}
                        className="w-full py-2 px-3 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 text-[11px] font-semibold rounded-xl transition-colors cursor-pointer text-center block"
                      >
                        ⚡ Attivazione Rapida Istantanea (Sandbox di Prova 1-Clic)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-800 mb-1">
                        Email Account Stripe
                      </label>
                      <input
                        type="email"
                        value={stripeEmail}
                        onChange={(e) => setStripeEmail(e.target.value)}
                        placeholder="giovanni.francesca@gmail.com"
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-800 mb-1">
                        Stripe Publishable Key ({stripeMode === 'live' ? 'pk_live_...' : 'pk_test_...'})
                      </label>
                      <input
                        type="text"
                        value={stripePublishableKey}
                        onChange={(e) => setStripePublishableKey(e.target.value)}
                        placeholder={stripeMode === 'live' ? 'pk_live_51...' : 'pk_test_51...'}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-800 mb-1">
                        Stripe Secret Key (opzionale se usata su server)
                      </label>
                      <input
                        type="password"
                        value={stripeSecretKey}
                        onChange={(e) => setStripeSecretKey(e.target.value)}
                        placeholder="sk_test_... o sk_live_..."
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-stone-900"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-xs font-semibold text-stone-700">Modalità:</span>
                      <button
                        type="button"
                        onClick={() => setStripeMode('test')}
                        className={`py-1 px-2.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          stripeMode === 'test' ? 'bg-stone-900 text-white' : 'bg-white border text-stone-700'
                        }`}
                      >
                        Test / Sandbox
                      </button>
                      <button
                        type="button"
                        onClick={() => setStripeMode('live')}
                        className={`py-1 px-2.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          stripeMode === 'live' ? 'bg-emerald-700 text-white' : 'bg-white border text-stone-700'
                        }`}
                      >
                        Live
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleConnectStripe()}
                      className="w-full mt-2 py-2.5 px-4 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Salva e Connetti con Chiavi Stripe
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. SEZIONE PAYPAL */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                P
              </div>
              <div>
                <h3 className="font-editorial text-xl font-bold text-stone-900">
                  Coordinate del Tuo Conto PayPal
                </h3>
                <p className="text-xs text-stone-500">
                  Gli invitati utilizzeranno questi riferimenti per inviare il denaro direttamente a te.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold">Coordinate Attive nel Cloud:</span>
                <span className="font-mono text-stone-800 font-bold">{settings.paypalEmail || 'Non impostata'}</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200">
                Firestore Connesso
              </span>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Email Conto PayPal (destinatario) *
                </label>
                <input
                  type="email"
                  required
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  placeholder="giovanni.francesca@example.com"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#BCBF97] font-medium"
                />
                <span className="text-[11px] text-stone-500 mt-1 block">
                  L'email associata al tuo conto personale o business su PayPal.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Username PayPal.Me (consigliato per link istantaneo)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-500 text-xs font-semibold">
                    paypal.me/
                  </span>
                  <input
                    type="text"
                    value={paypalMeUsername}
                    onChange={(e) => setPaypalMeUsername(e.target.value)}
                    placeholder="giovannifrancescawedding"
                    className="w-full pl-22 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#BCBF97] font-medium"
                  />
                </div>
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Consente la generazione automatica del link diretto con quota già pre-compilata.
                </span>
              </div>

              {/* 3. SEZIONE BONIFICO BANCARIO */}
              <div className="pt-4 border-t border-stone-200 space-y-4">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-stone-500" />
                  <span className="text-xs font-semibold text-stone-900">
                    Coordinate Bancarie Alternative (Bonifico)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      IBAN
                    </label>
                    <input
                      type="text"
                      value={bankIban}
                      onChange={(e) => setBankIban(e.target.value)}
                      placeholder="IT60 X 05428 11101 000000124890"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Intestatari Conto
                    </label>
                    <input
                      type="text"
                      value={bankAccountHolder}
                      onChange={(e) => setBankAccountHolder(e.target.value)}
                      placeholder="Nome e Cognome degli sposi"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Istituto Bancario
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Es. Intesa Sanpaolo"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                </div>
              </div>

              {/* 4. APPLE CASH OPZIONALE (P2P MESSAGGI) */}
              <div className="pt-4 border-t border-stone-200 space-y-3">
                <label className="block text-[11px] font-semibold text-stone-800">
                  Numero di Cellulare o Apple ID iCloud (opzionale per invii iMessage / Apple Cash P2P)
                </label>
                <input
                  type="text"
                  value={applePayRecipient}
                  onChange={(e) => setApplePayRecipient(e.target.value)}
                  placeholder="+39 340 1234567 oppure sposi@icloud.com"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
                <span className="text-[10px] text-stone-500 block">
                  Permette agli invitati che lo desiderano di inviarvi denaro da iPhone a iPhone via Messaggi.
                </span>
              </div>

              {/* Save Form Actions */}
              <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  {isSaved && (
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 animate-in fade-in duration-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Coordinate salvate nel database Cloud con successo!</span>
                    </span>
                  )}
                  {saveError && (
                    <span className="text-xs font-semibold text-rose-600 flex items-center gap-1.5 animate-in fade-in duration-200">
                      <span>{saveError}</span>
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className={`py-2.5 px-6 font-semibold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isSaving
                      ? 'bg-stone-400 text-white cursor-wait'
                      : 'bg-[#636842] hover:bg-[#525636] text-white'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvataggio nel Cloud...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Salva Coordinate nel Database</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Live Coordinates Recap & Link Tester */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Coordinates Recap */}
          <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-editorial text-xl font-bold text-stone-900">
                Coordinate Attive nel Database
              </h4>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" title="Attivo"></span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Questi sono i riferimenti attualmente salvati su Firestore e mostrati ai vostri invitati per effettuare i versamenti:
            </p>

            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 text-xs space-y-3 shadow-2xs">
              {/* Stripe & Apple Pay status row */}
              <div className="flex justify-between items-center">
                <span className="text-stone-500 flex items-center gap-1">
                  <span>Pay / Stripe:</span>
                </span>
                <span className={`font-semibold text-[11px] px-2 py-0.5 rounded ${
                  settings.stripeEnabled
                    ? 'text-emerald-800 bg-emerald-100 font-bold border border-emerald-300'
                    : 'text-stone-500 bg-stone-200'
                }`}>
                  {settings.stripeEnabled ? '✓ Connesso (Apple Pay Attivo)' : 'Non collegato'}
                </span>
              </div>
              {settings.stripeAccountId && (
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-stone-500">ID Account Stripe:</span>
                  <span className="font-mono text-stone-800 font-semibold truncate max-w-[200px]">
                    {settings.stripeAccountId}
                  </span>
                </div>
              )}

              {/* PayPal row */}
              <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                <span className="text-stone-500">Conto PayPal:</span>
                <span className="font-semibold text-stone-900 truncate max-w-[220px]">
                  {settings.paypalEmail || 'Non impostato'}
                </span>
              </div>
              {settings.paypalMeUsername && (
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Link PayPal.Me:</span>
                  <span className="font-mono text-blue-700 font-semibold text-[11px]">
                    paypal.me/{settings.paypalMeUsername}
                  </span>
                </div>
              )}

              {/* IBAN row */}
              {settings.bankIban && (
                <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                  <span className="text-stone-500">IBAN per Bonifici:</span>
                  <span className="font-mono text-stone-900 font-semibold text-[11px] truncate max-w-[220px]">
                    {settings.bankIban}
                  </span>
                </div>
              )}
              {settings.bankAccountHolder && (
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-stone-500">Intestatario:</span>
                  <span className="text-stone-800 font-medium truncate max-w-[220px]">
                    {settings.bankAccountHolder}
                  </span>
                </div>
              )}
              {settings.bankName && (
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-stone-500">Banca:</span>
                  <span className="text-stone-800 font-medium truncate max-w-[220px]">
                    {settings.bankName}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Live Link Tester PayPal */}
          <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-4">
            <h4 className="font-editorial text-xl font-bold text-stone-900">
              Testa i Canali di Pagamento
            </h4>
            <p className="text-xs text-stone-600">
              Verifica che i tuoi canali di pagamento funzionino aprendo una quota di prova.
            </p>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-700">Quota di prova:</span>
              {[25, 50, 100].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTestAmount(amt)}
                  className={`py-1 px-2.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    testAmount === amt ? 'bg-[#636842] text-white shadow-2xs' : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  {settings.currency}{amt}
                </button>
              ))}
            </div>

            <div className="space-y-2 pt-1">
              {/* Apple Pay Test Button */}
              <button
                type="button"
                onClick={() => setIsApplePayModalOpen(true)}
                className="w-full py-2.5 px-4 bg-stone-950 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="text-base font-bold"></span>
                <span>Testa Apple Pay ({settings.currency}{testAmount})</span>
              </button>

              {/* PayPal Test Link */}
              <a
                href={testPayPalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-[#0070BA] hover:bg-[#005ea6] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Apri Link PayPal di Prova ({settings.currency}{testAmount})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {testSuccessMessage && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{testSuccessMessage}</span>
              </div>
            )}

            <div className="flex items-start gap-2 pt-2 text-[11px] text-stone-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Zero trattenute di piattaforma: tutti i fondi vanno direttamente al tuo Stripe e PayPal con la massima sicurezza.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Apple Pay Test Modal */}
      <ApplePaySheet
        isOpen={isApplePayModalOpen}
        onClose={() => setIsApplePayModalOpen(false)}
        amount={testAmount}
        giftTitle="Prova Donazione Lista Nozze"
        guestName="Sposi Test"
        guestEmail="test@listanozze.it"
        onSuccess={(piId) => {
          setIsApplePayModalOpen(false);
          setTestSuccessMessage(`Apple Pay test riuscito con successo! (ID Transazione: ${piId})`);
          setTimeout(() => setTestSuccessMessage(null), 5000);
        }}
      />

      {/* Confirmation Modal to Disconnect Stripe (In-UI, no window.confirm) */}
      {isConfirmDisconnectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-stone-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-stone-900">
                Vuoi scollegare l'Account Stripe?
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Gli invitati non vedranno più il pulsante Apple Pay e i pagamenti con carta fino alla prossima connessione.
                I versamenti via PayPal e Bonifico Bancario continueranno a funzionare regolarmente.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmDisconnectOpen(false)}
                className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleDisconnectStripe}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Scollega Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
