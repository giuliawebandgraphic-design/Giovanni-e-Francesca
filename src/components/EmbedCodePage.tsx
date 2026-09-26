import React, { useState } from 'react';
import { useRegistry } from '../context/RegistryContext';
import {
  Code2,
  Copy,
  Check,
  ExternalLink,
  Laptop,
  Smartphone,
  Eye,
  Sparkles,
  Layers,
  HelpCircle,
  Share2,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

export const EmbedCodePage: React.FC = () => {
  const { settings, totalRaised, gifts, setActiveView } = useRegistry();

  const [embedType, setEmbedType] = useState<'iframe' | 'button' | 'card' | 'link'>('iframe');
  const [iframeHeight, setIframeHeight] = useState<number>(800);
  const [accentColor, setAccentColor] = useState<'sage' | 'gold' | 'blue'>('sage');
  const [showCoverInEmbed, setShowCoverInEmbed] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Base app URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://lista-nozze.giovanniefrancesca.it';

  // Construct iframe embed code
  const iframeCode = `<!-- Inizio Widget Lista Nozze Giovanni & Francesca -->
<div style="width: 100%; max-width: 1200px; margin: 0 auto; overflow: hidden; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);">
  <iframe
    src="${baseUrl}/?embed=true&theme=${accentColor}&cover=${showCoverInEmbed}"
    width="100%"
    height="${iframeHeight}px"
    style="border: 0; width: 100%; min-height: ${iframeHeight}px; display: block;"
    title="Lista Nozze ${settings.coupleNames}"
    loading="lazy"
    allow="payment"
  ></iframe>
</div>
<!-- Fine Widget Lista Nozze Giovanni & Francesca -->`;

  // Construct styled button code
  const buttonHex = accentColor === 'sage' ? '#BCBF97' : accentColor === 'gold' ? '#FFE68A' : '#A6C1D8';
  const buttonTextHex = accentColor === 'gold' ? '#1c1917' : '#1c1917';
  const buttonCode = `<!-- Pulsante Lista Nozze Giovanni & Francesca -->
<a
  href="${baseUrl}"
  target="_blank"
  rel="noopener noreferrer"
  style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 28px; background-color: ${buttonHex}; color: ${buttonTextHex}; font-family: 'Montserrat', system-ui, sans-serif; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); transition: all 0.2s ease;"
  onmouseover="this.style.opacity='0.9'"
  onmouseout="this.style.opacity='1'"
>
  <span>🎁 Partecipa alla Lista Nozze di ${settings.coupleNames}</span>
</a>`;

  // Construct mini-card code
  const cardCode = `<!-- Card Lista Nozze Compatta -->
<div style="max-width: 380px; padding: 20px; background: #ffffff; border-radius: 16px; border: 1px solid #e7e5e4; font-family: 'Montserrat', system-ui, sans-serif; box-shadow: 0 4px 14px rgba(0,0,0,0.05); text-align: center;">
  <h3 style="font-family: 'Montserrat', sans-serif; font-size: 22px; font-weight: 700; margin: 0 0 6px; color: #1c1917;">${settings.coupleNames}</h3>
  <p style="font-size: 13px; color: #78716c; margin: 0 0 16px;">Il nostro Matrimonio · 19 Luglio 2026</p>
  <div style="background: #fafaf9; padding: 12px; border-radius: 10px; margin-bottom: 16px; font-size: 13px; color: #44403c;">
    <strong>${gifts.length} Desideri</strong> disponibili con quota libera PayPal o Bonifico.
  </div>
  <a href="${baseUrl}" target="_blank" style="display: block; padding: 12px; background: #1c1917; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 13px;">
    Apri la Lista Regali Online &rarr;
  </a>
</div>`;

  // Construct direct link
  const directLinkCode = `${baseUrl}`;

  const currentCode =
    embedType === 'iframe'
      ? iframeCode
      : embedType === 'button'
      ? buttonCode
      : embedType === 'card'
      ? cardCode
      : directLinkCode;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2200);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#636842] font-semibold">
            Integrazione Sito Nozze
          </span>
          <h2 className="font-editorial text-3xl font-semibold text-stone-900">
            Codice per il Tuo Sito Web
          </h2>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
            Copia e incolla questo codice per inserire la lista nozze di {settings.coupleNames} all'interno del vostro sito web (Matrimonio.com, WordPress, Webflow, Squarespace, Wix o sito personalizzato).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-2 py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {copiedCode ? (
              <>
                <Check className="w-4 h-4 text-[#BCBF97]" />
                <span>Copiato negli Appunti!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copia Codice per il Sito</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Format Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setEmbedType('iframe')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            embedType === 'iframe'
              ? 'border-stone-900 bg-white shadow-xs ring-1 ring-stone-900'
              : 'border-stone-200 bg-stone-50 hover:bg-white text-stone-600'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-8 h-8 rounded-lg bg-[#BCBF97]/30 text-stone-900 flex items-center justify-center">
              <Layers className="w-4 h-4 text-[#484c2e]" />
            </span>
            {embedType === 'iframe' && <CheckCircle2 className="w-4 h-4 text-stone-900" />}
          </div>
          <span className="text-sm font-semibold text-stone-900 block">Widget Iframe Completo</span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">
            Mostra tutta la lista interattiva direttamente nella pagina del sito
          </span>
        </button>

        <button
          type="button"
          onClick={() => setEmbedType('button')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            embedType === 'button'
              ? 'border-stone-900 bg-white shadow-xs ring-1 ring-stone-900'
              : 'border-stone-200 bg-stone-50 hover:bg-white text-stone-600'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-8 h-8 rounded-lg bg-[#FFE68A]/50 text-stone-900 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-900" />
            </span>
            {embedType === 'button' && <CheckCircle2 className="w-4 h-4 text-stone-900" />}
          </div>
          <span className="text-sm font-semibold text-stone-900 block">Pulsante Elegante</span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">
            Bottone con stile coordinato pronto da incollare nel menù o nei contenuti
          </span>
        </button>

        <button
          type="button"
          onClick={() => setEmbedType('card')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            embedType === 'card'
              ? 'border-stone-900 bg-white shadow-xs ring-1 ring-stone-900'
              : 'border-stone-200 bg-stone-50 hover:bg-white text-stone-600'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-8 h-8 rounded-lg bg-[#A6C1D8]/40 text-slate-900 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-slate-800" />
            </span>
            {embedType === 'card' && <CheckCircle2 className="w-4 h-4 text-stone-900" />}
          </div>
          <span className="text-sm font-semibold text-stone-900 block">Mini Card Riassunto</span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">
            Riquadro compatto con riepilogo e invito al dono
          </span>
        </button>

        <button
          type="button"
          onClick={() => setEmbedType('link')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            embedType === 'link'
              ? 'border-stone-900 bg-white shadow-xs ring-1 ring-stone-900'
              : 'border-stone-200 bg-stone-50 hover:bg-white text-stone-600'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-8 h-8 rounded-lg bg-stone-100 text-stone-900 flex items-center justify-center">
              <Share2 className="w-4 h-4 text-stone-700" />
            </span>
            {embedType === 'link' && <CheckCircle2 className="w-4 h-4 text-stone-900" />}
          </div>
          <span className="text-sm font-semibold text-stone-900 block">Link Diretto & QR</span>
          <span className="text-[11px] text-stone-500 mt-0.5 block">
            URL pulito per WhatsApp, partecipazioni cartacee o email
          </span>
        </button>
      </div>

      {/* Configuration & Code Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Code Snippet & Options */}
        <div className="lg:col-span-7 space-y-6">
          {/* Customization Options (for iframe / button) */}
          {embedType === 'iframe' && (
            <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-900">
                <Sliders className="w-4 h-4 text-[#636842]" />
                <span>Personalizza il Widget Iframe:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-stone-600 mb-1 font-medium">Altezza iframe:</label>
                  <select
                    value={iframeHeight}
                    onChange={(e) => setIframeHeight(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#BCBF97]"
                  >
                    <option value={650}>650px (Compatto)</option>
                    <option value={800}>800px (Consigliato)</option>
                    <option value={1000}>1000px (Ampio)</option>
                    <option value={1200}>1200px (Completo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-600 mb-1 font-medium">Tonalità di accento:</label>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setAccentColor('sage')}
                      className={`w-7 h-7 rounded-full bg-[#BCBF97] border-2 transition-transform cursor-pointer ${
                        accentColor === 'sage' ? 'border-stone-900 scale-110' : 'border-transparent'
                      }`}
                      title="Verde Salvia"
                    />
                    <button
                      type="button"
                      onClick={() => setAccentColor('gold')}
                      className={`w-7 h-7 rounded-full bg-[#FFE68A] border-2 transition-transform cursor-pointer ${
                        accentColor === 'gold' ? 'border-stone-900 scale-110' : 'border-transparent'
                      }`}
                      title="Oro Caldo"
                    />
                    <button
                      type="button"
                      onClick={() => setAccentColor('blue')}
                      className={`w-7 h-7 rounded-full bg-[#A6C1D8] border-2 transition-transform cursor-pointer ${
                        accentColor === 'blue' ? 'border-stone-900 scale-110' : 'border-transparent'
                      }`}
                      title="Azzurro"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-600 mb-1 font-medium">Copertina:</label>
                  <label className="flex items-center gap-2 pt-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showCoverInEmbed}
                      onChange={(e) => setShowCoverInEmbed(e.target.checked)}
                      className="rounded text-[#636842] focus:ring-[#BCBF97]"
                    />
                    <span className="text-stone-700">Mostra banner foto</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* The Code Display Box */}
          <div className="bg-stone-900 rounded-2xl overflow-hidden shadow-md border border-stone-800 text-stone-200">
            <div className="flex items-center justify-between px-4 py-3 bg-stone-950/80 border-b border-stone-800 text-xs">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#BCBF97]" />
                <span className="font-mono text-stone-300">
                  {embedType === 'link' ? 'URL Lista Nozze' : 'HTML Code'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 py-1 px-3 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#BCBF97]" />
                    <span>Copiato!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copia</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed text-stone-300 select-all">
              {currentCode}
            </pre>
          </div>

          {/* Quick instructions box for popular platforms */}
          <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
              <HelpCircle className="w-4 h-4 text-[#636842]" />
              <span>Come inserire il codice sul tuo sito:</span>
            </div>

            <div className="space-y-2 text-xs text-stone-600">
              <div className="p-2.5 bg-stone-50 rounded-xl">
                <strong className="text-stone-900 block mb-0.5">Matrimonio.com:</strong>
                Vai nel tuo pannello di Matrimonio.com &gt; "Sito di Nozze" &gt; aggiungi un blocco "HTML / Codice personalizzato" e incolla questo codice.
              </div>
              <div className="p-2.5 bg-stone-50 rounded-xl">
                <strong className="text-stone-900 block mb-0.5">WordPress & Elementor:</strong>
                Aggiungi il widget "HTML Personalizzato" in qualsiasi pagina o sezione e incolla il codice iframe.
              </div>
              <div className="p-2.5 bg-stone-50 rounded-xl">
                <strong className="text-stone-900 block mb-0.5">Wix / Webflow / Squarespace:</strong>
                Inserisci un elemento "Embed / Includi Codice" (HTML iframe) e imposta la larghezza al 100%.
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Interactive Simulation Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-[#636842]" />
              <span>Anteprima sul tuo Sito:</span>
            </span>

            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1 rounded cursor-pointer ${
                  previewDevice === 'desktop' ? 'bg-white shadow-2xs text-stone-900' : 'text-stone-500'
                }`}
                title="Vista Desktop"
              >
                <Laptop className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1 rounded cursor-pointer ${
                  previewDevice === 'mobile' ? 'bg-white shadow-2xs text-stone-900' : 'text-stone-500'
                }`}
                title="Vista Smartphone"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Browser Mockup Container */}
          <div
            className={`mx-auto bg-stone-100 rounded-2xl border border-stone-300 shadow-sm overflow-hidden transition-all duration-300 ${
              previewDevice === 'mobile' ? 'max-w-xs' : 'w-full'
            }`}
          >
            {/* Fake browser bar */}
            <div className="px-3 py-2 bg-stone-200 border-b border-stone-300 flex items-center gap-2 text-[11px] text-stone-500">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
              </div>
              <div className="flex-1 bg-white rounded px-2 py-0.5 text-center truncate text-[10px] text-stone-600 font-mono">
                ilnostromatrimonio.it/lista-nozze
              </div>
            </div>

            {/* Simulated website body with embed inside */}
            <div className="p-4 bg-white min-h-[440px] flex flex-col justify-between">
              {/* Simulated website header */}
              <div className="text-center py-4 border-b border-stone-100 mb-4">
                <span className="text-[10px] uppercase tracking-widest text-[#72774f] font-semibold">
                  Matrimonio di
                </span>
                <h4 className="text-base font-semibold text-stone-900">
                  {settings.coupleNames}
                </h4>
                <p className="text-[11px] text-stone-500">Villa Cordevigo · 19 Luglio 2026</p>
              </div>

              {/* Render simulated embed */}
              <div className="flex-1 flex flex-col items-center justify-center">
                {embedType === 'iframe' && (
                  <div className="w-full bg-[#FAF9F5] border border-stone-200 rounded-xl p-3 shadow-2xs text-center space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#BCBF97]/25 text-[#484c2e]">
                      <Sparkles className="w-3 h-3" />
                      <span>Widget Interattivo Lista Nozze</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-left">
                      {gifts.slice(0, 2).map((g) => (
                        <div key={g.id} className="bg-white p-2 rounded-lg border border-stone-200 text-[10px]">
                          <img src={g.imageUrl} alt={g.title} className="w-full h-12 object-cover rounded mb-1" />
                          <span className="font-bold line-clamp-1 text-stone-900">{g.title}</span>
                          <span className="text-stone-500 block">Quota libera · PayPal</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-stone-100 flex items-center justify-between text-[11px]">
                      <span className="text-stone-600">Totale Raccolto:</span>
                      <strong className="text-stone-900">{settings.currency}{totalRaised.toLocaleString()}</strong>
                    </div>
                  </div>
                )}

                {embedType === 'button' && (
                  <div className="py-8 text-center space-y-4">
                    <p className="text-xs text-stone-500 italic max-w-xs mx-auto">
                      "Per noi il regalo più grande è la vostra presenza. Chi desidera contribuire ai nostri progetti può farlo qui sotto:"
                    </p>
                    <a
                      href={baseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 py-3 px-5 rounded-xl font-semibold text-xs text-stone-900 shadow-sm transition-transform hover:scale-102"
                      style={{ backgroundColor: buttonHex }}
                    >
                      <span>🎁 Partecipa alla Lista Nozze di {settings.coupleNames}</span>
                    </a>
                  </div>
                )}

                {embedType === 'card' && (
                  <div className="w-full max-w-[280px] p-4 bg-white rounded-xl border border-stone-200 text-center shadow-2xs space-y-2">
                    <h5 className="font-editorial text-lg font-bold text-stone-900">{settings.coupleNames}</h5>
                    <p className="text-[11px] text-stone-500">19 Luglio 2026</p>
                    <div className="p-2 bg-stone-50 rounded text-[11px] text-stone-600">
                      <strong>{gifts.length} Desideri</strong> aperti con versamento diretto su PayPal.
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveView('guest_registry')}
                      className="w-full py-2 bg-stone-900 text-white rounded text-xs font-semibold"
                    >
                      Apri Lista Regali &rarr;
                    </button>
                  </div>
                )}

                {embedType === 'link' && (
                  <div className="w-full text-center space-y-3 py-6">
                    <span className="text-xs font-semibold text-stone-800 block">
                      Link diretto pronto da condividere:
                    </span>
                    <input
                      type="text"
                      readOnly
                      value={directLinkCode}
                      className="w-full text-xs font-mono bg-stone-50 border border-stone-300 rounded-lg p-2 text-center text-stone-700"
                    />
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="py-1.5 px-4 bg-stone-900 text-white rounded-lg text-xs font-medium"
                    >
                      {copiedCode ? 'Copiato!' : 'Copia Link'}
                    </button>
                  </div>
                )}
              </div>

              {/* Simulated website footer */}
              <div className="text-center pt-4 border-t border-stone-100 text-[10px] text-stone-400">
                &copy; 2026 {settings.coupleNames} · Tutti i diritti riservati
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
