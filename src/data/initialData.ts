import { GiftItem, Guest, Donation, RegistrySettings } from '../types';

export const INITIAL_SETTINGS: RegistrySettings = {
  coupleNames: '',
  eventTitle: 'La nostra lista nozze',
  eventLocation: '',
  welcomeMessage: '',
  currency: '€',
  paypalEmail: '',
  paypalMeUsername: '',
  bankIban: '',
  bankAccountHolder: '',
  bankName: '',
  bankBic: '',
  heroImage: '',
  applePayEnabled: false,
  applePayRecipient: '',
  stripeEnabled: false,
  stripeEmail: '',
  stripeAccountId: '',
  stripeAccountName: '',
  stripePublishableKey: '',
  stripeSecretKey: '',
  stripeMode: 'test',
  stripeStatus: 'disconnected',
  applePayThroughStripe: false,
};

// Default state: 2 demo gifts visible so couples can review and customize
export const DEMO_PRESET_GIFTS: GiftItem[] = [
  {
    id: 'gift-1',
    title: 'Soggiorno Overwater a Bora Bora',
    titleEn: 'Overwater stay in Bora Bora',
    subtitleEn: 'Magical nights above the turquoise lagoon',
    descriptionEn: 'Four nights in an exclusive overwater bungalow in Bora Bora, with breakfast delivered by canoe and sunsets over Mount Otemanu.',
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
    titleEn: 'Artisan stoneware dinner set',
    subtitleEn: 'Handmade dinner set for 12',
    descriptionEn: 'Hand-glazed artisan stoneware dinnerware in sand and sage tones.',
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

// Examples are available through "Carica esempi", never inserted automatically
// into a newly-created production registry.
export const INITIAL_GIFTS: GiftItem[] = [];
export const INITIAL_GUESTS: Guest[] = [];
export const INITIAL_DONATIONS: Donation[] = [];
