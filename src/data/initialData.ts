import { GiftItem, Guest, Donation, RegistrySettings } from '../types';

export const INITIAL_SETTINGS: RegistrySettings = {
  coupleNames: 'Giovanni & Francesca',
  eventTitle: 'Il nostro Matrimonio',
  eventLocation: 'Villa Cordevigo Wine Relais, Cavaion Veronese (VR)',
  welcomeMessage:
    'La vostra presenza è per noi il dono più prezioso. Se desiderate accompagnarci nel realizzare i nostri sogni per la nuova vita insieme o contribuire al nostro viaggio di nozze, qui potete inserire la vostra quota libera con versamento diretto su PayPal o bonifico bancario.',
  currency: '€',
  paypalEmail: 'giovanni.francesca.wedding@gmail.com',
  paypalMeUsername: 'giovannifrancescawedding',
  bankIban: 'IT60 X 05428 11101 000000124890',
  bankAccountHolder: 'Giovanni Rossi e Francesca Bianchi',
  bankName: 'Intesa Sanpaolo - Filiale Verona Centro',
  bankBic: 'BCITITMM',
  heroImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80',
  applePayEnabled: true,
  applePayRecipient: 'giovanni.francesca.wedding@gmail.com',
  stripeEnabled: false,
  stripeEmail: 'giovanni.francesca.wedding@gmail.com',
  stripeAccountId: '',
  stripeAccountName: 'Giovanni & Francesca Wedding Fund',
  stripePublishableKey: '',
  stripeSecretKey: '',
  stripeMode: 'test',
  stripeStatus: 'disconnected',
  applePayThroughStripe: true,
};

// Default state: 2 demo gifts visible so couples can review and customize
export const DEMO_PRESET_GIFTS: GiftItem[] = [
  {
    id: 'gift-1',
    title: 'Soggiorno Overwater a Bora Bora',
    subtitle: 'Notti magiche sospesi sulla laguna turchese',
    category: 'honeymoon',
    description:
      'Quattro notti in un esclusivo bungalow su palafitta a Bora Bora con colazione servita in canoa e tramonti sul monte Otemanu.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    targetAmount: 3200,
    raisedAmount: 850,
    suggestedQuotas: [50, 100, 150, 300],
    status: 'available',
    isPriority: true,
    contributionsCount: 3,
    createdAt: '2026-07-01T10:00:00.000Z',
  },
  {
    id: 'gift-2',
    title: 'Set di Piatti Artigianali in Gres',
    subtitle: 'Servizio completo 12 persone fatto a mano',
    category: 'home',
    description:
      'Servizio da tavola artigianale in ceramica gres smaltata a mano nei toni della sabbia e della salvia.',
    imageUrl: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80',
    targetAmount: 650,
    raisedAmount: 150,
    suggestedQuotas: [30, 50, 100],
    status: 'available',
    isPriority: false,
    contributionsCount: 1,
    createdAt: '2026-07-02T14:30:00.000Z',
  },
];

export const INITIAL_GIFTS: GiftItem[] = DEMO_PRESET_GIFTS;
export const INITIAL_GUESTS: Guest[] = [];
export const INITIAL_DONATIONS: Donation[] = [];
