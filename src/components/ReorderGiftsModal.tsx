import React, { useState } from 'react';
import { useRegistry } from '../context/RegistryContext';
import { GiftItem } from '../types';
import {
  X,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  ArrowUpDown,
  CheckCircle2,
  Sparkles,
  ArrowDownUp,
} from 'lucide-react';

interface ReorderGiftsModalProps {
  onClose: () => void;
}

export const ReorderGiftsModal: React.FC<ReorderGiftsModalProps> = ({ onClose }) => {
  const { gifts, moveGift, moveGiftToPosition, reorderGifts } = useRegistry();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showSavedToast, setShowSavedToast] = useState<boolean>(false);

  const triggerSavedFeedback = () => {
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  const handleMove = (id: string, direction: 'up' | 'down') => {
    moveGift(id, direction);
    triggerSavedFeedback();
  };

  const handleMoveToPosition = (id: string, targetPos: number) => {
    moveGiftToPosition(id, targetPos - 1);
    triggerSavedFeedback();
  };

  const handleMoveToExtreme = (id: string, extreme: 'top' | 'bottom') => {
    const target = extreme === 'top' ? 0 : gifts.length - 1;
    moveGiftToPosition(id, target);
    triggerSavedFeedback();
  };

  const handleReverseOrder = () => {
    const reversed = [...gifts].reverse();
    reorderGifts(reversed);
    triggerSavedFeedback();
  };

  // Drag and Drop handlers
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent or ghost styling
    if (e.dataTransfer.setDragImage && e.currentTarget) {
      e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...gifts];
    const [removed] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, removed);
    reorderGifts(updated);
    triggerSavedFeedback();

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const onDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 bg-[#FAF9F5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#636842]/10 text-[#636842] flex items-center justify-center">
              <ArrowUpDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-stone-900">
                  Modifica Ordine Lista Nozze
                </h3>
                <span className="text-[11px] font-semibold bg-[#BCBF97]/25 text-[#484c2e] px-2 py-0.5 rounded-full">
                  {gifts.length} {gifts.length === 1 ? 'regalo' : 'regali'}
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Organizza la sequenza con cui i regali vengono presentati ai vostri invitati.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showSavedToast && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 animate-in fade-in duration-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Salvato</span>
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              title="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar instructions & quick reverse */}
        <div className="px-5 py-2.5 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600 shrink-0">
          <div className="flex items-center gap-2 text-stone-600">
            <Sparkles className="w-3.5 h-3.5 text-[#636842]" />
            <span>
              Trascina gli elementi oppure usa le frecce e il selettore di posizione.
            </span>
          </div>

          {gifts.length > 1 && (
            <button
              type="button"
              onClick={handleReverseOrder}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Inverti l'ordine attuale della lista"
            >
              <ArrowDownUp className="w-3.5 h-3.5 text-stone-500" />
              <span>Inverti Ordine</span>
            </button>
          )}
        </div>

        {/* Gifts Draggable / Reorderable List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1 bg-stone-50/50">
          {gifts.length === 0 ? (
            <div className="py-12 text-center text-stone-500 text-xs">
              Nessun regalo presente nella lista da riordinare.
            </div>
          ) : (
            gifts.map((gift, index) => {
              const isFirst = index === 0;
              const isLast = index === gifts.length - 1;
              const isDragging = draggedIndex === index;
              const isOver = dragOverIndex === index && draggedIndex !== index;

              return (
                <div
                  key={gift.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, index)}
                  onDragOver={(e) => onDragOver(e, index)}
                  onDrop={(e) => onDrop(e, index)}
                  onDragEnd={onDragEnd}
                  className={`bg-white rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-150 ${
                    isDragging
                      ? 'opacity-40 border-dashed border-[#636842] scale-[0.98]'
                      : isOver
                      ? 'border-[#636842] ring-2 ring-[#636842]/20 shadow-md bg-[#636842]/5'
                      : 'border-stone-200 shadow-2xs hover:border-stone-300'
                  }`}
                >
                  {/* Left: Drag Handle + Position Badge + Image + Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="cursor-grab active:cursor-grabbing p-1 text-stone-400 hover:text-stone-700 rounded transition-colors touch-none"
                      title="Trascina per spostare"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <div className="w-7 h-7 rounded-lg bg-stone-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      #{index + 1}
                    </div>

                    {/* Image (vertical aspect ratio) */}
                    <div className="w-12 h-16 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                      <img
                        src={gift.imageUrl}
                        alt={gift.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Titles */}
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                          {gift.title}
                        </h4>
                        {gift.isPriority && (
                          <span className="text-[10px] font-bold bg-[#636842] text-white px-1.5 py-0.2 rounded">
                            Speciale
                          </span>
                        )}
                        {gift.status === 'completed' && (
                          <span className="text-[10px] font-bold bg-emerald-800 text-white px-1.5 py-0.2 rounded">
                            Completato
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 truncate mt-0.5">
                        {gift.subtitle || gift.description}
                      </p>
                      <p className="text-[11px] font-semibold text-[#636842] mt-0.5">
                        {gift.isInfiniteQuota
                          ? 'Quota libera'
                          : `Obiettivo: €${gift.targetAmount.toLocaleString('it-IT')}`}
                      </p>
                    </div>
                  </div>

                  {/* Right: Position Controls */}
                  <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    {/* Direct Position Dropdown */}
                    <div className="flex items-center gap-1 text-xs text-stone-500 mr-1">
                      <span className="hidden sm:inline text-[11px]">Posizione:</span>
                      <select
                        value={index + 1}
                        onChange={(e) => handleMoveToPosition(gift.id, parseInt(e.target.value, 10))}
                        className="py-1 px-2 text-xs font-semibold bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#636842] cursor-pointer"
                        title="Imposta posizione numerica diretta"
                      >
                        {gifts.map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            #{i + 1} {i === 0 ? '(Prima)' : i === gifts.length - 1 ? '(Ultima)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Extreme Top Button */}
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => handleMoveToExtreme(gift.id, 'top')}
                      title="Sposta in primissima posizione"
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isFirst
                          ? 'text-stone-300 border-stone-100 bg-stone-50 cursor-not-allowed'
                          : 'text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-900 cursor-pointer bg-white shadow-2xs'
                      }`}
                    >
                      <ChevronsUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Up Button */}
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => handleMove(gift.id, 'up')}
                      title="Sposta più in alto"
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isFirst
                          ? 'text-stone-300 border-stone-100 bg-stone-50 cursor-not-allowed'
                          : 'text-stone-700 border-stone-200 hover:bg-stone-100 hover:text-stone-900 cursor-pointer bg-white shadow-2xs'
                      }`}
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Down Button */}
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => handleMove(gift.id, 'down')}
                      title="Sposta più in basso"
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isLast
                          ? 'text-stone-300 border-stone-100 bg-stone-50 cursor-not-allowed'
                          : 'text-stone-700 border-stone-200 hover:bg-stone-100 hover:text-stone-900 cursor-pointer bg-white shadow-2xs'
                      }`}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Extreme Bottom Button */}
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => handleMoveToExtreme(gift.id, 'bottom')}
                      title="Sposta in ultimissima posizione"
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isLast
                          ? 'text-stone-300 border-stone-100 bg-stone-50 cursor-not-allowed'
                          : 'text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-900 cursor-pointer bg-white shadow-2xs'
                      }`}
                    >
                      <ChevronsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Le modifiche vengono salvate automaticamente in tempo reale.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 bg-[#636842] hover:bg-[#525636] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Fatto
          </button>
        </div>
      </div>
    </div>
  );
};
