import React, { useState } from 'react';
import { useRegistry } from '../context/RegistryContext';
import { Guest, PaymentMethod } from '../types';
import { X, Check, DollarSign } from 'lucide-react';

interface DirectRecordDonationModalProps {
  guest: Guest;
  onClose: () => void;
}

export const DirectRecordDonationModal: React.FC<DirectRecordDonationModalProps> = ({
  guest,
  onClose,
}) => {
  const { gifts, settings, recordDonation } = useRegistry();

  const [selectedGiftId, setSelectedGiftId] = useState<string>(gifts[0]?.id || '');
  const [amount, setAmount] = useState<string>('100');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paypal');
  const [message, setMessage] = useState<string>('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) return;
    if (!selectedGiftId) return;

    recordDonation({
      guestId: guest.id,
      guestName: guest.fullName,
      guestEmail: guest.email,
      guestPhone: guest.phone,
      guestGroup: guest.group,
      giftId: selectedGiftId,
      amount: numericAmount,
      paymentMethod,
      message: message.trim(),
      status: 'completed',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 bg-stone-50 border-b border-stone-200">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#636842] font-semibold">
              Gestione Donazioni Profilo
            </span>
            <h3 className="font-editorial text-xl font-semibold text-stone-900">
              Registra Donazione per {guest.fullName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <p className="text-xs text-stone-600">
            Usa questo modulo per registrare manualmente una quota ricevuta direttamente (tramite PayPal o bonifico bancario sul tuo conto).
          </p>

          {/* Product selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1.5">
              Prodotto o Esperienza destinataria *
            </label>
            <select
              value={selectedGiftId}
              onChange={(e) => setSelectedGiftId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#BCBF97]"
              required
            >
              {gifts.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title} ({settings.currency}{g.raisedAmount} / {g.isInfiniteQuota ? 'Fondo aperto' : `${settings.currency}${g.targetAmount}`})
                </option>
              ))}
            </select>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1.5">
              Importo versato ({settings.currency}) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-stone-500 font-bold">
                {settings.currency}
              </span>
              <input
                type="number"
                min="1"
                step="5"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-semibold text-base focus:outline-none focus:ring-2 focus:ring-[#BCBF97]"
                required
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1.5">
              Canale di versamento *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('paypal')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all cursor-pointer ${
                  paymentMethod === 'paypal'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold ring-1 ring-blue-500'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                PayPal
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all cursor-pointer ${
                  paymentMethod === 'bank_transfer'
                    ? 'bg-[#BCBF97]/20 border-[#BCBF97] text-[#484c2e] font-semibold ring-1 ring-[#BCBF97]'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                Bonifico Bancario
              </button>
            </div>
          </div>

          {/* Message / Note */}
          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1.5">
              Dedica dell'invitato o nota organizzativa
            </label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Es. Ricevuto con affetto per la lista nozze..."
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#BCBF97]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 bg-[#636842] hover:bg-[#525636] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Registra Donazione
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
