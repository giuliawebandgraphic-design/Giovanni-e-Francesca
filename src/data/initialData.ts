import { GiftItem, Guest, Donation, RegistrySettings } from '../types';

export const INITIAL_SETTINGS: RegistrySettings = {
  coupleNames: 'Giovanni & Francesca',
  eventTitle: 'Il nostro Matrimonio',
  eventDate: '2026-07-19',
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
};

// Clean default state: zero dummy gifts, zero dummy guests, zero dummy donations
export const INITIAL_GIFTS: GiftItem[] = [];
export const INITIAL_GUESTS: Guest[] = [];
export const INITIAL_DONATIONS: Donation[] = [];

// Optional preset demo data if user ever wants to load a sample
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
    raisedAmount: 0,
    suggestedQuotas: [50, 100, 150, 300],
    status: 'available',
    isPriority: true,
    contributionsCount: 0,
    createdAt: new Date().toISOString(),
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
    raisedAmount: 0,
    suggestedQuotas: [30, 50, 100],
    status: 'available',
    isPriority: false,
    contributionsCount: 0,
    createdAt: new Date().toISOString(),
  },
];
