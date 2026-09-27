import React, { useState, useRef } from 'react';
import { useRegistry } from '../context/RegistryContext';
import {
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Eye,
  Sparkles,
  Info,
} from 'lucide-react';

const PRESET_IMAGES = [
  {
    id: 'preset-1',
    title: 'Villa & Colline Eleganti',
    category: 'Location',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'preset-2',
    title: 'Sposi al Tramonto (Golden Hour)',
    category: 'Coppia',
    url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'preset-3',
    title: 'Bouquet & Fiori Fine Art',
    category: 'Dettagli',
    url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'preset-4',
    title: 'Costa & Panorama Romantico',
    category: 'Mare',
    url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'preset-5',
    title: 'Laguna Overwater Polinesia',
    category: 'Honeymoon',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'preset-6',
    title: 'Tavola & Ricevimento Festivo',
    category: 'Ricevimento',
    url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1600&q=80',
  },
];

export const HomeImageManager: React.FC = () => {
  const { settings, updateSettings, setActiveView } = useRegistry();
  const [customUrl, setCustomUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    try {
      new URL(customUrl.trim());
      updateSettings({ heroImage: customUrl.trim() });
      setCustomUrl('');
      setUrlError('');
      triggerSuccess();
    } catch {
      setUrlError('Inserisci un URL valido (es. https://...)');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUrlError('Seleziona un file immagine valido (JPG, PNG, WebP).');
      return;
    }

    // Limit client base64 to ~5MB
    if (file.size > 6 * 1024 * 1024) {
      setUrlError("L'immagine è troppo grande (massimo 6MB). Riduci le dimensioni.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        updateSettings({ heroImage: dataUrl });
        setUrlError('');
        triggerSuccess();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (url: string) => {
    updateSettings({ heroImage: url });
    triggerSuccess();
  };

  const handleResetDefault = () => {
    updateSettings({
      heroImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80',
    });
    triggerSuccess();
  };

  const triggerSuccess = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#636842] font-semibold block mb-1">
            Personalizzazione Grafica
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Gestisci Immagine della Home
          </h2>
          <p className="text-xs text-stone-600 mt-1 max-w-xl">
            Scegli o carica la foto principale mostrata in cima alla lista nozze per i tuoi invitati.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold animate-in fade-in">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Immagine aggiornata!</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => setActiveView('guest_registry')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#636842] hover:bg-[#525636] text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Vedi nella Home</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Preview on Left, Controls on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Live Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Anteprima Attuale
              </span>
              <span className="text-[11px] font-semibold text-[#636842] bg-[#BCBF97]/25 px-2.5 py-0.5 rounded-full">
                Attiva
              </span>
            </div>

            <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-stone-200 bg-stone-100 shadow-inner group">
              <img
                src={settings.heroImage}
                alt="Copertina Home"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent flex items-end p-4">
                <div className="text-white text-left">
                  <div className="text-xs font-semibold tracking-wide">
                    {settings.coupleNames}
                  </div>
                  <div className="text-[11px] opacity-80">
                    19 Luglio 2026 · Villa Cordevigo
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 leading-relaxed">
              Questa foto viene mostrata in testata nella vista pubblica per tutti gli invitati che accedono alla lista regali.
            </p>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetDefault}
                className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 font-medium cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
                <span>Ripristina foto iniziale</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Upload & Selection Options (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Method 1: Local File Upload */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#636842]" />
              <h3 className="text-sm font-bold text-stone-900">
                1. Carica una foto dal tuo dispositivo
              </h3>
            </div>
            <p className="text-xs text-stone-600">
              Seleziona una foto ad alta risoluzione del vostro servizio fotografico prematrimoniale o della location.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-stone-300 hover:border-[#BCBF97] bg-stone-50 hover:bg-[#BCBF97]/10 rounded-xl p-8 text-center cursor-pointer transition-colors"
            >
              <div className="w-12 h-12 mx-auto rounded-full bg-white border border-stone-200 flex items-center justify-center text-[#636842] shadow-2xs mb-3">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-stone-900">
                Clicca per scegliere un'immagine dal computer o smartphone
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Supporta file JPG, PNG e WebP (fino a 6MB)
              </p>
            </div>
          </div>

          {/* Method 2: Link URL */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-[#636842]" />
              <h3 className="text-sm font-bold text-stone-900">
                2. Oppure incolla il link diretto di un'immagine online
              </h3>
            </div>

            <form onSubmit={handleApplyUrl} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => {
                    setCustomUrl(e.target.value);
                    setUrlError('');
                  }}
                  placeholder="https://example.com/foto-sposi.jpg"
                  className="flex-1 px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#BCBF97] focus:bg-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#636842] hover:bg-[#525636] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Applica Link
                </button>
              </div>
              {urlError && <p className="text-xs text-rose-600 font-medium">{urlError}</p>}
            </form>
          </div>

          {/* Method 3: Preset Library */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <h3 className="text-sm font-bold text-stone-900">
                  3. Oppure scegli uno sfondo elegante predefinito
                </h3>
              </div>
              <span className="text-[11px] text-stone-500">6 proposte curate</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PRESET_IMAGES.map((preset) => {
                const isSelected = settings.heroImage === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.url)}
                    className={`group relative rounded-xl overflow-hidden border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'ring-2 ring-[#636842] border-[#636842] shadow-sm'
                        : 'border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    <div className="aspect-4/3 bg-stone-100 overflow-hidden">
                      <img
                        src={preset.url}
                        alt={preset.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-[#636842] text-white rounded-full flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    <div className="p-2 bg-white">
                      <div className="text-[11px] font-bold text-stone-900 truncate">
                        {preset.title}
                      </div>
                      <div className="text-[10px] text-stone-500 uppercase tracking-wider">
                        {preset.category}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
