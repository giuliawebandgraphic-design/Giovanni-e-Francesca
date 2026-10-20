import React, { useState } from 'react';
import { useRegistry } from '../context/RegistryContext';
import { GiftItem, GiftCategory } from '../types';
import { AddEditGiftModal } from './AddEditGiftModal';
import { ReorderGiftsModal } from './ReorderGiftsModal';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Star,
  Gift,
  Filter,
  ArrowUpRight,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const WishlistManager: React.FC = () => {
  const { gifts, settings, deleteGift, updateGift, moveGift, loadDemoGifts, setActiveView } = useRegistry();
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [reorderModalOpen, setReorderModalOpen] = useState<boolean>(false);
  const [giftToEdit, setGiftToEdit] = useState<GiftItem | null>(null);
  const [giftToDelete, setGiftToDelete] = useState<GiftItem | null>(null);
  const [confirmReloadDemo, setConfirmReloadDemo] = useState<boolean>(false);

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
            Configura i regali, imposta le quote desiderate, modifica l'ordine di visualizzazione e controlla l'avanzamento.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            disabled={gifts.length < 2}
            onClick={() => setReorderModalOpen(true)}
            className={`flex items-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl border transition-colors ${
              gifts.length < 2
                ? 'bg-stone-50 text-stone-400 border-stone-200 cursor-not-allowed'
                : 'bg-white hover:bg-stone-100 text-stone-800 border-stone-200 shadow-2xs cursor-pointer'
            }`}
            title="Modifica l'ordine dei regali nella lista nozze con trascinamento o frecce"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#636842]" />
            <span>Modifica Ordine</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (gifts.length > 0) {
                setConfirmReloadDemo(true);
              } else {
                loadDemoGifts();
              }
            }}
            className="flex items-center gap-1.5 py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl border border-stone-200 transition-colors cursor-pointer"
            title="Ripristina i 2 prodotti demo nella wishlist"
          >
            <span>Ricarica 2 Demo</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 py-2 px-4 bg-[#636842] hover:bg-[#525636] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Regalo</span>
          </button>
        </div>
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
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 py-2.5 px-5 bg-[#636842] hover:bg-[#525636] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Aggiungi il Primo Regalo</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gifts.map((gift, index) => {
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
                {/* Image and badges (vertical aspect ratio) */}
                <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
                  <img
                    src={gift.imageUrl}
                    alt={gift.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
                    <span className="bg-stone-900/85 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                      #{index + 1}
                    </span>
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
                      onClick={() => setGiftToDelete(gift)}
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
                    <h4 className="font-editorial text-xl font-bold text-stone-900 leading-tight">
                      {gift.title}
                    </h4>
                    <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">{gift.subtitle}</p>
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
                      Avanzamento ({gift.contributionsCount} {gift.contributionsCount === 1 ? 'donatore' : 'donatori'}):
                    </span>
                    <span className="font-bold text-[#636842] tabular-nums">
                      {gift.isInfiniteQuota ? 'Quota libera' : `${percent}%`}
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

                {/* Quick Reorder Controls */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase font-bold text-stone-400 mr-0.5">Ordine:</span>
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveGift(gift.id, 'up')}
                      title={index === 0 ? 'È già il primo elemento' : 'Sposta prima (←)'}
                      className={`p-1 rounded-md border flex items-center gap-0.5 transition-colors ${
                        index === 0
                          ? 'text-stone-300 border-stone-100 bg-stone-50 cursor-not-allowed'
                          : 'text-stone-700 border-stone-200 hover:bg-stone-100 hover:text-stone-900 cursor-pointer bg-white shadow-2xs'
                      }`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-semibold">Prima</span>
                    </button>
                    <button
                      type="button"
                      disabled={index === gifts.length - 1}
                      onClick={() => moveGift(gift.id, 'down')}
                      title={index === gifts.length - 1 ? "È già l'ultimo elemento" : 'Sposta dopo (→)'}
                      className={`p-1 rounded-md border flex items-center gap-0.5 transition-colors ${
                        index === gifts.length - 1
                          ? 'text-stone-300 border-stone-100 bg-stone-50 cursor-not-allowed'
                          : 'text-stone-700 border-stone-200 hover:bg-stone-100 hover:text-stone-900 cursor-pointer bg-white shadow-2xs'
                      }`}
                    >
                      <span className="text-[10px] font-semibold">Dopo</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {gifts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setReorderModalOpen(true)}
                      className="text-[11px] text-[#636842] hover:text-[#525636] font-semibold hover:underline cursor-pointer flex items-center gap-1"
                      title="Apri pannello per riordinare tutti i regali con trascinamento"
                    >
                      <ArrowUpDown className="w-3 h-3" />
                      <span>Riordina</span>
                    </button>
                  )}
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

      {reorderModalOpen && (
        <ReorderGiftsModal
          onClose={() => setReorderModalOpen(false)}
        />
      )}

      {/* Confirmation Modal: Delete Gift */}
      {giftToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-stone-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-900">
                  Eliminare questo regalo?
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Stai per eliminare definitivamente <strong className="text-stone-900">"{giftToDelete.title}"</strong> dalla lista nozze.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setGiftToDelete(null)}
                className="py-2 px-4 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteGift(giftToDelete.id);
                  setGiftToDelete(null);
                }}
                className="py-2 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition-colors cursor-pointer"
              >
                Elimina Regalo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Reload Demo Gifts */}
      {confirmReloadDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-stone-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#BCBF97]/20 text-[#636842] flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-900">
                  Ricaricare i 2 regali di prova?
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Questa azione ripristinerà i 2 regali di esempio demo, sovrascrivendo la lista attuale.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setConfirmReloadDemo(false)}
                className="py-2 px-4 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => {
                  loadDemoGifts();
                  setConfirmReloadDemo(false);
                }}
                className="py-2 px-4 rounded-xl text-xs font-bold text-white bg-[#636842] hover:bg-[#525636] shadow-xs transition-colors cursor-pointer"
              >
                Conferma e Ricarica
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
