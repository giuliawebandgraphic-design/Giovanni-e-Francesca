import React, { createContext, useContext, useState, useEffect } from 'react';
import { GiftItem, Guest, Donation, RegistrySettings, PaymentMethod, DonationStatus } from '../types';
import { INITIAL_GIFTS, INITIAL_GUESTS, INITIAL_DONATIONS, INITIAL_SETTINGS, DEMO_PRESET_GIFTS } from '../data/initialData';

export type AppView = 
  | 'guest_registry' 
  | 'embed_view'
  | 'organizer_dashboard' 
  | 'organizer_gifts' 
  | 'organizer_guests' 
  | 'organizer_paypal'
  | 'organizer_thanks'
  | 'organizer_stats'
  | 'organizer_embed'
  | 'organizer_image';

interface RegistryContextType {
  gifts: GiftItem[];
  guests: Guest[];
  donations: Donation[];
  settings: RegistrySettings;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  selectedGuestIdForDrawer: string | null;
  setSelectedGuestIdForDrawer: (id: string | null) => void;
  
  // Actions
  recordDonation: (params: {
    guestId?: string;
    guestName: string;
    guestEmail: string;
    guestPhone?: string;
    guestGroup?: Guest['group'];
    giftId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    message?: string;
    status?: DonationStatus;
  }) => { donation: Donation; guest: Guest };

  addGift: (gift: Omit<GiftItem, 'id' | 'raisedAmount' | 'contributionsCount' | 'createdAt'>) => void;
  updateGift: (id: string, updates: Partial<GiftItem>) => void;
  deleteGift: (id: string) => void;
  
  addGuest: (guest: Omit<Guest, 'id' | 'totalDonated' | 'donationsCount' | 'thankYouSent' | 'avatarColor'>) => Guest;
  updateGuest: (id: string, updates: Partial<Guest>) => void;
  deleteGuest: (id: string) => void;

  updateDonationStatus: (donationId: string, status: DonationStatus) => void;
  sendThankYou: (guestId: string, donationId?: string, customNote?: string) => void;
  updateSettings: (updates: Partial<RegistrySettings>) => void;
  resetToDefaults: () => void;
  clearAllData: () => void;
  loadDemoGifts: () => void;

  // Computed & Helpers
  totalTarget: number;
  totalRaised: number;
  paypalTotal: number;
  bankTotal: number;
  getPayPalLink: (amount: number, referenceCode: string, note?: string) => string;
}

const RegistryContext = createContext<RegistryContextType | undefined>(undefined);

const STORAGE_KEYS = {
  GIFTS: 'given2_gifts_clean_v1',
  GUESTS: 'given2_guests_clean_v1',
  DONATIONS: 'given2_donations_clean_v1',
  SETTINGS: 'given2_settings_clean_v1',
};

const AVATAR_COLORS = [
  'bg-emerald-600',
  'bg-rose-600',
  'bg-[#8c9167]',
  'bg-indigo-600',
  'bg-sky-600',
  'bg-teal-600',
  'bg-purple-600',
  'bg-stone-600',
];

