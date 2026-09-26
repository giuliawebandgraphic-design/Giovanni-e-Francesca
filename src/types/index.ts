export type GiftCategory = 'honeymoon' | 'home' | 'experience' | 'tech' | 'custom';

export type PaymentMethod = 'paypal' | 'bank_transfer';

export type DonationStatus = 'completed' | 'pending_verification' | 'pledged';

export interface GiftItem {
  id: string;
  title: string;
  subtitle: string;
  category: GiftCategory;
  description: string;
  imageUrl: string;
  targetAmount: number;
  raisedAmount: number;
  isInfiniteQuota?: boolean;
  suggestedQuotas?: number[];
  status: 'available' | 'completed' | 'archived';
  isPriority?: boolean;
  contributionsCount: number;
  createdAt: string;
}

export interface Donation {
  id: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  giftId: string;
  giftTitle: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: DonationStatus;
  paypalTransactionId?: string;
  message?: string;
  createdAt: string;
  thankYouSent: boolean;
  thankYouMessage?: string;
  thankYouSentAt?: string;
}

export interface Guest {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  group: 'Famiglia' | 'Amici Sposo' | 'Amici Sposa' | 'Colleghi' | 'Testimoni' | 'Altri';
  rsvpStatus: 'attending' | 'declined' | 'pending';
  totalDonated: number;
  donationsCount: number;
  thankYouSent: boolean;
  notes?: string;
  avatarColor: string;
}

export interface RegistrySettings {
  coupleNames: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  welcomeMessage: string;
  currency: string;
  paypalEmail: string;
  paypalMeUsername: string;
  bankIban: string;
  bankAccountHolder: string;
  bankName: string;
  bankBic?: string;
  heroImage: string;
}
