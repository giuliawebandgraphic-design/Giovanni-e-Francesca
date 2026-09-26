import React, { useState } from 'react';
import { GiftItem, GiftCategory } from '../types';
import { useRegistry } from '../context/RegistryContext';
import { X, Image, Sparkles } from 'lucide-react';

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

  const [title, setTitle] = useState<string>(giftToEdit?.title || '');
  const [subtitle, setSubtitle] = useState<string>(giftToEdit?.subtitle || '');
  const [category, setCategory] = useState<GiftCategory>(giftToEdit?.category || 'honeymoon');
  const [description, setDescription] = useState<string>(giftToEdit?.description || '');
  const [imageUrl, setImageUrl] = useState<string>(giftToEdit?.imageUrl || PRESET_IMAGES[0].url);
  const [targetAmount, setTargetAmount] = useState<string>(giftToEdit?.targetAmount ? String(giftToEdit.targetAmount) : '500');
  const [isInfiniteQuota, setIsInfiniteQuota] = useState<boolean>(giftToEdit?.isInfiniteQuota || false);
  const [isPriority, setIsPriority] = useState<boolean>(giftToEdit?.isPriority || false);

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
        imageUrl: imageUrl.trim(),
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
        imageUrl: imageUrl.trim(),
        targetAmount: numericTarget,
        isInfiniteQuota,
        status: 'available',
        isPriority,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 bg-stone-50 border-b border-stone-200">
          <h3 className="font-editorial text-xl font-semibold text-stone-900">
            {giftToEdit ? 'Modifica Desiderio' : 'Aggiungi Nuovo Desiderio'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1">
              Titolo del regalo o esperienza *
            </label>
            <input
              type="text"
              required
              placeholder="Es. Notte stellata nel deserto"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-900 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1">
              Sottotitolo breve
            </label>
            <input
              type="text"
              placeholder="Es. Un sogno tra le dune"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as GiftCategory)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
              >
                <option value="honeymoon">Luna di Miele</option>
                <option value="home">Casa & Arredo</option>
                <option value="experience">Esperienze</option>
                <option value="tech">Tecnologia & Hobby</option>
                <option value="custom">Fondo Libero</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Obiettivo Totale ({settings.currency})
              </label>
              <input
                type="number"
                min="0"
                step="50"
                disabled={isInfiniteQuota}
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-900 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="infiniteQuota"
              checked={isInfiniteQuota}
              onChange={(e) => setIsInfiniteQuota(e.target.checked)}
              className="rounded text-[#636842] focus:ring-[#BCBF97]"
            />
            <label htmlFor="infiniteQuota" className="text-xs text-stone-700 cursor-pointer">
              Fondo a quota libera senza tetto massimo (es. Salvadanaio o Contributo Aperto)
            </label>
          </div>

          <div className="p-3 bg-[#BCBF97]/15 border border-[#BCBF97]/60 rounded-xl text-xs text-[#484c2e] space-y-1">
            <span className="font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#636842]" />
              Quota 100% libera per gli invitati
            </span>
            <p className="text-[11px] text-stone-600">
              Per questo prodotto ogni invitato potrà digitare liberamente l'importo da donare senza quote obbligatorie o preimpostate.
            </p>
          </div>

          {/* Preset image selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1.5">
              Fotografia di copertina
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {PRESET_IMAGES.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() => setImageUrl(preset.url)}
                  className={`aspect-4/3 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    imageUrl === preset.url ? 'border-[#636842] ring-2 ring-[#BCBF97]/50' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="O inserisci un percorso immagine..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-[11px] focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1">
              Descrizione o storia del regalo
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Racconta agli invitati perché questo regalo è speciale per voi..."
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isPriority"
              checked={isPriority}
              onChange={(e) => setIsPriority(e.target.checked)}
              className="rounded text-[#636842] focus:ring-[#BCBF97]"
            />
            <label htmlFor="isPriority" className="text-xs text-stone-700 cursor-pointer">
              Contrassegna come "Desiderio Speciale" (in evidenza)
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="py-2 px-5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {giftToEdit ? 'Salva Modifiche' : 'Crea Desiderio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
