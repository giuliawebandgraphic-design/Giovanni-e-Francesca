import React, { useState } from 'react';
import { useRegistry } from '../context/RegistryContext';
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
} from 'lucide-react';

export const PayPalPayoutSettings: React.FC = () => {
  const {
    settings,
    updateSettings,
    paypalTotal,
    bankTotal,
    totalRaised,
    donations,
    getPayPalLink,
  } = useRegistry();

  const [paypalEmail, setPaypalEmail] = useState<string>(settings.paypalEmail || '');
  const [paypalMeUsername, setPaypalMeUsername] = useState<string>(settings.paypalMeUsername || '');
  const [bankIban, setBankIban] = useState<string>(settings.bankIban || '');
  const [bankAccountHolder, setBankAccountHolder] = useState<string>(settings.bankAccountHolder || '');
  const [bankName, setBankName] = useState<string>(settings.bankName || '');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Synchronize local state whenever remote settings arrive or update from Firestore
  React.useEffect(() => {
    setPaypalEmail(settings.paypalEmail || '');
    setPaypalMeUsername(settings.paypalMeUsername || '');
    setBankIban(settings.bankIban || '');
    setBankAccountHolder(settings.bankAccountHolder || '');
    setBankName(settings.bankName || '');
  }, [
    settings.paypalEmail,
    settings.paypalMeUsername,
    settings.bankIban,
    settings.bankAccountHolder,
    settings.bankName,
  ]);

  // Test amount
  const [testAmount, setTestAmount] = useState<number>(50);

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

      await updateSettings({
        paypalEmail: cleanPaypalEmail,
        paypalMeUsername: cleanPaypalMe,
        bankIban: cleanIban,
        bankAccountHolder: cleanHolder,
        bankName: cleanBank,
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
    const headers = ['ID Donazione', 'Data', 'Invitato', 'Email', 'Regalo', 'Importo (€)', 'Metodo', 'ID Transazione PayPal', 'Messaggio'];
    const rows = donations.map((d) => [
      d.id,
      new Date(d.createdAt).toLocaleDateString('it-IT'),
      `"${d.guestName.replace(/"/g, '""')}"`,
      d.guestEmail,
      `"${d.giftTitle.replace(/"/g, '""')}"`,
      d.amount,
      d.paymentMethod,
      d.paypalTransactionId || '',
      `"${(d.message || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lista_nozze_donazioni_paypal_${new Date().toISOString().slice(0, 10)}.csv`);
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
            Canali di Pagamento (PayPal & Bonifico)
          </h2>
          <p className="text-xs text-stone-600 mt-1">
            Configura il tuo conto PayPal e le coordinate bancarie per consentire agli invitati di donare con il metodo che preferiscono.
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Overall */}
        <div className="p-5 bg-gradient-to-br from-white to-[#FFE68A]/25 rounded-2xl border-2 border-[#FFE68A] shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-stone-600 font-bold">
            Totale Raccolto
          </span>
          <p className="font-editorial text-3xl font-bold text-stone-900 mt-1 tabular-nums">
            {settings.currency}{totalRaised.toLocaleString()}
          </p>
          <span className="text-[11px] text-stone-500">cifre libere versate</span>
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
        {/* Left: PayPal Configuration Form */}
        <div className="lg:col-span-7 space-y-6">
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

              {/* Bank Transfer fallback settings */}
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


              <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  {isSaved && (
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 animate-in fade-in duration-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Coordinate PayPal e IBAN salvate nel database Cloud!</span>
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

        {/* Right: Live Coordinates Recap & Link Tester */}
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

            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 text-xs space-y-2.5 shadow-2xs">
              <div className="flex justify-between items-center">
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

          {/* Live Link Tester */}
          <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-4">
            <h4 className="font-editorial text-xl font-bold text-stone-900">
              Testa il Link di Pagamento PayPal
            </h4>
            <p className="text-xs text-stone-600">
              Verifica che il tuo link PayPal.Me funzioni correttamente aprendo una prova con quota pre-impostata.
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

            <a
              href={testPayPalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-[#0070BA] hover:bg-[#005ea6] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>Apri Link PayPal di Prova ({settings.currency}{testAmount})</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div className="flex items-start gap-2 pt-2 text-[11px] text-stone-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Zero trattenute di piattaforma: i fondi vanno direttamente al tuo PayPal con la massima sicurezza.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
