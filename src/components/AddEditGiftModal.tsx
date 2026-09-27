import React, { useState, useRef } from 'react';
import { GiftItem, GiftCategory } from '../types';
import { useRegistry } from '../context/RegistryContext';
import {
  X,
  Sparkles,
  Upload,
  Star,
  Eye,
  Check,
} from 'lucide-react';

interface AddEditGiftModalProps {
  giftToEdit?: GiftItem | null;
  onClose: () => void;
}

const PRESET_IMAGES = [
  { label: 'Luna di Miele Laguna', url: '/src/assets/images/gift_honeymoon_maldives_1790441984956.jpg' },
  { label: 'Caffè & Cucina', url: '/src/assets/images/gift_espresso_machine_1790441996961.jpg' },
  { label: 'Cena a lume di candela', url: '/src/assets/images/gift_romantic_dinner_1790442008939.jpg' },
  { label: 'Ricevimento & Tavola', url: '/src/assets/images/hero_wedding_registry_1790441971307.jpg' },
];

export const AddEditGiftModal: React.FC<AddEditGiftModalProps> = ({
  giftToEdit,
  onClose,
}) => {
  const { addGift, updateGift, settings } = useRegistry();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState<string>(giftToEdit?.title || '');
  const [subtitle, setSubtitle] = useState<string>(giftToEdit?.subtitle || '');
  const [category, setCategory] = useState<GiftCategory>(giftToEdit?.category || 'honeymoon');
  const [description, setDescription] = useState<string>(giftToEdit?.description || '');
  const [imageUrl, setImageUrl] = useState<string>(giftToEdit?.imageUrl || PRESET_IMAGES[0].url);
  const [targetAmount, setTargetAmount] = useState<string>(giftToEdit?.targetAmount ? String(giftToEdit.targetAmount) : '500');
  const [isInfiniteQuota, setIsInfiniteQuota] = useState<boolean>(giftToEdit?.isInfiniteQuota || false);
  const [isPriority, setIsPriority] = useState<boolean>(giftToEdit?.isPriority || false);
  const [imageTab, setImageTab] = useState<'upload' | 'preset' | 'url'>('upload');
  const [uploadError, setUploadError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Seleziona un file immagine valido (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError("L'immagine è troppo pesante (massimo 8MB).");
      return;
    }

    setUploadError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setImageUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const numericTarget = isInfiniteQuota ? 0 : parseFloat(targetAmount) || 500;

    if (giftToEdit) {
      updateGift(giftToEdit.id, {
        title: title.trim(),
        subtitle: subtitle.trim(),
        category,
        description: description.trim(),
        imageUrl: imageUrl.trim() || PRESET_IMAGES[0].url,
        targetAmount: numericTarget,
        isInfiniteQuota,
        isPriority,
      });
    } else {
      addGift({
        title: title.trim(),
        subtitle: subtitle.trim(),
        category,
        description: description.trim(),
        imageUrl: imageUrl.trim() || PRESET_IMAGES[0].url,
        targetAmount: numericTarget,
        isInfiniteQuota,
        status: 'available',
        isPriority,
      });
    }

    onClose();
  };

  const categoryLabels: Record<GiftCategory, string> = {
    honeymoon: 'Luna di Miele',
    home: 'Casa & Arredo',
    experience: 'Esperienze',
    tech: 'Tecnologia & Hobby',
    custom: 'Fondo Libero',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl lg:max-w-5xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-50 border-b border-stone-200 shrink-0">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#636842] font-bold block">
              Lista Nozze Sposi
            </span>
            <h3 className="font-editorial text-xl sm:text-2xl font-semibold text-stone-900">
              {giftToEdit ? 'Modifica Desiderio' : 'Aggiungi Nuovo Desiderio'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-xl transition-colors cursor-pointer"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Horizontal Two Column Layout */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* LEFT COLUMN: Image & Visual Card Preview (5 cols) */}
            <div className="md:col-span-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-stone-900">
                    Foto di Copertina
                  </label>
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setImageTab('upload')}
                      className={`px-2 py-0.5 rounded-lg font-semibold cursor-pointer transition-colors ${
                        imageTab === 'upload' ? 'bg-[#636842] text-white shadow-2xs' : 'text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      Da Locale
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageTab('preset')}
                      className={`px-2 py-0.5 rounded-lg font-semibold cursor-pointer transition-colors ${
                        imageTab === 'preset' ? 'bg-[#636842] text-white shadow-2xs' : 'text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      Predefinite
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageTab('url')}
                      className={`px-2 py-0.5 rounded-lg font-semibold cursor-pointer transition-colors ${
                        imageTab === 'url' ? 'bg-[#636842] text-white shadow-2xs' : 'text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      Link Web
                    </button>
                  </div>
                </div>

                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />

                {/* TAB 1: Local Upload */}
                {imageTab === 'upload' && (
                  <div className="space-y-2">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-stone-300 hover:border-[#636842] bg-stone-50 hover:bg-[#BCBF97]/15 rounded-xl p-4 text-center cursor-pointer transition-colors"
                    >
                      <div className="w-9 h-9 mx-auto rounded-full bg-white border border-stone-200 flex items-center justify-center text-[#636842] shadow-2xs mb-1.5">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-stone-900 block">
                        Carica foto dal computer o smartphone
                      </span>
                      <span className="text-[11px] text-stone-500 block mt-0.5">
                        JPG, PNG, WebP (fino a 8MB)
                      </span>
                    </div>

                    {uploadError && (
                      <p className="text-xs text-rose-600 font-medium">{uploadError}</p>
                    )}
                  </div>
                )}

                {/* TAB 2: Presets */}
                {imageTab === 'preset' && (
                  <div className="grid grid-cols-4 gap-1.5">
                    {PRESET_IMAGES.map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => setImageUrl(preset.url)}
                        className={`aspect-4/3 rounded-lg overflow-hidden border-2 transition-all cursor-pointer relative ${
                          imageUrl === preset.url ? 'border-[#636842] ring-2 ring-[#BCBF97]/50' : 'border-transparent opacity-75 hover:opacity-100'
                        }`}
                        title={preset.label}
                      >
                        <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                        {imageUrl === preset.url && (
                          <div className="absolute top-1 right-1 w-4 h-4 bg-[#636842] text-white rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* TAB 3: URL */}
                {imageTab === 'url' && (
                  <input
                    type="url"
                    placeholder="https://example.com/foto.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-[#BCBF97]"
                  />
                )}
              </div>

              {/* Card Live Preview */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-stone-500 font-semibold px-1">
                  <span className="flex items-center gap-1 text-[#636842]">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Anteprima Card per gli Invitati</span>
                  </span>
                  <span>{categoryLabels[category]}</span>
                </div>

                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
                  <div className="relative aspect-16/9 bg-stone-100 overflow-hidden">
                    <img
                      src={imageUrl || PRESET_IMAGES[0].url}
                      alt={title || 'Anteprima'}
                      className="w-full h-full object-cover"
                    />
                    {isPriority && (
                      <div className="absolute top-2 left-2 bg-[#FFE68A] text-stone-900 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-2xs">
                        <Star className="w-3 h-3 fill-current text-amber-600" />
                        <span>In Evidenza</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    <h4 className="font-editorial text-sm font-bold text-stone-900 line-clamp-1">
                      {title || 'Titolo del tuo Desiderio'}
                    </h4>
                    <p className="text-[11px] text-stone-500 line-clamp-1">
                      {subtitle || 'Sottotitolo descrittivo...'}
                    </p>
                    <div className="pt-2 flex items-center justify-between text-[11px] border-t border-stone-100">
                      <span className="text-stone-500">Obiettivo:</span>
                      <strong className="text-stone-900">
                        {isInfiniteQuota ? 'Quota libera' : `${settings.currency}${parseFloat(targetAmount) || 0}`}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Priority Checkbox */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 cursor-pointer transition-colors shadow-2xs">
                <input
                  type="checkbox"
                  checked={isPriority}
                  onChange={(e) => setIsPriority(e.target.checked)}
                  className="rounded text-[#636842] focus:ring-[#BCBF97] w-4 h-4 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-stone-900 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>Desiderio Speciale in Evidenza</span>
                  </span>
                  <p className="text-[11px] text-stone-500">Mostrato tra i primi con badge dorato</p>
                </div>
              </label>
            </div>

            {/* RIGHT COLUMN: Form Fields (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              {/* Titolo */}
              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1">
                  Titolo del Regalo o Esperienza *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. Notte sull'Oceano a Bora Bora"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#BCBF97] focus:bg-white font-medium"
                />
              </div>

              {/* Sottotitolo */}
              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1">
                  Sottotitolo Breve
                </label>
                <input
                  type="text"
                  placeholder="Es. Un sogno tra acque turchesi e coralli"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#BCBF97] focus:bg-white"
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1">
                  Categoria del Regalo
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as GiftCategory)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#BCBF97] focus:bg-white font-medium cursor-pointer"
                >
                  <option value="honeymoon">Luna di Miele</option>
                  <option value="home">Casa & Arredo</option>
                  <option value="experience">Esperienze</option>
                  <option value="tech">Tecnologia & Hobby</option>
                  <option value="custom">Fondo Libero</option>
                </select>
              </div>

              {/* Obiettivo del Desiderio: Scelta tra Traguardo Fisso o Quota Libera */}
              <div className="p-4 bg-stone-50/80 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-900">
                    Tipo di Quota & Obiettivo
                  </label>
                  <span className="text-[11px] text-stone-500 font-medium">
                    {isInfiniteQuota ? 'Senza importo massimo' : `Traguardo: ${settings.currency}${parseFloat(targetAmount) || 0}`}
                  </span>
                </div>

                {/* Scelta Modalità: Quota Fissa vs Quota Libera */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsInfiniteQuota(false);
                      if (!targetAmount || targetAmount === '0') setTargetAmount('500');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      !isInfiniteQuota
                        ? 'bg-[#636842] text-white border-[#636842] shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span>Traguardo con Obiettivo</span>
                    <span className={`text-[10px] ${!isInfiniteQuota ? 'text-stone-200' : 'text-stone-400'}`}>
                      Es. 500€, 1.000€ a quote
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsInfiniteQuota(true)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      isInfiniteQuota
                        ? 'bg-[#636842] text-white border-[#636842] shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span>Salvadanaio Libero</span>
                    <span className={`text-[10px] ${isInfiniteQuota ? 'text-stone-200' : 'text-stone-400'}`}>
                      Senza tetto massimo
                    </span>
                  </button>
                </div>

                {/* Campo Obiettivo + Tagli Rapidi se non è quota libera */}
                {!isInfiniteQuota ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-stone-500">{settings.currency}</span>
                      <input
                        type="number"
                        min="1"
                        step="10"
                        placeholder="Inserisci l'obiettivo (es. 800)"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-stone-900 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#BCBF97]"
                      />
                    </div>

                    {/* Tagli Predefiniti Rapidi */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-stone-400 mr-1">Importi frequenti:</span>
                      {[150, 300, 500, 1000, 1500, 2500].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setIsInfiniteQuota(false);
                            setTargetAmount(String(preset));
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            targetAmount === String(preset)
                              ? 'bg-[#BCBF97] text-stone-900 font-bold'
                              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                          }`}
                        >
                          {settings.currency}{preset.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-stone-600 bg-white p-2.5 rounded-xl border border-stone-200">
                    Gli invitati potranno inserire liberamente qualsiasi cifra desiderano senza una percentuale di completamento.
                  </p>
                )}
              </div>

              {/* Descrizione o storia */}
              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1">
                  Descrizione o Storia del Regalo
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Racconta ai vostri invitati perché questo desiderio è così importante per voi..."
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#BCBF97] focus:bg-white leading-relaxed resize-none"
                />
              </div>

              {/* Trust pill */}
              <div className="p-3 bg-[#BCBF97]/15 border border-[#BCBF97]/40 rounded-xl flex items-center gap-2 text-xs text-[#484c2e]">
                <Sparkles className="w-4 h-4 text-[#636842] shrink-0" />
                <span>
                  Gli invitati potranno contribuire sia con <strong>PayPal istantaneo</strong> che tramite <strong>Bonifico Bancario</strong>.
                </span>
              </div>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-stone-500 hidden sm:inline">
              I versamenti andranno direttamente al vostro conto senza commissioni di piattaforma.
            </span>
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl border border-stone-300 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="py-2.5 px-6 bg-[#636842] hover:bg-[#525636] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                <span>{giftToEdit ? 'Salva Modifiche' : 'Crea Desiderio'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
