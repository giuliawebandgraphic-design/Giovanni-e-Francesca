import React, { useState } from 'react';
import { useRegistry } from '../context/RegistryContext';
import { GiftItem, GiftCategory } from '../types';
import { AddEditGiftModal } from './AddEditGiftModal';
import { Plus, Edit2, Trash2, CheckCircle2, Star, Gift, Filter, ArrowUpRight } from 'lucide-react';

export const WishlistManager: React.FC = () => {
  const { gifts, settings, deleteGift, updateGift, setActiveView } = useRegistry();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [giftToEdit, setGiftToEdit] = useState<GiftItem | null>(null);

  const filteredGifts = gifts.filter(
    (g) => selectedCategory === 'all' || g.category === selectedCategory
  );

  const handleOpenAdd = () => {
    setGiftToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (gift: GiftItem) => {
    setGiftToEdit(gift);
    setModalOpen(true);
  };

  const handleTogglePriority = (gift: GiftItem) => {
    updateGift(gift.id, { isPriority: !gift.isPriority });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#636842] font-semibold">
            Pannello Festeggiati
          </span>
          <h2 className="font-editorial text-3xl font-semibold text-stone-900">
            Gestione Wishlist & Quote
          </h2>
          <p className="text-xs text-stone-600 mt-1">
            Configura i regali, imposta le quote desiderate e controlla in tempo reale lo stato di avanzamento.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 py-2 px-4 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Regalo</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['all', 'honeymoon', 'home', 'experience', 'custom'].map((catKey) => (
          <button
            key={catKey}
            type="button"
            onClick={() => setSelectedCategory(catKey)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer capitalize ${
              selectedCategory === catKey
                ? 'bg-stone-900 text-white'
                : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
            }`}
          >
            {catKey === 'all'
              ? 'Tutti i Prodotti'
              : catKey === 'honeymoon'
              ? 'Luna di Miele'
              : catKey === 'home'
              ? 'Casa & Arredo'
              : catKey === 'experience'
              ? 'Esperienze'
              : 'Fondo Libero'}
          </button>
        ))}
      </div>

      {/* Gifts Grid */}
      {gifts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-stone-300 p-8 space-y-4 max-w-lg mx-auto shadow-2xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#BCBF97]/20 text-[#636842] flex items-center justify-center">
            <Gift className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-stone-900">La lista dei desideri è pulita e pronta</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
              Non hai ancora inserito nessun regalo. Inizia ad aggiungere i singoli doni, le tappe del viaggio di nozze o quote libere per i vostri invitati.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenNew}
            className="inline-flex items-center gap-2 py-2.5 px-5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Aggiungi il Primo Regalo</span>
          </button>
        </div>
      ) : filteredGifts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-stone-200">
          <p className="text-stone-500 text-xs">Nessun regalo in questa categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGifts.map((gift) => {
          const isCompleted = gift.status === 'completed';
          const percent = gift.isInfiniteQuota
            ? 100
            : Math.min(100, Math.round((gift.raisedAmount / gift.targetAmount) * 100));

          return (
            <div
              key={gift.id}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Image and badges */}
                <div className="relative aspect-16/9 overflow-hidden bg-stone-100">
                  <img
                    src={gift.imageUrl}
                    alt={gift.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    {gift.isPriority && (
                      <span className="bg-[#636842] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                        Speciale
                      </span>
                    )}
                    {isCompleted && (
                      <span className="bg-emerald-800 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                        Completato
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-lg shadow-xs">
                    <button
                      type="button"
                      onClick={() => handleTogglePriority(gift)}
                      title={gift.isPriority ? 'Rimuovi evidenza' : 'Metti in evidenza'}
                      className={`p-1 rounded cursor-pointer ${
                        gift.isPriority ? 'text-[#636842]' : 'text-stone-400 hover:text-stone-700'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(gift)}
                      title="Modifica regalo"
                      className="p-1 text-stone-600 hover:text-stone-900 rounded cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Eliminare il regalo "${gift.title}"?`)) {
                          deleteGift(gift.id);
                        }
                      }}
                      title="Elimina regalo"
                      className="p-1 text-rose-600 hover:text-rose-800 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                      {gift.category}
                    </span>
                    <h4 className="font-editorial text-xl font-bold text-stone-900 leading-tight mt-0.5">
                      {gift.title}
                    </h4>
                    <p className="text-xs text-stone-500 line-clamp-1">{gift.subtitle}</p>
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {gift.description}
                  </p>
                </div>
              </div>

              {/* Progress & Quotas Footer */}
              <div className="p-5 pt-0 space-y-3">
                <div className="pt-3 border-t border-stone-100">
                  <div className="flex items-baseline justify-between text-xs mb-1.5">
                    <span className="text-stone-500">
                      Raccolto ({gift.contributionsCount} {gift.contributionsCount === 1 ? 'donatore' : 'donatori'}):
                    </span>
                    <span className="font-bold text-stone-900 tabular-nums">
                      {settings.currency}{gift.raisedAmount.toLocaleString()}
                      {!gift.isInfiniteQuota && (
                        <span className="text-stone-400 font-normal"> / {settings.currency}{gift.targetAmount}</span>
                      )}
                    </span>
                  </div>

                  {!gift.isInfiniteQuota && (
                    <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#BCBF97] rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                  <span className="text-[#636842] font-semibold">Quota 100% libera per l'invitato</span>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(gift)}
                    className="text-stone-800 font-semibold hover:underline cursor-pointer"
                  >
                    Modifica
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {modalOpen && (
        <AddEditGiftModal
          giftToEdit={giftToEdit}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};
