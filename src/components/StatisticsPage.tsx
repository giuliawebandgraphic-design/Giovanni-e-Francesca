import React from 'react';
import { useRegistry } from '../context/RegistryContext';
import {
  BarChart3,
  TrendingUp,
  CreditCard,
  Users,
  Gift,
  Heart,
  PieChart,
  ArrowUpRight,
  ExternalLink,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const StatisticsPage: React.FC = () => {
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
  } = useRegistry();

  const percent = totalTarget > 0 ? Math.min(100, Math.round((totalRaised / totalTarget) * 100)) : 0;
  const donatingGuests = guests.filter((g) => g.totalDonated > 0);
  const averageDonation = donations.length > 0 ? Math.round(totalRaised / donations.length) : 0;
  const participationRate = guests.length > 0 ? Math.round((donatingGuests.length / guests.length) * 100) : 0;

  // Category breakdown
  const categoryStats = gifts.reduce(
    (acc, gift) => {
      acc[gift.category] = (acc[gift.category] || 0) + gift.raisedAmount;
      return acc;
    },
    {} as Record<string, number>
  );

  const categoryLabels: Record<string, string> = {
    honeymoon: 'Luna di Miele',
    home: 'Casa & Arredo',
    experience: 'Esperienze',
    tech: 'Tecnologia & Hobby',
    custom: 'Fondo Libero',
  };

  const paypalPercent = totalRaised > 0 ? Math.round((paypalTotal / totalRaised) * 100) : 0;
  const bankPercent = totalRaised > 0 ? Math.round((bankTotal / totalRaised) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#636842] font-semibold">
            Pannello Festeggiati
          </span>
          <h2 className="font-editorial text-3xl font-semibold text-stone-900">
            Statistiche & Analisi Lista Nozze
          </h2>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl">
            Panoramica completa sull'andamento delle quote, canali di pagamento, media per invitato e preferenze dei regali.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveView('organizer_paypal')}
            className="flex items-center gap-1.5 py-2 px-3.5 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <span>Riconciliazione PayPal</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-stone-500" />
          </button>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Totale Raccolto */}
        <div className="p-5 bg-gradient-to-br from-white to-[#FFE68A]/25 rounded-2xl border-2 border-[#FFE68A] shadow-xs space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-stone-600 font-bold">
            Totale Raccolto
          </span>
          <div className="font-editorial text-3xl font-bold text-stone-900 tabular-nums">
            {settings.currency}{totalRaised.toLocaleString()}
          </div>
          <div className="w-full h-2 bg-stone-200/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FFE68A] to-[#BCBF97] rounded-full"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
            <span>Obiettivo: {settings.currency}{totalTarget.toLocaleString()}</span>
            <span className="font-bold text-stone-900">{percent}% raggiunto</span>
          </div>
        </div>

        {/* KPI 2: Media per Donazione */}
        <div className="p-5 bg-gradient-to-br from-white to-[#A6C1D8]/25 rounded-2xl border-2 border-[#A6C1D8] shadow-xs space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-slate-700 font-bold">
            Media per Donazione
          </span>
          <div className="font-editorial text-3xl font-bold text-slate-900 tabular-nums">
            {settings.currency}{averageDonation.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-600">
            Calcolata su {donations.length} quote totali
          </p>
          <span className="text-[11px] text-slate-800 font-semibold block pt-1">
            Cifre interamente libere scelte dagli invitati
          </span>
        </div>

        {/* KPI 3: Partecipazione Invitati */}
        <div className="p-5 bg-gradient-to-br from-white to-[#BCBF97]/25 rounded-2xl border-2 border-[#BCBF97] shadow-xs space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-stone-700 font-bold">
            Tasso di Partecipazione
          </span>
          <div className="font-editorial text-3xl font-bold text-stone-900 tabular-nums">
            {participationRate}%
          </div>
          <p className="text-[11px] text-stone-600">
            {donatingGuests.length} di {guests.length} invitati hanno donato
          </p>
          <span className="text-[11px] text-[#484c2e] font-semibold block pt-1">
            {guests.length - donatingGuests.length} invitati in attesa
          </span>
        </div>

        {/* KPI 4: Donazioni PayPal Istantanee */}
        <div className="p-5 bg-gradient-to-br from-white to-[#A6C1D8]/30 rounded-2xl border-2 border-[#A6C1D8] shadow-xs space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-slate-700 font-bold">
            Quota Digitale PayPal
          </span>
          <div className="font-editorial text-3xl font-bold text-slate-900 tabular-nums">
            {paypalPercent}%
          </div>
          <p className="text-[11px] text-slate-600">
            {settings.currency}{paypalTotal.toLocaleString()} accreditati istantaneamente
          </p>
          <span className="text-[11px] text-slate-800 font-semibold block pt-1">
            Canale preferito dagli invitati
          </span>
        </div>
      </div>

      {/* Two-Column Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Canali di Pagamento & Categorie */}
        <div className="lg:col-span-6 space-y-6">
          {/* Canali di Pagamento */}
          <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-4">
            <h3 className="font-editorial text-xl font-bold text-stone-900 flex items-center justify-between">
              <span>Ripartizione Canali di Pagamento</span>
              <CreditCard className="w-5 h-5 text-stone-400" />
            </h3>

            {/* Split Visual Bar */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-stone-100 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-[#A6C1D8] transition-all"
                  style={{ width: `${paypalPercent}%` }}
                  title={`PayPal: ${paypalPercent}%`}
                />
                <div
                  className="h-full bg-[#BCBF97] transition-all"
                  style={{ width: `${bankPercent}%` }}
                  title={`Bonifico: ${bankPercent}%`}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#A6C1D8]"></span>
                  <span className="font-semibold text-stone-800">PayPal Diretto ({paypalPercent}%)</span>
                  <span className="text-stone-400">·</span>
                  <span className="font-mono text-stone-600">{settings.currency}{paypalTotal.toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#BCBF97]"></span>
                  <span className="font-semibold text-stone-800">Bonifico ({bankPercent}%)</span>
                  <span className="text-stone-400">·</span>
                  <span className="font-mono text-stone-600">{settings.currency}{bankTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#A6C1D8]/15 rounded-xl border border-[#A6C1D8]/50 text-xs text-slate-800 space-y-1">
              <strong>Nota sulla ricezione fondi:</strong>
              <p className="text-[11px] text-slate-700">
                Tutte le quote PayPal sono state inviate direttamente all'account <strong>{settings.paypalEmail}</strong> senza trattenute intermedie.
              </p>
            </div>
          </div>

          {/* Ripartizione per Categoria */}
          <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-4">
            <h3 className="font-editorial text-xl font-bold text-stone-900 flex items-center justify-between">
              <span>Raccolta per Categoria</span>
              <PieChart className="w-5 h-5 text-stone-400" />
            </h3>

            <div className="space-y-3">
              {Object.entries(categoryStats).map(([catKey, amount]) => {
                const catPercent = totalRaised > 0 ? Math.round((amount / totalRaised) * 100) : 0;
                return (
                  <div key={catKey} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-stone-800">
                        {categoryLabels[catKey] || catKey}
                      </span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-stone-900">{settings.currency}{amount.toLocaleString()}</span>
                        <span className="text-stone-400 text-[11px]">({catPercent}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-stone-800 rounded-full"
                        style={{ width: `${catPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Top Desires & Recent Quotes */}
        <div className="lg:col-span-6 space-y-6">
          {/* Top Regali Più Sostenuti */}
          <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-4">
            <h3 className="font-editorial text-xl font-bold text-stone-900 flex items-center justify-between">
              <span>I Desideri Più Amati</span>
              <Gift className="w-5 h-5 text-stone-400" />
            </h3>

            <div className="space-y-3">
              {[...gifts]
                .sort((a, b) => b.raisedAmount - a.raisedAmount)
                .slice(0, 4)
                .map((gift) => {
                  const giftPercent = gift.isInfiniteQuota
                    ? 100
                    : Math.min(100, Math.round((gift.raisedAmount / gift.targetAmount) * 100));

                  return (
                    <div
                      key={gift.id}
                      className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center gap-3"
                    >
                      <img
                        src={gift.imageUrl}
                        alt={gift.title}
                        className="w-12 h-12 rounded-lg object-cover border border-stone-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-stone-900 truncate">
                            {gift.title}
                          </h4>
                          <span className="text-xs font-bold text-stone-900 font-mono">
                            {settings.currency}{gift.raisedAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-stone-500 mt-0.5">
                          <span>{gift.contributionsCount} {gift.contributionsCount === 1 ? 'donatore' : 'donatori'}</span>
                          <span>{!gift.isInfiniteQuota && `${giftPercent}% obiettivo`}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="p-6 bg-gradient-to-br from-[#FFE68A]/20 via-white to-[#BCBF97]/25 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
            <h4 className="font-editorial text-xl font-bold text-stone-900">
              Prossimi Passi per Giovanni & Francesca
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setActiveView('organizer_thanks')}
                className="p-3 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-left shadow-2xs cursor-pointer"
              >
                <strong className="block text-stone-900 mb-0.5">💌 Gestisci Ringraziamenti</strong>
                <span className="text-stone-500 text-[11px]">Invia un messaggio di affetto ai donatori</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('organizer_embed')}
                className="p-3 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-left shadow-2xs cursor-pointer"
              >
                <strong className="block text-stone-900 mb-0.5">💻 Codice per il Sito</strong>
                <span className="text-stone-500 text-[11px]">Copia iframe e link per gli invitati</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
