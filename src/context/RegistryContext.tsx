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
  refreshRegistry: () => Promise<void>;
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

  const isRemoteUpdatingRef = React.useRef<boolean>(false);
  const serverVersionRef = React.useRef<number>(1);

  // Function to pull latest registry from server
  const refreshRegistry = async () => {
    try {
      const res = await fetch('/api/registry');
      if (!res.ok) return;
      const data = await res.json();
      if (data && Array.isArray(data.gifts)) {
        isRemoteUpdatingRef.current = true;
        serverVersionRef.current = data.version || 1;

        setGifts(data.gifts);
        if (Array.isArray(data.guests)) setGuests(data.guests);
        if (Array.isArray(data.donations)) setDonations(data.donations);
        if (data.settings && typeof data.settings === 'object') setSettings(data.settings);

        try {
          localStorage.setItem(STORAGE_KEYS.GIFTS, JSON.stringify(data.gifts));
          if (data.guests) localStorage.setItem(STORAGE_KEYS.GUESTS, JSON.stringify(data.guests));
          if (data.donations) localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(data.donations));
          if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
        } catch {
          // ignore storage error
        }

        setTimeout(() => {
          isRemoteUpdatingRef.current = false;
        }, 150);
      }
    } catch (err) {
      console.warn('Could not fetch registry from server:', err);
    }
  };

  // Helper to push state changes to the server
  const pushSyncToServer = async (payload: {
    gifts?: GiftItem[];
    guests?: Guest[];
    donations?: Donation[];
    settings?: RegistrySettings;
  }) => {
    if (isRemoteUpdatingRef.current) return;
    try {
      const res = await fetch('/api/registry/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const result = await res.json();
        if (result && result.version) {
          serverVersionRef.current = result.version;
        }
      }
    } catch (err) {
      console.warn('Failed to sync changes to server:', err);
    }
  };

  // 1. Initial server fetch on mount
  useEffect(() => {
    refreshRegistry();
  }, []);

  // 2. Real-time background sync: SSE + fast polling (every 2.5s) + focus listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // A. Server-Sent Events (SSE) for instant push
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/registry/events');
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type === 'REGISTRY_UPDATED') {
            if (data.version && data.version > serverVersionRef.current) {
              refreshRegistry();
            }
          }
        } catch {
          // ignore
        }
      };
      eventSource.onerror = () => {
        // SSE connection error fallback to polling
      };
    } catch {
      // EventSource not supported or blocked
    }

    // B. Fast Polling (checks lightweight version every 2.5s)
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/registry/version');
        if (!res.ok) return;
        const info = await res.json();
        if (info && info.version && info.version > serverVersionRef.current) {
          refreshRegistry();
        }
      } catch {
        // ignore network error
      }
    }, 2500);

    // C. Refresh immediately when window/iframe gains focus or becomes visible
    const handleFocus = () => {
      refreshRegistry();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        refreshRegistry();
      }
    });

    // D. Cross-window BroadcastChannel listener (same origin tabs)
    let channel: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel('given2_live_sync');
      channel.onmessage = (event) => {
        if (!event.data || !event.data.type) return;
        refreshRegistry();
      };
    }

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
      if (channel) channel.close();
    };
  }, []);

  // Sync to local storage & push to server whenever state changes locally
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GIFTS, JSON.stringify(gifts));
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('given2_live_sync');
        channel.postMessage({ type: 'GIFTS_UPDATED' });
        channel.close();
      }
    } catch {
      // ignore
    }
    if (!isRemoteUpdatingRef.current) {
      pushSyncToServer({ gifts });
    }
  }, [gifts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GUESTS, JSON.stringify(guests));
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('given2_live_sync');
        channel.postMessage({ type: 'GUESTS_UPDATED' });
        channel.close();
      }
    } catch {
      // ignore
    }
    if (!isRemoteUpdatingRef.current) {
      pushSyncToServer({ guests });
    }
  }, [guests]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(donations));
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('given2_live_sync');
        channel.postMessage({ type: 'DONATIONS_UPDATED' });
        channel.close();
      }
    } catch {
      // ignore
    }
    if (!isRemoteUpdatingRef.current) {
      pushSyncToServer({ donations });
    }
  }, [donations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('given2_live_sync');
        channel.postMessage({ type: 'SETTINGS_UPDATED' });
        channel.close();
      }
    } catch {
      // ignore
    }
    if (!isRemoteUpdatingRef.current) {
      pushSyncToServer({ settings });
    }
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
        refreshRegistry,
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