export const RegistryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gifts, setGifts] = useState<GiftItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GIFTS);
      return saved ? JSON.parse(saved) : INITIAL_GIFTS;
    } catch {
      return INITIAL_GIFTS;
    }
  });

  const [guests, setGuests] = useState<Guest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GUESTS);
      return saved ? JSON.parse(saved) : INITIAL_GUESTS;
    } catch {
      return INITIAL_GUESTS;
    }
  });

  const [donations, setDonations] = useState<Donation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DONATIONS);
      return saved ? JSON.parse(saved) : INITIAL_DONATIONS;
    } catch {
      return INITIAL_DONATIONS;
    }
  });

  const [settings, setSettings] = useState<RegistrySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [activeView, setActiveView] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('embed') === 'true' || params.get('mode') === 'embed') {
          return 'embed_view';
        }
        const savedView = sessionStorage.getItem('given2_active_view');
        if (savedView) {
          return savedView as AppView;
        }
      } catch {
        // fallback
      }
    }
    return 'organizer_dashboard';
  });
  const [selectedGuestIdForDrawer, setSelectedGuestIdForDrawer] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GIFTS, JSON.stringify(gifts));
  }, [gifts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GUESTS, JSON.stringify(guests));
  }, [guests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(donations));
  }, [donations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    try {
      sessionStorage.setItem('given2_active_view', activeView);
    } catch {
      // ignore
    }
  }, [activeView]);

  // Recalculate gifts raised amounts dynamically when donations change
  useEffect(() => {
    setGifts((prevGifts) =>
      prevGifts.map((gift) => {
        const giftDonations = donations.filter(
          (d) => d.giftId === gift.id && d.status === 'completed'
        );
        const raised = giftDonations.reduce((sum, d) => sum + d.amount, 0);
        const isComplete = !gift.isInfiniteQuota && gift.targetAmount > 0 && raised >= gift.targetAmount;
        return {
          ...gift,
          raisedAmount: raised,
          contributionsCount: giftDonations.length,
          status: isComplete ? 'completed' : gift.status === 'archived' ? 'archived' : 'available',
        };
      })
    );
  }, [donations]);

  // Record a donation
  const recordDonation = (params: {
    guestId?: string;
    guestName: string;
    guestEmail: string;
    guestPhone?: string;
    guestGroup?: Guest['group'];
    giftId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    message?: string;
    status?: DonationStatus;
  }) => {
    const gift = gifts.find((g) => g.id === params.giftId);
    const giftTitle = gift ? gift.title : 'Regalo Lista Nozze';

    let currentGuest: Guest;
    const existingGuest = params.guestId 
      ? guests.find((g) => g.id === params.guestId) 
      : guests.find((g) => g.email.toLowerCase() === params.guestEmail.toLowerCase().trim());

    if (existingGuest) {
      currentGuest = {
        ...existingGuest,
        totalDonated: existingGuest.totalDonated + params.amount,
        donationsCount: existingGuest.donationsCount + 1,
        rsvpStatus: existingGuest.rsvpStatus === 'pending' ? 'attending' : existingGuest.rsvpStatus,
      };
      setGuests((prev) => prev.map((g) => (g.id === currentGuest.id ? currentGuest : g)));
    } else {
      const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
      currentGuest = {
        id: `guest-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        fullName: params.guestName.trim(),
        email: params.guestEmail.trim(),
        phone: params.guestPhone || '',
        group: params.guestGroup || 'Altri',
        rsvpStatus: 'attending',
        totalDonated: params.amount,
        donationsCount: 1,
        thankYouSent: false,
        avatarColor: randomColor,
      };
      setGuests((prev) => [currentGuest, ...prev]);
    }

    const newDonation: Donation = {
      id: `don-${Date.now()}`,
      guestId: currentGuest.id,
      guestName: currentGuest.fullName,
      guestEmail: currentGuest.email,
      giftId: params.giftId,
      giftTitle: giftTitle,
      amount: params.amount,
      paymentMethod: params.paymentMethod,
      status: params.status || 'completed',
      paypalTransactionId:
        params.paymentMethod === 'paypal'
          ? `PP-${Math.floor(1000000 + Math.random() * 9000000)}`
          : undefined,
      message: params.message || '',
      createdAt: new Date().toISOString(),
      thankYouSent: false,
    };

    setDonations((prev) => [newDonation, ...prev]);
    return { donation: newDonation, guest: currentGuest };
  };

  const addGift = (giftData: Omit<GiftItem, 'id' | 'raisedAmount' | 'contributionsCount' | 'createdAt'>) => {
    const newGift: GiftItem = {
      ...giftData,
      id: `gift-${Date.now()}`,
      raisedAmount: 0,
      contributionsCount: 0,
      createdAt: new Date().toISOString(),
    };
    setGifts((prev) => [newGift, ...prev]);
  };

  const updateGift = (id: string, updates: Partial<GiftItem>) => {
    setGifts((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  };

  const deleteGift = (id: string) => {
    setGifts((prev) => prev.filter((g) => g.id !== id));
  };

  const addGuest = (guestData: Omit<Guest, 'id' | 'totalDonated' | 'donationsCount' | 'thankYouSent' | 'avatarColor'>) => {
    const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const newGuest: Guest = {
      ...guestData,
      id: `guest-${Date.now()}`,
      totalDonated: 0,
      donationsCount: 0,
      thankYouSent: false,
      avatarColor: randomColor,
    };
    setGuests((prev) => [newGuest, ...prev]);
    return newGuest;
  };

  const updateGuest = (id: string, updates: Partial<Guest>) => {
    setGuests((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  };

  const deleteGuest = (id: string) => {
    setGuests((prev) => prev.filter((g) => g.id !== id));
  };

  const updateDonationStatus = (donationId: string, status: DonationStatus) => {
    setDonations((prev) =>
      prev.map((d) => (d.id === donationId ? { ...d, status } : d))
    );
  };

  const sendThankYou = (guestId: string, donationId?: string, customNote?: string) => {
    const now = new Date().toISOString();
    setGuests((prev) =>
      prev.map((g) => (g.id === guestId ? { ...g, thankYouSent: true } : g))
    );
    setDonations((prev) =>
      prev.map((d) => {
        if (donationId) {
          if (d.id === donationId) {
            return {
              ...d,
              thankYouSent: true,
              thankYouMessage: customNote || d.thankYouMessage,
              thankYouSentAt: now,
            };
          }
          return d;
        }
        if (d.guestId === guestId) {
          return {
            ...d,
            thankYouSent: true,
            thankYouMessage: customNote || d.thankYouMessage || 'Grazie di cuore!',
            thankYouSentAt: now,
          };
        }
        return d;
      })
    );
  };

  const updateSettings = (updates: Partial<RegistrySettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const resetToDefaults = () => {
    localStorage.removeItem(STORAGE_KEYS.GIFTS);
    localStorage.removeItem(STORAGE_KEYS.GUESTS);
    localStorage.removeItem(STORAGE_KEYS.DONATIONS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    setGifts(INITIAL_GIFTS);
    setGuests(INITIAL_GUESTS);
    setDonations(INITIAL_DONATIONS);
    setSettings(INITIAL_SETTINGS);
  };

  const clearAllData = () => {
    setGifts([]);
    setGuests([]);
    setDonations([]);
    localStorage.removeItem(STORAGE_KEYS.GIFTS);
    localStorage.removeItem(STORAGE_KEYS.GUESTS);
    localStorage.removeItem(STORAGE_KEYS.DONATIONS);
  };

  const loadDemoGifts = () => {
    setGifts(DEMO_PRESET_GIFTS);
  };

  // Direct PayPal link generator
  const getPayPalLink = (amount: number, referenceCode: string, note?: string) => {
    const cleanHandle = settings.paypalMeUsername.replace(/^@/, '').trim();
    if (cleanHandle) {
      // Standard PayPal.me format: https://paypal.me/username/100EUR
      return `https://www.paypal.com/paypalme/${cleanHandle}/${amount}EUR`;
    }
    // Fallback to PayPal standard send money URL with recipient email
    const encodedNote = encodeURIComponent(`Regalo Lista Nozze (${referenceCode})${note ? ` - ${note}` : ''}`);
    return `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(
      settings.paypalEmail
    )}&amount=${amount}&currency_code=EUR&item_name=${encodedNote}`;
  };

  const completedDonations = donations.filter((d) => d.status === 'completed');
  const totalRaised = completedDonations.reduce((sum, d) => sum + d.amount, 0);
  const totalTarget = gifts.reduce((sum, g) => sum + (g.isInfiniteQuota ? 0 : g.targetAmount), 0);

  const paypalTotal = completedDonations
    .filter((d) => d.paymentMethod === 'paypal')
    .reduce((sum, d) => sum + d.amount, 0);

  const bankTotal = completedDonations
    .filter((d) => d.paymentMethod === 'bank_transfer')
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <RegistryContext.Provider
      value={{
        gifts,
        guests,
        donations,
        settings,
        activeView,
        setActiveView,
        isSidebarOpen,
        setIsSidebarOpen,
        toggleSidebar,
        selectedGuestIdForDrawer,
        setSelectedGuestIdForDrawer,
        recordDonation,
        addGift,
        updateGift,
        deleteGift,
        addGuest,
        updateGuest,
        deleteGuest,
        updateDonationStatus,
        sendThankYou,
        updateSettings,
        resetToDefaults,
        clearAllData,
        loadDemoGifts,
        totalTarget,
        totalRaised,
        paypalTotal,
        bankTotal,
        getPayPalLink,
      }}
    >
      {children}
    </RegistryContext.Provider>
  );
};

export const useRegistry = () => {
  const context = useContext(RegistryContext);
  if (!context) {
    throw new Error('useRegistry must be used within a RegistryProvider');
  }
  return context;
};
