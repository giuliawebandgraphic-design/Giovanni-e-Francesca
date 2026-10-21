import React, { useEffect, useState } from 'react';
import { ConnectExpressButton, type OnboardingResponse } from '@mdf/stripe-express-connect';
import { RegistrySettings } from '../types';
import { useRegistry } from '../context/RegistryContext';
import { AlertCircle, Building2, CheckCircle2, CreditCard, Download, ExternalLink, Landmark, Unlink } from 'lucide-react';

type StripeConnectionSettings = Pick<RegistrySettings,
  'stripeAccountId' | 'stripeAccountName' | 'stripeEmail' | 'stripeStatus' |
  'stripeEnabled' | 'applePayEnabled' | 'applePayThroughStripe'
>;

export const PayPalPayoutSettings: React.FC = () => {
  const { settings, updateSettings, stripeTotal, bankTotal, totalRaised, donations } = useRegistry();
  const [stripeEmail, setStripeEmail] = useState(settings.stripeEmail || '');
  const [bankIban, setBankIban] = useState(settings.bankIban || '');
  const [bankAccountHolder, setBankAccountHolder] = useState(settings.bankAccountHolder || '');
  const [bankName, setBankName] = useState(settings.bankName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serverStripeSettings, setServerStripeSettings] = useState<StripeConnectionSettings | null>(null);
  const [isStripeEmailDirty, setIsStripeEmailDirty] = useState(false);

  useEffect(() => {
    if (!isStripeEmailDirty) setStripeEmail(settings.stripeEmail || '');
    setBankIban(settings.bankIban || '');
    setBankAccountHolder(settings.bankAccountHolder || '');
    setBankName(settings.bankName || '');
  }, [settings.stripeEmail, settings.bankIban, settings.bankAccountHolder, settings.bankName, isStripeEmailDirty]);

  // The hosted Stripe return route writes to the server registry. The browser may
  // still contain the earlier "pending" snapshot, so reconcile it once whenever
  // this screen opens and keep the server answer visible while SQLite sync catches up.
  useEffect(() => {
    let cancelled = false;

    const reconcileStripeConnection = async () => {
      try {
        const response = await fetch('/api/stripe-connect/registry-status', { cache: 'no-store' });
        if (!response.ok) return;
        const remote = await response.json() as StripeConnectionSettings;
        if (cancelled || !remote.stripeAccountId) return;

        setServerStripeSettings(remote);
        await updateSettings(remote);

        const params = new URLSearchParams(window.location.search);
        if (params.has('stripe_connect')) {
          params.delete('stripe_connect');
          const query = params.toString();
          window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
        }
      } catch {
        // The dashboard remains usable with its cached settings if the server is unavailable.
      }
    };

    void reconcileStripeConnection();
    return () => { cancelled = true; };
    // This reconciliation is intentionally performed once on entering this view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onAccountCreated = async (result: OnboardingResponse) => {
    const email = stripeEmail.trim().toLowerCase();
    await updateSettings({ stripeAccountId: result.accountId, stripeEmail: email, stripeStatus: 'pending', stripeEnabled: false, applePayEnabled: false, applePayThroughStripe: false });
    setIsStripeEmailDirty(false);
  };

  const saveIban = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true); setError(null);
    try {
      await updateSettings({ bankIban: bankIban.trim().replace(/\s+/g, ' '), bankAccountHolder: bankAccountHolder.trim(), bankName: bankName.trim() });
      setNotice('Coordinate IBAN salvate.');
    } catch { setError('Non è stato possibile salvare le coordinate. Riprova.'); }
    finally { setIsSaving(false); }
  };

  const disconnectStripe = async () => {
    const disconnectedSettings: StripeConnectionSettings = {
      stripeEnabled: false,
      stripeStatus: 'disconnected',
      applePayEnabled: false,
      applePayThroughStripe: false,
    };
    setServerStripeSettings((current) => current ? { ...current, ...disconnectedSettings } : current);
    await updateSettings(disconnectedSettings);
    setNotice('Stripe è stato disattivato per questa lista. L’account resta nel Dashboard Stripe.');
  };

  const exportCsv = () => {
    const rows = [['Data', 'Invitato', 'Regalo', 'Importo', 'Canale', 'Stato'], ...donations.map((donation) => [new Date(donation.createdAt).toLocaleDateString('it-IT'), donation.guestName, donation.giftTitle, String(donation.amount), donation.paymentMethod === 'bank_transfer' ? 'Bonifico IBAN' : 'Stripe', donation.status])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'rendiconto-donazioni.csv'; link.click(); URL.revokeObjectURL(url);
  };

  const displayedStripeSettings = serverStripeSettings ? { ...settings, ...serverStripeSettings } : settings;
  const stripeConnected = displayedStripeSettings.stripeEnabled && displayedStripeSettings.stripeStatus === 'connected';
  return <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div><span className="text-xs uppercase tracking-wider text-[#636842] font-semibold">Incassi</span><h2 className="font-editorial text-3xl font-semibold text-stone-900">Pagamenti e coordinate bancarie</h2><p className="text-sm text-stone-600 mt-1">Accetta carte con Stripe oppure comunica il tuo IBAN per i bonifici diretti.</p></div>
      <button type="button" onClick={exportCsv} className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-semibold text-stone-800 hover:bg-stone-50"><Download className="w-4 h-4" /> Esporta rendiconto CSV</button>
    </header>

    {(notice || error) && <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}<span>{error || notice}</span></div>}

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Metric title="Totale raccolto" value={`${settings.currency}${totalRaised.toLocaleString()}`} className="border-2 border-stone-900" />
      <Metric title="Carte · Stripe" value={`${settings.currency}${stripeTotal.toLocaleString()}`} className="border-emerald-200 bg-emerald-50/40" />
      <Metric title="Bonifici · IBAN" value={`${settings.currency}${bankTotal.toLocaleString()}`} className="border-[#BCBF97] bg-[#BCBF97]/15" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <article className="rounded-2xl border-2 border-stone-900 bg-white p-6 space-y-5">
        <div className="flex items-start gap-3"><IconBox><CreditCard className="w-5 h-5" /></IconBox><div><h3 className="font-editorial text-xl font-bold text-stone-900">Pagamenti con carta</h3><p className="mt-1 text-sm text-stone-600">Stripe Checkout gestisce carte e metodi disponibili sul dispositivo, senza raccogliere dati di pagamento nel sito.</p></div></div>
        {stripeConnected ? <div className="space-y-4"><div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"><div className="flex items-center gap-2 font-bold"><CheckCircle2 className="w-4 h-4" /> Stripe è collegato e pronto a ricevere donazioni.</div><p className="mt-2 text-emerald-800">Account: {displayedStripeSettings.stripeEmail || displayedStripeSettings.stripeAccountId}</p></div><div className="flex flex-wrap gap-2"><a href="/api/stripe-connect/dashboard" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-bold text-white"><ExternalLink className="w-3.5 h-3.5" /> Dashboard Stripe</a><button type="button" onClick={disconnectStripe} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50"><Unlink className="w-3.5 h-3.5" /> Disattiva per la lista</button></div></div> : <div className="space-y-4 rounded-xl bg-stone-50 p-4"><label className="block text-xs font-bold text-stone-800">Email del titolare dell’account Stripe</label><input type="email" value={stripeEmail} onChange={(event) => { setStripeEmail(event.target.value); setIsStripeEmailDirty(true); }} placeholder="nome@example.com" className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900" /><ConnectExpressButton email={stripeEmail.trim() || undefined} country="IT" accountId={settings.stripeAccountId || undefined} disabled={!stripeEmail.trim()} onCreated={onAccountCreated} onError={(cause) => setError(cause.message)} className="flex w-full items-center justify-center rounded-xl bg-stone-900 px-4 py-3 text-sm font-bold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50">Collegati con Stripe per ricevere le donazioni</ConnectExpressButton><p className="text-xs leading-relaxed text-stone-500">L’email viene salvata e, se necessario, aggiornata su Stripe quando avvii il collegamento.</p></div>}
      </article>

      <article className="rounded-2xl border border-stone-200 bg-white p-6 space-y-5">
        <div className="flex items-start gap-3"><IconBox><Landmark className="w-5 h-5" /></IconBox><div><h3 className="font-editorial text-xl font-bold text-stone-900">Pagamenti con IBAN</h3><p className="mt-1 text-sm text-stone-600">Mostra agli invitati le coordinate per effettuare un bonifico manuale.</p></div></div>
        <form onSubmit={saveIban} className="space-y-4"><Field label="IBAN" value={bankIban} onChange={setBankIban} placeholder="IT00 X0000 0000 0000 0000 0000 000" required /><Field label="Intestatario" value={bankAccountHolder} onChange={setBankAccountHolder} placeholder="Nome e cognome" required /><Field label="Banca (facoltativo)" value={bankName} onChange={setBankName} placeholder="Nome della banca" /><button disabled={isSaving} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#636842] px-4 py-3 text-sm font-bold text-white hover:bg-[#525636] disabled:opacity-50"><Building2 className="w-4 h-4" /> {isSaving ? 'Salvataggio…' : 'Salva coordinate IBAN'}</button></form>
      </article>
    </div>
  </section>;
};

const Metric: React.FC<{ title: string; value: string; className: string }> = ({ title, value, className }) => <div className={`rounded-2xl bg-white p-5 ${className}`}><span className="text-xs font-bold uppercase tracking-wider text-stone-700">{title}</span><p className="mt-1 font-editorial text-3xl font-bold text-stone-900">{value}</p></div>;
const IconBox: React.FC<React.PropsWithChildren> = ({ children }) => <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#BCBF97]/30 text-[#4f5333]">{children}</div>;
const Field: React.FC<{ label: string; value: string; onChange: (value: string) => void; placeholder: string; required?: boolean }> = ({ label, value, onChange, placeholder, required }) => <div><label className="mb-1 block text-xs font-bold text-stone-800">{label}</label><input required={required} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm text-stone-900" /></div>;
