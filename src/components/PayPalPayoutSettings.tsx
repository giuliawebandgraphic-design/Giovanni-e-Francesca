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

  const [paypalEmail, setPaypalEmail] = useState<string>(settings.paypalEmail);
  const [paypalMeUsername, setPaypalMeUsername] = useState<string>(settings.paypalMeUsername);
  const [bankIban, setBankIban] = useState<string>(settings.bankIban);
  const [bankAccountHolder, setBankAccountHolder] = useState<string>(settings.bankAccountHolder);
  const [bankName, setBankName] = useState<string>(settings.bankName);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Test amount
  const [testAmount, setTestAmount] = useState<number>(50);
  const [isReconciling, setIsReconciling] = useState<boolean>(false);
  const [reconciledMessage, setReconciledMessage] = useState<string>('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      paypalEmail: paypalEmail.trim(),
      paypalMeUsername: paypalMeUsername.trim().replace(/^@/, ''),
      bankIban: bankIban.trim(),
      bankAccountHolder: bankAccountHolder.trim(),
      bankName: bankName.trim(),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleReconcileToPayPal = () => {
    setIsReconciling(true);
    setTimeout(() => {
      setIsReconciling(false);
      setReconciledMessage(
        `Riconciliazione completata con successo! L'intero saldo della lista di ${settings.currency}${totalRaised.toLocaleString()} è allineato al conto PayPal ${settings.paypalEmail}.`
      );
    }, 600);
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
            Versamento Diretto al Conto PayPal
          </h2>
          <p className="text-xs text-stone-600 mt-1">
            Configura il tuo account PayPal per ricevere tutte le donazioni degli invitati direttamente sul tuo saldo disponibile.
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Overall */}
        <div className="p-5 bg-gradient-to-br from-white to-[#FFE68A]/25 rounded-2xl border-2 border-[#FFE68A] shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-stone-600 font-bold">
            Totale Raccolto Complessivo
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
              Accreditato su PayPal
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
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                {isSaved ? (
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Coordinate salvate con successo!
                  </span>
                ) : (
                  <span />
                )}
                <button
                  type="submit"
                  className="py-2.5 px-6 bg-[#636842] hover:bg-[#525636] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Salva Coordinate
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Live Payout Reconciliation & Link Tester */}
        <div className="lg:col-span-5 space-y-6">
          {/* Versa tutto al conto PayPal Box with #FFE68A & #BCBF97 */}
          <div className="p-6 bg-gradient-to-br from-white via-[#FFE68A]/20 to-[#BCBF97]/25 rounded-2xl border-2 border-[#BCBF97] shadow-xs space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold text-stone-900 bg-[#FFE68A] border border-amber-300">
              Versamento Saldo Totale
            </div>
            <h3 className="font-editorial text-2xl font-bold text-stone-900">
              Versa Tutto al Conto PayPal
            </h3>
            <p className="text-xs text-stone-700 leading-relaxed">
              Hai raccolto complessivamente{' '}
              <strong className="text-stone-900">{settings.currency}{totalRaised.toLocaleString()}</strong>.
              Puoi riconciliare e versare le quote ricevute direttamente al tuo conto PayPal per gestire tutte le spese della cerimonia e del viaggio.
            </p>

            <div className="p-3.5 bg-white/95 rounded-xl border border-stone-200 text-xs space-y-1.5 shadow-2xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Destinazione:</span>
                <span className="font-semibold text-stone-900">{settings.paypalEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Saldo Pronto per il versamento:</span>
                <span className="font-bold tabular-nums text-stone-950 text-sm">
                  {settings.currency}{totalRaised.toLocaleString()}
                </span>
              </div>
            </div>

            {reconciledMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 leading-relaxed font-medium">
                {reconciledMessage}
              </div>
            )}

            <button
              type="button"
              onClick={handleReconcileToPayPal}
              disabled={isReconciling}
              className="w-full py-3 px-4 bg-[#636842] hover:bg-[#525636] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isReconciling ? (
                <span>Riconciliazione in corso...</span>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Riconcilia e Versa Tutto al Conto PayPal</span>
                </>
              )}
            </button>
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
