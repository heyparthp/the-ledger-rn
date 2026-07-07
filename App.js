import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  StatusBar,
  Linking,
  Modal,
  ActivityIndicator,
  PermissionsAndroid
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ═══════════════════════════════════════════════
// MCC DATA & CONSTANTS
// ═══════════════════════════════════════════════
const MCC_GROUPS = [
  { id: 'dining',     label: 'Dining & Restaurants',    ico: '🍽️', codes: [5811, 5812, 5813, 5814] },
  { id: 'grocery',    label: 'Grocery & Supermarkets',  ico: '🛒', codes: [5411, 5422, 5441, 5451, 5499] },
  { id: 'fuel',       label: 'Fuel & Petrol',           ico: '⛽', codes: [5172, 5541, 5542, 5983] },
  { id: 'ecommerce',  label: 'Online Shopping',         ico: '🛍️', codes: [5961, 5964, 5965, 5999] },
  { id: 'travel',     label: 'Travel & Transport',      ico: '✈️', codes: [4111, 4112, 4121, 4131, 4511, 4722, 7011] },
  { id: 'entertain',  label: 'Movies & Entertainment',  ico: '🎬', codes: [7832, 7922, 7991, 7999] },
  { id: 'health',     label: 'Healthcare & Pharmacy',   ico: '💊', codes: [5047, 5122, 5912, 8011, 8049, 8099] },
  { id: 'utilities',  label: 'Utilities & Telecom',     ico: '💡', codes: [4812, 4813, 4814, 4816, 4899, 4900] },
  { id: 'education',  label: 'Education',               ico: '📚', codes: [8211, 8220, 8249, 8299] },
  { id: 'insurance',  label: 'Insurance',               ico: '🔒', codes: [6300, 6311, 6321, 6399] },
  { id: 'rent',       label: 'Rent & Real Estate',      ico: '🏠', codes: [6513, 7349] },
  { id: 'wallet',     label: 'Wallet / Prepaid Load',   ico: '👛', codes: [6540, 6541] },
  { id: 'other',      label: 'All Other',               ico: '💳', codes: [] },
];
const MCC_BY_ID = Object.fromEntries(MCC_GROUPS.map(g => [g.id, g]));

const BUILT_IN_MERCHANT_MCC = {
  swiggy: 'dining', zomato: 'dining', dominos: 'dining', "domino's": 'dining', 'pizza hut': 'dining',
  mcdonald: 'dining', kfc: 'dining', subway: 'dining', 'burger king': 'dining', starbucks: 'dining',
  ccd: 'dining', barbeque: 'dining', haldiram: 'dining', 'wow momo': 'dining', 'behrouz biryani': 'dining',
  bigbasket: 'grocery', blinkit: 'grocery', zepto: 'grocery', dunzo: 'grocery', dmart: 'grocery',
  'reliance fresh': 'grocery', jiomart: 'grocery', instamart: 'grocery',
  amazon: 'ecommerce', flipkart: 'ecommerce', myntra: 'ecommerce', ajio: 'ecommerce', meesho: 'ecommerce',
  nykaa: 'ecommerce', snapdeal: 'ecommerce', 'tata cliq': 'ecommerce', croma: 'ecommerce',
  'vijay sales': 'ecommerce', 'reliance digital': 'ecommerce',
  uber: 'travel', ola: 'travel', rapido: 'travel', 'namma yatri': 'travel', irctc: 'travel',
  makemytrip: 'travel', goibibo: 'travel', ixigo: 'travel', cleartrip: 'travel', yatra: 'travel',
  redbus: 'travel', airbnb: 'travel', oyo: 'travel', indigo: 'travel', 'air india': 'travel', spicejet: 'travel',
  petrol: 'fuel', iocl: 'fuel', bpcl: 'fuel', 'indian oil': 'fuel', 'bharat petroleum': 'fuel',
  'hindustan petroleum': 'fuel', shell: 'fuel', hp: 'fuel',
  netflix: 'entertain', hotstar: 'entertain', disney: 'entertain', spotify: 'entertain',
  'amazon prime': 'entertain', 'prime video': 'entertain', bookmyshow: 'entertain',
  pvr: 'entertain', inox: 'entertain', zee5: 'entertain', sonyliv: 'entertain',
  apollo: 'health', medplus: 'health', '1mg': 'health', pharmeasy: 'health',
  netmeds: 'health', practo: 'health', 'tata 1mg': 'health',
  airtel: 'utilities', jio: 'utilities', vodafone: 'utilities', bsnl: 'utilities',
  'dish tv': 'utilities', 'tata play': 'utilities', hathway: 'utilities',
  byju: 'education', byjus: 'education', unacademy: 'education', vedantu: 'education',
  coursera: 'education', udemy: 'education', upgrad: 'education',
  lic: 'insurance', 'hdfc life': 'insurance', 'max life': 'insurance',
  policybazaar: 'insurance', 'star health': 'insurance',
  'paytm wallet': 'wallet', mobikwik: 'wallet', freecharge: 'wallet',
};

const CARD_TEMPLATES = [
  // HDFC
  { bank: 'HDFC', name: 'Millennia', type: 'Credit', network: 'Visa', defaultRate: 1, cap: 1000,
    mccRates: { ecommerce: 5, dining: 5, grocery: 5, travel: 5, entertain: 5 }, excluded: ['fuel', 'rent', 'insurance', 'wallet'] },
  { bank: 'HDFC', name: 'Regalia Gold', type: 'Credit', network: 'Mastercard', defaultRate: 1.33, cap: null,
    mccRates: { travel: 2, dining: 2 }, excluded: ['fuel', 'rent', 'wallet'] },
  { bank: 'HDFC', name: 'Infinia', type: 'Credit', network: 'Visa', defaultRate: 3.3, cap: null,
    mccRates: { travel: 10, dining: 10 }, excluded: ['fuel', 'wallet'] },
  { bank: 'HDFC', name: 'MoneyBack+', type: 'Credit', network: 'Visa', defaultRate: 0.5, cap: null,
    mccRates: { ecommerce: 1.5 }, excluded: ['fuel', 'wallet'] },

  // ICICI
  { bank: 'ICICI', name: 'Amazon Pay', type: 'Credit', network: 'Visa', defaultRate: 1, cap: null,
    mccRates: { ecommerce: 5 }, excluded: ['fuel'] },
  { bank: 'ICICI', name: 'Coral', type: 'Credit', network: 'Visa', defaultRate: 0.5, cap: null,
    mccRates: { dining: 2, grocery: 2 }, excluded: ['fuel'] },
  { bank: 'ICICI', name: 'Rubyx', type: 'Credit', network: 'Mastercard', defaultRate: 1, cap: null,
    mccRates: { travel: 2 }, excluded: ['fuel'] },

  // SBI
  { bank: 'SBI', name: 'Cashback', type: 'Credit', network: 'Visa', defaultRate: 1, cap: 5000,
    mccRates: { ecommerce: 5 }, excluded: ['fuel', 'rent', 'wallet'] },
  { bank: 'SBI', name: 'SimplySAVE', type: 'Credit', network: 'Visa', defaultRate: 1, cap: null,
    mccRates: { dining: 2, grocery: 2, entertain: 2, fuel: 2 }, excluded: [] },
  { bank: 'SBI', name: 'SimplyCLICK', type: 'Credit', network: 'Visa', defaultRate: 1.25, cap: null,
    mccRates: { ecommerce: 2.5 }, excluded: [] },

  // Axis
  { bank: 'Axis', name: 'Flipkart', type: 'Credit', network: 'Visa', defaultRate: 1.5, cap: null,
    mccRates: { ecommerce: 5 }, excluded: ['fuel', 'wallet'] },
  { bank: 'Axis', name: 'Ace', type: 'Credit', network: 'Visa', defaultRate: 2, cap: null,
    mccRates: { utilities: 5, dining: 4 }, excluded: ['fuel', 'wallet'] },
  { bank: 'Axis', name: 'Magnus', type: 'Credit', network: 'Visa', defaultRate: 1.2, cap: null,
    mccRates: { travel: 2.4, dining: 2.4 }, excluded: ['fuel', 'wallet'] },

  // AMEX
  { bank: 'AMEX', name: 'Membership Rewards', type: 'Credit', network: 'Amex', defaultRate: 1, cap: null,
    mccRates: { dining: 2, travel: 2 }, excluded: ['fuel'] },
  { bank: 'AMEX', name: 'Gold Card', type: 'Credit', network: 'Amex', defaultRate: 1, cap: null,
    mccRates: { ecommerce: 3, utilities: 3 }, excluded: ['fuel'] },
];

const DEFAULT_CATS = [
  { id: 'food',     name: 'Food',         color: '#B5651D', mccGroups: ['dining', 'grocery'], builtin: true,
    subcats: [{ id: 'food_restaurant', name: 'Restaurant / Dining' }, { id: 'food_grocery', name: 'Grocery' }, { id: 'food_snacks', name: 'Snacks' }] },
  { id: 'transport', name: 'Transport',    color: '#2E5266', mccGroups: ['travel', 'fuel'],   builtin: true,
    subcats: [{ id: 'tr_cab', name: 'Cab / Taxi' }, { id: 'tr_metro', name: 'Metro / Bus' }, { id: 'tr_fuel', name: 'Fuel / Petrol' }] },
  { id: 'shopping',  name: 'Shopping',     color: '#6B4E71', mccGroups: ['ecommerce'],       builtin: true,
    subcats: [{ id: 'sh_clothing', name: 'Clothing' }, { id: 'sh_electronics', name: 'Electronics' }] },
  { id: 'bills',    name: 'Bills',        color: '#3F6B4F', mccGroups: ['utilities', 'insurance', 'rent', 'wallet'], builtin: true,
    subcats: [{ id: 'bi_electricity', name: 'Electricity' }, { id: 'bi_rent', name: 'Rent' }, { id: 'bi_ott', name: 'OTT Subscriptions' }] },
  { id: 'other',    name: 'Other',        color: '#5C5C52', mccGroups: ['other'],           builtin: true, subcats: [] },
];

const DEFAULT_UPI = [
  { id: 'upi_gpay',    name: 'Google Pay',  upiId: '' },
  { id: 'upi_phonepe', name: 'PhonePe',     upiId: '' },
  { id: 'upi_paytm',   name: 'Paytm',       upiId: '' },
];

const STORE_KEY = 'ledger:v4';

// Base64 Decoder Polyfill for Hermes / React Native
const base64Decode = (str) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let buffer = '';
  str = str.replace(/=+$/, '');
  for (let i = 0, len = str.length; i < len; i += 4) {
    const chunk = (chars.indexOf(str[i]) << 18) |
                  (chars.indexOf(str[i + 1]) << 12) |
                  ((chars.indexOf(str[i + 2]) || 0) << 6) |
                  (chars.indexOf(str[i + 3]) || 0);
    buffer += String.fromCharCode((chunk >> 16) & 255);
    if (str[i + 2]) buffer += String.fromCharCode((chunk >> 8) & 255);
    if (str[i + 3]) buffer += String.fromCharCode(chunk & 255);
  }
  return buffer;
};

// ═══════════════════════════════════════════════
// DUAL THEMES
// ═══════════════════════════════════════════════
const THEMES = {
  light: {
    paper: '#f8fafc',
    paperRule: '#f1f5f9',
    ink: '#0f172a',
    inkMid: '#475569',
    inkSoft: '#64748b',
    inkFaint: '#cbd5e1',
    red: '#f43f5e',
    redBg: '#fff1f2',
    brass: '#6366f1',
    brassBg: '#e0e7ff',
    green: '#10b981',
    lime: '#84cc16',
    limeBg: '#f7fee7',
    line: '#e2e8f0',
    card: '#ffffff',
  },
  dark: {
    paper: '#09090b',
    paperRule: '#18181b',
    ink: '#f8fafc',
    inkMid: '#cbd5e1',
    inkSoft: '#94a3b8',
    inkFaint: '#27272a',
    red: '#f43f5e',
    redBg: 'rgba(244, 63, 94, 0.08)',
    brass: '#6366f1',
    brassBg: 'rgba(99, 102, 241, 0.08)',
    green: '#10b981',
    lime: '#84cc16',
    limeBg: 'rgba(132, 204, 22, 0.08)',
    line: 'rgba(255, 255, 255, 0.06)',
    card: '#121214',
  }
};

const MODE_LABEL = { upi: 'UPI', credit: 'Credit Card', debit: 'Debit Card', cash: 'Cash', netbanking: 'Net Banking', other: 'Other' };

// ═══════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════
export default function App() {
  const [activeTab, setActiveTab] = useState('ledger');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const c = isDarkMode ? THEMES.dark : THEMES.light;

  // Global State
  const [entries, setEntries] = useState([]);
  const [cards, setCards] = useState([]);
  const [upiAccounts, setUpiAccounts] = useState(DEFAULT_UPI);
  const [merchantDb, setMerchantDb] = useState({});
  const [categories, setCategories] = useState(DEFAULT_CATS);
  const [settings, setSettings] = useState({ currency: '₹', googleClientId: '', syncDays: 14, telegramBotToken: '', telegramChatId: '' });
  const [googleToken, setGoogleToken] = useState(null);

  // Sync Logic Status
  const [isSyncing, setIsSyncing] = useState(false);
  const [importQueue, setImportQueue] = useState([]);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);

  // Split transaction state hooks
  const [splitModalVisible, setSplitModalVisible] = useState(false);
  const [splitTargetEntry, setSplitTargetEntry] = useState(null);
  const [splitAmountText, setSplitAmountText] = useState('');
  const [splitCategoryVal, setSplitCategoryVal] = useState('');

  // Listen for Deep Linking OAuth callbacks
  useEffect(() => {
    const handleDeepLink = async (event) => {
      const url = event.url;
      if (url && url.includes('access_token=')) {
        const token = url.split('access_token=')[1].split('&')[0];
        setGoogleToken(token);
        await AsyncStorage.setItem('googleToken', token);
        await AsyncStorage.setItem('googleTokenTime', String(Date.now()));
        Alert.alert("Success", "Connected to Google Mail!");
        setActiveTab('settings');
      }
    };
    
    const sub = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then(url => { if (url) handleDeepLink({ url }); });
    
    return () => { sub.remove(); };
  }, []);

  // Hydrate State on Mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const val = await AsyncStorage.getItem(STORE_KEY);
        if (val) {
          const d = JSON.parse(val);
          if (d.entries) setEntries(d.entries);
          if (d.cards) setCards(d.cards);
          if (d.upiAccounts) setUpiAccounts(d.upiAccounts);
          if (d.merchantDb) setMerchantDb(d.merchantDb);
          if (d.categories) setCategories(d.categories);
          if (d.settings) setSettings(d.settings);
        }
        
        // Restore Google token if valid
        const savedToken = await AsyncStorage.getItem('googleToken');
        const savedTime = await AsyncStorage.getItem('googleTokenTime');
        if (savedToken && savedTime && (Date.now() - parseInt(savedTime) < 3600 * 1000)) {
          setGoogleToken(savedToken);
        }
      } catch (e) {
        console.error("Hydration Error:", e);
      }
    };
    loadState();
  }, []);

  // Persistence Helper
  const persistState = async (updatedData) => {
    try {
      const payload = {
        entries: updatedData.entries ?? entries,
        cards: updatedData.cards ?? cards,
        upiAccounts: updatedData.upiAccounts ?? upiAccounts,
        merchantDb: updatedData.merchantDb ?? merchantDb,
        categories: updatedData.categories ?? categories,
        settings: updatedData.settings ?? settings,
      };
      await AsyncStorage.setItem(STORE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error("Persistence Error:", e);
    }
  };

  // Helper selectors
  const cur = settings.currency || '₹';
  const fmt = (n) => cur + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const today = () => new Date().toISOString().slice(0, 10);
  const thisMonth = () => today().slice(0, 7);

  // Cashback Calculation Functions
  const effectiveRate = (card, mccId) => {
    if (!card) return 0;
    if (card.excluded?.includes(mccId)) return 0;
    return card.mccRates?.[mccId] ?? card.defaultRate ?? 0;
  };
  const entryRewards = (entry, customEntries = entries) => {
    const card = cards.find(x => x.id === entry.cardId);
    if (!card) return { type: 'Cashback', val: 0, points: 0, cash: 0 };
    const mcc = entry.mccGroup || 'other';
    const rate = effectiveRate(card, mcc);
    if (rate === 0) return { type: card.rewardType || 'Cashback', val: 0, points: 0, cash: 0 };
    
    if (entry.cbAmt != null && entry.cbAmt !== '') {
      const cash = parseFloat(entry.cbAmt) || 0;
      if (card.rewardType === 'Points') {
        const pts = Math.round(cash / (card.pointValue || 1.0));
        return { type: 'Points', val: pts, points: pts, cash: cash };
      }
      return { type: 'Cashback', val: cash, points: 0, cash: cash };
    }
    
    const rawPointsOrCash = Math.round(entry.amount * rate / 100 * 100) / 100;
    let earnedRaw = rawPointsOrCash;
    
    if (card.cap != null) {
      const month = entry.date.slice(0, 7);
      const already = customEntries.filter(e => e.id !== entry.id && e.cardId === card.id && e.date.startsWith(month))
        .reduce((s, e) => {
          const r = entryRewards({ ...e, cbAmt: null }, customEntries);
          return s + r.val;
        }, 0);
      earnedRaw = Math.max(0, Math.min(rawPointsOrCash, card.cap - already));
    }
    
    if (card.rewardType === 'Points') {
      const pts = Math.round(earnedRaw);
      const cash = Math.round(pts * (card.pointValue || 1.0) * 100) / 100;
      return { type: 'Points', val: pts, points: pts, cash: cash };
    } else {
      return { type: 'Cashback', val: earnedRaw, points: 0, cash: earnedRaw };
    }
  };
  const entryCashback = (entry, customEntries = entries) => {
    return entryRewards(entry, customEntries).cash;
  };
  const cappedCashback = (entry, customEntries = entries) => {
    return entryCashback(entry, customEntries);
  };
  const monthCashback = (month, customEntries = entries) => {
    return customEntries.filter(e => e.date.startsWith(month)).reduce((s, e) => s + entryCashback(e, customEntries), 0);
  };

  // Header values
  const currentMonthSpent = useMemo(() => {
    const m = thisMonth();
    return entries.filter(e => e.date.startsWith(m)).reduce((s, e) => s + e.amount, 0);
  }, [entries]);

  const currentMonthCashback = useMemo(() => {
    return monthCashback(thisMonth(), entries);
  }, [entries, cards]);

  const catById = (id) => categories.find(c => c.id === id) || categories[categories.length - 1];

  // Merchant Lookup Engine
  const lookupMerchantData = (vendor) => {
    if (!vendor) return null;
    const key = vendor.toLowerCase().trim();
    if (merchantDb[key]) return merchantDb[key];
    for (const k of Object.keys(merchantDb)) { if (key.includes(k) || k.includes(key)) return merchantDb[k]; }
    const builtInMcc = BUILT_IN_MERCHANT_MCC[key] || Object.entries(BUILT_IN_MERCHANT_MCC).find(([k]) => key.includes(k) || k.includes(key))?.[1];
    if (builtInMcc) return { mcc: builtInMcc, mccCode: null, custom: false };
    return null;
  };

  const lookupMerchantMcc = (vendor) => lookupMerchantData(vendor)?.mcc || null;

  // SMS SMS/email parsing engine
  const parseExpenseText = (text) => {
    const r = { amount: null, vendor: null, date: null, mode: null, last4: null };
    const ap = [
      /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
      /\$\s*([\d,]+(?:\.\d{1,2})?)/,
      /([\d,]+(?:\.\d{1,2})?)\s*(?:rs\.?|inr|₹)/i,
      /(?:debited by|credited by|spent|sent|transferred|transfer to|purchase of)\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i
    ];
    for (const p of ap) {
      const m = text.match(p);
      if (m) { r.amount = parseFloat(m[1].replace(/,/g, '')); break; }
    }

    const vp = [
      /transfer to\s+([A-Za-z0-9&._\-* ]{2,30}?)(?:\s+Ref|\s+on|\s+via|\.|,|$)/i,
      /Info:\s*([A-Za-z0-9&._\-* ]{2,30}?)(?:\. The available|\s+on|\s+via|\.|,|$)/i,
      /paid to\s+([A-Za-z0-9&._\-* ]{2,30}?)(?:\s+on|\s+via|\.|,|$)/i,
      /spent\s+(?:on|at)\s+([A-Za-z0-9&._\-* ]{2,30}?)(?:\s+using|\s+on|\s+via|\.|,|$)/i,
      /at\s+([A-Z][A-Za-z0-9&._\- ]{2,30}?)(?:\s+on|\s+via|\.|,|$)/,
      /to\s+([A-Z][A-Za-z0-9&._\- ]{2,30}?)(?:\s+on|\s+via|\.|,|$)/,
      /;\s*([A-Za-z0-9&._\- ]{2,30}?)\s+credited\b/i
    ];
    for (const p of vp) {
      const m = text.match(p);
      if (m) { r.vendor = m[1].trim(); break; }
    }

    const dm = text.match(/\b(\d{1,2}[-\/][A-Za-z]{3,9}[-\/]\d{2,4})\b/) || text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (dm) { const g = new Date(dm[1].replace(/-/g, ' ')); if (!isNaN(g)) r.date = g.toISOString().slice(0, 10); }
    if (!r.date) r.date = today();
    
    const lo = text.toLowerCase();
    if (/\bupi\b/.test(lo)) r.mode = 'upi';
    else if (/credit card/.test(lo)) r.mode = 'credit';
    else if (/debit card/.test(lo)) r.mode = 'debit';
    else if (/net\s*banking/.test(lo)) r.mode = 'netbanking';

    const l4 = text.match(/(?:ending|xx+|account|a\/c|card|x|\*+)\s*:?\s*(\d{4})\b/i) || text.match(/\b(?:\*|x){1,4}(\d{4})\b/i);
    if (l4) r.last4 = l4[1];

    const timePats = [
      /\bat\s+(\d{1,2}:\d{2}(?::\d{2})?)\s*(?:AM|PM|hrs|IST|HRS)?\b/i,
      /\b(\d{1,2}:\d{2})\s*(?:AM|PM)\b/i,
      /\b(\d{2}:\d{2}:\d{2})\b/,
    ];
    for (const p of timePats) {
      const m = text.match(p);
      if (m) {
        const parts = m[1].split(':');
        r.time = parts[0].padStart(2, '0') + ':' + parts[1];
        break;
      }
    }
    return r;
  };

  // Gmail Pull and Sync Process
  const syncGmail = async () => {
    if (!googleToken) { Alert.alert("Connect Gmail", "Go to Settings and connect your Google Account first."); return; }
    setIsSyncing(true);
    try {
      const days = settings.syncDays || 14;
      const q = encodeURIComponent(`(debited OR spent OR payment OR paid OR transaction) newer_than:${days}d`);
      const res = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages?q=${q}&maxResults=20`, {
        headers: { Authorization: `Bearer ${googleToken}` }
      });
      if (res.status === 401) {
        setGoogleToken(null);
        await AsyncStorage.removeItem('googleToken');
        Alert.alert("Session Expired", "Please re-connect your Google Account in settings.");
        return;
      }
      const data = await res.json();
      if (!data.messages?.length) { Alert.alert("Gmail Sync", "No recent payment alert emails found."); return; }
      
      const parsed = [];
      for (const msg of data.messages.slice(0, 15)) {
        const mr = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {
          headers: { Authorization: `Bearer ${googleToken}` }
        });
        const md = await mr.json();
        
        // Extract body base64 and walk email payload
        const extractEmailBody = (mPayload) => {
          function walk(part) {
            if (!part) return '';
            if (part.parts) return part.parts.map(walk).join(' ');
            if (part.body?.data) return base64Decode(part.body.data).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
            return '';
          }
          const subj = (mPayload.payload?.headers || []).find(h => h.name === 'Subject')?.value || '';
          return subj + ' ' + walk(mPayload.payload);
        };

        const body = extractEmailBody(md);
        const p = parseExpenseText(body); if (!p.amount) continue;
        
        const mcc = lookupMerchantMcc(p.vendor || '') || 'other';
        const cat = categories.find(c => c.mccGroups?.includes(mcc)) || categories[categories.length - 1];
        
        let matchedCardId = null;
        let matchedUpiId = null;
        let detectedMode = p.mode || 'upi';
        
        if (p.last4) {
          const matchedCard = cards.find(c => c.last4 === p.last4);
          if (matchedCard) {
            matchedCardId = matchedCard.id;
            detectedMode = matchedCard.type === 'Credit' ? 'credit' : 'debit';
          } else {
            const matchedUpi = upiAccounts.find(u => u.upiId?.includes(p.last4) || u.name?.includes(p.last4));
            if (matchedUpi) {
              matchedUpiId = matchedUpi.id;
              detectedMode = 'upi';
            }
          }
        }
        
        const dupe = entries.find(e => e.amount === p.amount && e.date === (p.date || today()) && (!p.vendor || e.vendor.toLowerCase() === p.vendor?.toLowerCase()));
        parsed.push({
          id: uid(),
          date: p.date || today(),
          time: p.time || '00:00',
          vendor: p.vendor || 'Unknown',
          amount: p.amount,
          category: cat.id,
          mccGroup: mcc,
          mccCode: null,
          paymentMode: detectedMode,
          cardId: matchedCardId,
          upiAccountId: matchedUpiId,
          upiBank: detectedMode === 'upi' ? p.bank || null : null,
          selected: !dupe,
          _dupe: !!dupe
        });
      }

      if (parsed.length === 0) { Alert.alert("Gmail Sync", "No transaction details could be extracted."); return; }
      setImportQueue(parsed);
      setIsImportModalVisible(true);
    } catch (e) {
      Alert.alert("Sync Error", e.message || "Connection to Gmail failed.");
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportSelected = () => {
    const toImport = importQueue.filter(item => item.selected);
    if (toImport.length === 0) { Alert.alert("Import", "No transactions selected"); return; }
    
    const formatted = toImport.map(e => ({
      id: e.id,
      amount: e.amount,
      vendor: e.vendor,
      date: e.date,
      time: e.time,
      category: e.category,
      subCatId: null,
      mccGroup: e.mccGroup,
      mccCode: null,
      paymentMode: e.paymentMode,
      cardId: e.cardId,
      upiAccountId: e.upiAccountId,
      upiBank: e.upiBank || null,
      instrLabel: null
    }));

    const updated = [...formatted, ...entries];
    setEntries(updated);
    persistState({ entries: updated });
    setIsImportModalVisible(false);
    setImportQueue([]);
    Alert.alert("Success", `${toImport.length} transaction(s) imported to ledger!`);
  };

  // ═══════════════════════════════════════════════
  // SUB-SCREENS RENDERS
  // ═══════════════════════════════════════════════

  // LEDGER TAB SCREEN
  const LedgerScreen = () => {
    const [amount, setAmount] = useState('');
    const [vendor, setVendor] = useState('');
    const [date, setDate] = useState(today());
    const [category, setCategory] = useState(categories[0]?.id || 'food');
    const [subCat, setSubCat] = useState('');
    const [paymentMode, setPaymentMode] = useState('upi');
    const [instrId, setInstrId] = useState('');
    const [upiBank, setUpiBank] = useState('');
    const [upiBankCustom, setUpiBankCustom] = useState('');
    const [instrText, setInstrText] = useState('');
    const [pasteText, setPasteText] = useState('');
    const [entryMode, setEntryMode] = useState('manual'); // 'manual', 'paste', 'sync', 'sms'
    const [detectedSmsTransactions, setDetectedSmsTransactions] = useState([]);
    const [isSmsSyncing, setIsSmsSyncing] = useState(false);

    const requestSmsPermission = async () => {
      if (Platform.OS !== 'android') return false;
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_SMS,
          {
            title: 'SMS Read Permission',
            message: 'The Ledger needs access to read your SMS to automatically parse transaction alerts.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    };

    const fetchSmsMessages = async (simulate = false) => {
      setIsSmsSyncing(true);
      setDetectedSmsTransactions([]);
      
      if (Platform.OS === 'ios' && !simulate) {
        Alert.alert(
          "iOS Privacy Constraint",
          "Apple restricts third-party apps from reading user SMS text messages due to sandboxing. Please use our 'Sync Gmail' or 'Paste & go' options!"
        );
        setIsSmsSyncing(false);
        return;
      }

      if (simulate) {
        setTimeout(() => {
          const mockSms = [
            { id: 'm1', body: "Dear Customer, your a/c **4321 is debited by Rs.1500.00 at ZOMATO on 05-Jul-26 via UPI. Ref No 61245.", date: "2026-07-05" },
            { id: 'm2', body: "Your SBI Card ending **1234 has been spent for Rs.4200.00 at AMAZON on 04-Jul-26.", date: "2026-07-04" },
            { id: 'm3', body: "Transaction Alert: Rs 250.00 debited from HDFC Bank a/c ending **5678 to SWIGGY on 06-Jul-26.", date: "2026-07-06" },
            { id: 'm4', body: "ICICI Bank Alert: Your Debit Card **9876 is debited for Rs 850.00 at McDonald's on 05-Jul-26.", date: "2026-07-05" }
          ];

          const parsed = mockSms.map(sms => {
            const p = parseExpenseText(sms.body);
            return {
              id: sms.id,
              body: sms.body,
              amount: p.amount,
              vendor: p.vendor,
              date: p.date,
              mode: p.mode,
              last4: p.last4,
              rawParsed: p
            };
          }).filter(item => item.amount !== null);

          setDetectedSmsTransactions(parsed);
          setIsSmsSyncing(false);
          Alert.alert("Simulator", "Loaded 4 simulated bank SMS alerts!");
        }, 1000);
        return;
      }

      try {
        const hasPermission = await requestSmsPermission();
        if (!hasPermission) {
          Alert.alert("Permission Denied", "Cannot read SMS without permission.");
          setIsSmsSyncing(false);
          return;
        }

        let SmsAndroid;
        try {
          SmsAndroid = require('react-native-get-sms-android');
        } catch (e) {
          SmsAndroid = null;
        }

        if (!SmsAndroid) {
          Alert.alert(
            "SMS Module Info",
            "Real SMS reading requires 'react-native-get-sms-android'. Tap 'Simulate SMS Alerts' to preview this feature on simulator!",
            [
              { text: "OK" },
              { text: "Simulate instead", onPress: () => fetchSmsMessages(true) }
            ]
          );
          setIsSmsSyncing(false);
          return;
        }

        const filter = {
          box: 'inbox',
          maxCount: 30,
        };

        SmsAndroid.list(
          JSON.stringify(filter),
          (fail) => {
            console.log("Failed to list SMS: " + fail);
            setIsSmsSyncing(false);
          },
          (count, smsList) => {
            const arr = JSON.parse(smsList);
            const parsed = arr.map(sms => {
              const p = parseExpenseText(sms.body);
              return {
                id: sms._id.toString(),
                body: sms.body,
                amount: p.amount,
                vendor: p.vendor,
                date: p.date,
                mode: p.mode,
                last4: p.last4,
                rawParsed: p
              };
            }).filter(item => item.amount !== null);

            setDetectedSmsTransactions(parsed);
            setIsSmsSyncing(false);
            Alert.alert("SMS Sync", `Fetched and parsed ${parsed.length} transactions from SMS!`);
          }
        );
      } catch (err) {
        console.warn(err);
        setIsSmsSyncing(false);
      }
    };

    const importSmsTransaction = (tx) => {
      let finalMode = tx.mode || 'upi';
      let finalInstr = '';
      
      if (tx.last4) {
        const matchedCard = cards.find(c => c.last4 === tx.last4);
        if (matchedCard) {
          finalInstr = matchedCard.id;
          finalMode = matchedCard.type === 'Credit' ? 'credit' : 'debit';
        } else {
          const matchedUpi = upiAccounts.find(u => u.upiId?.includes(tx.last4) || u.name?.includes(tx.last4));
          if (matchedUpi) { finalInstr = matchedUpi.id; finalMode = 'upi'; }
        }
      }

      let finalCategory = categories[0]?.id || 'food';
      const mData = lookupMerchantData(tx.vendor);
      let finalMcc = 'other';
      let finalMccCode = '';
      if (mData) {
        finalMcc = mData.mcc;
        finalMccCode = mData.mccCode || '';
        const matchedCat = categories.find(c => c.mccGroups?.includes(mData.mcc));
        if (matchedCat) finalCategory = matchedCat.id;
      }

      const newEntry = {
        id: uid(),
        amount: parseFloat(tx.amount),
        vendor: tx.vendor || 'Unknown Merchant',
        date: tx.date || today(),
        category: finalCategory,
        subcat: '',
        paymentMode: finalMode,
        instrumentId: finalInstr,
        upiBank: finalMode === 'upi' ? 'Other' : null,
        mccGroup: finalMcc,
        mccCode: finalMccCode,
        note: `Imported via SMS Alert`,
        time: new Date().toTimeString().slice(0, 5),
        cbAmt: null
      };

      setEntries(prev => [newEntry, ...prev]);
      setDetectedSmsTransactions(prev => prev.filter(t => t.id !== tx.id));
      Alert.alert("Imported", `Transaction of ${finalMode === 'upi' ? '₹' : '₹'}${tx.amount} at ${tx.vendor || 'Merchant'} saved successfully!`);
    };

    const [detectedTgTransactions, setDetectedTgTransactions] = useState([]);
    const [isTgSyncing, setIsTgSyncing] = useState(false);

    const fetchTelegramMessages = async (simulate = false) => {
      const token = settings.telegramBotToken || '';
      if (!token && !simulate) {
        Alert.alert(
          "Telegram Bot Config",
          "Please configure your Telegram Bot Token in the Settings tab first!"
        );
        setActiveTab('settings');
        return;
      }

      setIsTgSyncing(true);
      setDetectedTgTransactions([]);

      if (simulate) {
        setTimeout(() => {
          const mockAlerts = [
            { update_id: 20001, message: { text: "Alert: your a/c **4321 is debited by Rs.1250.00 at AMAZON on 06-Jul-26 via UPI." } },
            { update_id: 20002, message: { text: "HDFC Bank: Rs.3400.00 spent on Card ending **8899 at SWIGGY on 05-Jul-26." } }
          ];
          processTelegramUpdates(mockAlerts);
        }, 800);
        return;
      }

      try {
        let offset = '0';
        try {
          const savedOffset = await AsyncStorage.getItem('tg_offset');
          if (savedOffset) offset = savedOffset;
        } catch (e) {
          console.log(e);
        }

        let url = `https://api.telegram.org/bot${token}/getUpdates?timeout=10`;
        if (parseInt(offset) > 0) {
          url += `&offset=${offset}`;
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to connect to Telegram API');
        const data = await res.json();
        if (!data.ok) throw new Error(data.description || 'Error fetching telegram messages');
        
        const updates = (data.result || []).filter(u => u.message && u.message.text);
        if (updates.length > 0) {
          const highestId = Math.max(...updates.map(u => u.update_id));
          await AsyncStorage.setItem('tg_offset', String(highestId + 1));
        }
        processTelegramUpdates(updates);
      } catch (err) {
        console.error(err);
        Alert.alert("Telegram Error", err.message);
        setIsTgSyncing(false);
      }
    };

    const processTelegramUpdates = async (updates) => {
      setIsTgSyncing(false);
      
      let processedIds = [];
      try {
        const saved = await AsyncStorage.getItem('processedTgUpdates');
        if (saved) processedIds = JSON.parse(saved);
      } catch (e) {
        console.log(e);
      }
      
      const parsed = [];
      updates.forEach(u => {
        if (processedIds.includes(u.update_id)) return;
        
        const txt = u.message.text;
        const p = parseExpenseText(txt);
        if (p.amount) {
          parsed.push({
            id: String(u.update_id),
            update_id: u.update_id,
            body: txt,
            amount: p.amount,
            vendor: p.vendor || 'Merchant',
            date: p.date || today(),
            mode: p.mode || 'upi',
            last4: p.last4,
            raw: p
          });
        }
      });

      if (parsed.length === 0) {
        Alert.alert("Sync Info", "No new updates found in Telegram Bot!");
        return;
      }

      setDetectedTgTransactions(parsed);
      Alert.alert("Telegram Sync", `Fetched ${parsed.length} pending updates from bot!`);
    };

    const importTelegramTransaction = async (tx) => {
      let finalMode = tx.mode || 'upi';
      let finalInstr = '';
      
      if (tx.last4) {
        const matchedCard = cards.find(c => c.last4 === tx.last4);
        if (matchedCard) {
          finalInstr = matchedCard.id;
          finalMode = matchedCard.type === 'Credit' ? 'credit' : 'debit';
        } else {
          const matchedUpi = upiAccounts.find(u => u.upiId?.includes(tx.last4) || u.name?.includes(tx.last4));
          if (matchedUpi) { finalInstr = matchedUpi.id; finalMode = 'upi'; }
        }
      }

      let finalCategory = categories[0]?.id || 'food';
      const mData = lookupMerchantData(tx.vendor);
      let finalMcc = 'other';
      let finalMccCode = '';
      if (mData) {
        finalMcc = mData.mcc;
        finalMccCode = mData.mccCode || '';
        const matchedCat = categories.find(c => c.mccGroups?.includes(mData.mcc));
        if (matchedCat) finalCategory = matchedCat.id;
      }

      const newEntry = {
        id: uid(),
        amount: parseFloat(tx.amount),
        vendor: tx.vendor || 'Unknown Merchant',
        date: tx.date || today(),
        category: finalCategory,
        subcat: '',
        paymentMode: finalMode,
        instrumentId: finalInstr,
        upiBank: finalMode === 'upi' ? 'Other' : null,
        mccGroup: finalMcc,
        mccCode: finalMccCode,
        note: `Imported via Telegram Bot Syncer`,
        time: new Date().toTimeString().slice(0, 5),
        cbAmt: null
      };

      setEntries(prev => [newEntry, ...prev]);

      try {
        const saved = await AsyncStorage.getItem('processedTgUpdates');
        let processedIds = saved ? JSON.parse(saved) : [];
        processedIds.push(tx.update_id);
        await AsyncStorage.setItem('processedTgUpdates', JSON.stringify(processedIds));
      } catch (e) {
        console.log(e);
      }

      setDetectedTgTransactions(prev => prev.filter(t => t.id !== tx.id));
      Alert.alert("Imported", `Saved ₹${tx.amount} spent at ${tx.vendor}!`);
    };

    const handlePromptSplitTransaction = (entry) => {
      setSplitTargetEntry(entry);
      setSplitAmountText('');
      setSplitCategoryVal(entry.category);
      setSplitModalVisible(true);
    };

    const confirmMobileSplit = () => {
      if (!splitTargetEntry) return;
      const amt = parseFloat(splitAmountText);
      if (isNaN(amt) || amt <= 0) { Alert.alert("Error", "Enter a valid positive amount."); return; }
      if (amt >= splitTargetEntry.amount) { Alert.alert("Error", "Split amount must be less than the original transaction amount."); return; }

      // Adjust original transaction
      const updatedEntries = entries.map(item => {
        if (item.id === splitTargetEntry.id) {
          const newAmt = Math.round((item.amount - amt) * 100) / 100;
          const prevAmt = item.amount;
          let newCbAmt = item.cbAmt;
          if (item.cbPct != null) {
            newCbAmt = Math.round(newAmt * item.cbPct / 100 * 100) / 100;
          } else if (item.cbAmt != null) {
            newCbAmt = Math.round(item.cbAmt * (newAmt / prevAmt) * 100) / 100;
          }
          return { ...item, amount: newAmt, cbAmt: newCbAmt };
        }
        return item;
      });

      // Create new split transaction
      const splitEntry = {
        id: uid(),
        date: splitTargetEntry.date,
        time: splitTargetEntry.time || '00:00',
        source: splitTargetEntry.source || 'split',
        vendor: splitTargetEntry.vendor,
        amount: amt,
        category: splitCategoryVal,
        subCatId: null,
        mccGroup: splitTargetEntry.mccGroup || 'other',
        mccCode: splitTargetEntry.mccCode || null,
        paymentMode: splitTargetEntry.paymentMode,
        cardId: splitTargetEntry.cardId,
        upiAccountId: splitTargetEntry.upiAccountId,
        upiBank: splitTargetEntry.upiBank || null,
        instrLabel: splitTargetEntry.instrLabel || null
      };

      const finalEntries = [splitEntry, ...updatedEntries];
      setEntries(finalEntries);
      persistState({ entries: finalEntries });
      setSplitModalVisible(false);
      setSplitTargetEntry(null);
      Alert.alert("Success", "Transaction split successfully!");
    };

    const [mccGroup, setMccGroup] = useState('other');
    const [mccCode, setMccCode] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');

    // Dynamically filter instruments matching mode
    const currentInstruments = useMemo(() => {
      if (paymentMode === 'upi') return upiAccounts;
      if (paymentMode === 'credit') return cards.filter(c => c.type === 'Credit');
      if (paymentMode === 'debit') return cards.filter(c => c.type === 'Debit');
      return [];
    }, [paymentMode, upiAccounts, cards]);

    // Handle Vendor typing for MCC lookup
    const handleVendorChange = (text) => {
      setVendor(text);
      const mData = lookupMerchantData(text);
      if (mData) {
        setMccGroup(mData.mcc);
        setMccCode(mData.mccCode || '');
        const matchedCat = categories.find(c => c.mccGroups?.includes(mData.mcc));
        if (matchedCat) setCategory(matchedCat.id);
      } else {
        setMccGroup('other');
        setMccCode('');
      }
    };

    const handleParseSMS = () => {
      if (!pasteText.trim()) return;
      const p = parseExpenseText(pasteText);
      if (p.amount) setAmount(String(p.amount));
      if (p.vendor) handleVendorChange(p.vendor);
      if (p.date) setDate(p.date);
      if (p.mode) setPaymentMode(p.mode);
      if (p.last4) {
        const matchedCard = cards.find(c => c.last4 === p.last4);
        if (matchedCard) {
          setInstrId(matchedCard.id);
          setPaymentMode(matchedCard.type === 'Credit' ? 'credit' : 'debit');
        } else {
          const matchedUpi = upiAccounts.find(u => u.upiId?.includes(p.last4) || u.name?.includes(p.last4));
          if (matchedUpi) { setInstrId(matchedUpi.id); setPaymentMode('upi'); }
        }
      }
      if (p.bank) {
        const standardBanks = ['HDFC', 'ICICI', 'SBI', 'Axis', 'AMEX', 'RuPay'];
        if (standardBanks.includes(p.bank)) {
          setUpiBank(p.bank);
          setUpiBankCustom('');
        } else {
          setUpiBank('Other');
          setUpiBankCustom(p.bank);
        }
      }
      Alert.alert("SMS Parsing", "Fields auto-detected. Review and edit before saving!");
    };

    // Save Entry Handler
    const handleSaveEntry = () => {
      const amtNum = parseFloat(amount);
      if (isNaN(amtNum) || amtNum <= 0) { Alert.alert("Error", "Enter a valid amount"); return; }
      if (!vendor.trim()) { Alert.alert("Error", "Add a vendor or note"); return; }

      const finalUpiBank = paymentMode === 'upi' ? (upiBank === 'Other' ? (upiBankCustom.trim() || 'Other') : upiBank) : null;

      const newEntry = {
        id: uid(),
        amount: amtNum,
        vendor: vendor.trim(),
        date: date,
        time: new Date().toTimeString().slice(0, 5),
        category: category,
        subCatId: subCat || null,
        mccGroup: mccGroup,
        mccCode: mccCode || null,
        paymentMode: paymentMode,
        cardId: (paymentMode === 'credit' || paymentMode === 'debit') ? instrId : null,
        upiAccountId: paymentMode === 'upi' ? instrId : null,
        upiBank: finalUpiBank || null,
        instrLabel: paymentMode === 'netbanking' ? instrText : null,
      };

      const updated = [newEntry, ...entries];
      setEntries(updated);
      persistState({ entries: updated });

      // Reset
      setAmount('');
      setVendor('');
      setDate(today());
      setSubCat('');
      setInstrId('');
      setUpiBank('');
      setUpiBankCustom('');
      setInstrText('');
      setMccGroup('other');
      setMccCode('');
      setPasteText('');
      Alert.alert("Success", "Entry saved!");
    };

    // Filter transaction list
    const filteredEntries = useMemo(() => {
      return entries.filter(e => {
        const q = searchQuery.toLowerCase().trim();
        if (q && !e.vendor.toLowerCase().includes(q)) return false;
        if (filterCategory !== 'All' && e.category !== filterCategory) return false;
        return true;
      });
    }, [entries, searchQuery, filterCategory]);

    // Spending breakdown logic
    const breakdownData = useMemo(() => {
      const totals = {};
      filteredEntries.forEach(e => { totals[e.category] = (totals[e.category] || 0) + e.amount; });
      return totals;
    }, [filteredEntries]);

    return (
      <ScrollView style={{ flex: 1, padding: 14 }} keyboardShouldPersistTaps="handled">

        {/* Stats pills — Spent & Cashback, shown only in the Ledger tab */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          <View style={{
            flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            backgroundColor: c.card, borderWidth: 1, borderColor: c.line, borderRadius: 50,
            paddingHorizontal: 16, paddingVertical: 11
          }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: c.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5 }}>Spent</Text>
            <Text style={{ fontSize: 14, fontWeight: '800', color: c.red }}>{fmt(currentMonthSpent)}</Text>
          </View>
          <View style={{
            flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            backgroundColor: c.card, borderWidth: 1, borderColor: c.line, borderRadius: 50,
            paddingHorizontal: 16, paddingVertical: 11
          }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: c.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5 }}>Cashback</Text>
            <Text style={{ fontSize: 14, fontWeight: '800', color: c.brass }}>{fmt(currentMonthCashback)}</Text>
          </View>
        </View>

        {/* Manage Instruments quick pill */}
        <TouchableOpacity onPress={() => setActiveTab('cards')} style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          backgroundColor: c.card, borderWidth: 1, borderColor: c.line,
          borderRadius: 50, paddingHorizontal: 18, paddingVertical: 10,
          marginBottom: 14, alignSelf: 'flex-start'
        }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: c.inkMid }}>💳 Manage instruments</Text>
        </TouchableOpacity>

        {/* Entry Segment Button */}
        <View style={s.card(c)}>
          <View style={{ flexDirection: 'row', gap: 4, marginVertical: 4 }}>
            <TouchableOpacity onPress={() => setEntryMode('manual')} style={[
              { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 50, borderWidth: 1, borderColor: entryMode === 'manual' ? c.brass : c.line, backgroundColor: entryMode === 'manual' ? c.brass : 'transparent' }
            ]}>
              <Text style={{ color: entryMode === 'manual' ? '#FFFFFA' : c.inkMid, fontWeight: '700', fontSize: 10 }}>Manual</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEntryMode('paste')} style={[
              { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 50, borderWidth: 1, borderColor: entryMode === 'paste' ? c.brass : c.line, backgroundColor: entryMode === 'paste' ? c.brass : 'transparent' }
            ]}>
              <Text style={{ color: entryMode === 'paste' ? '#FFFFFA' : c.inkMid, fontWeight: '700', fontSize: 10 }}>Paste</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEntryMode('sync')} style={[
              { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 50, borderWidth: 1, borderColor: entryMode === 'sync' ? c.brass : c.line, backgroundColor: entryMode === 'sync' ? c.brass : 'transparent' }
            ]}>
              <Text style={{ color: entryMode === 'sync' ? '#FFFFFA' : c.inkMid, fontWeight: '700', fontSize: 10 }}>Gmail</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEntryMode('sms')} style={[
              { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 50, borderWidth: 1, borderColor: entryMode === 'sms' ? c.brass : c.line, backgroundColor: entryMode === 'sms' ? c.brass : 'transparent' }
            ]}>
              <Text style={{ color: entryMode === 'sms' ? '#FFFFFA' : c.inkMid, fontWeight: '700', fontSize: 10 }}>SMS</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEntryMode('telegram')} style={[
              { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 50, borderWidth: 1, borderColor: entryMode === 'telegram' ? c.brass : c.line, backgroundColor: entryMode === 'telegram' ? c.brass : 'transparent' }
            ]}>
              <Text style={{ color: entryMode === 'telegram' ? '#FFFFFA' : c.inkMid, fontWeight: '700', fontSize: 10 }}>Telegram</Text>
            </TouchableOpacity>
          </View>

          {entryMode === 'paste' ? (
            <View style={{ marginTop: 12 }}>
              <Text style={s.fieldLabel(c)}>PASTE SMS OR ALERT TEXT</Text>
              <TextInput
                style={[s.input(c), { minHeight: 70, textAlignVertical: 'top' }]}
                multiline
                placeholder="Rs.450.00 debited from a/c **1234 at SWIGGY via UPI..."
                placeholderTextColor={c.inkSoft}
                value={pasteText}
                onChangeText={setPasteText}
              />
              <TouchableOpacity onPress={handleParseSMS} style={[s.btn(c), { marginTop: 10, alignSelf: 'flex-start' }]}>
                <Text style={{ color: c.paper, fontWeight: '600' }}>Parse SMS</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {entryMode === 'sync' ? (
            <View style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ color: c.inkMid, fontWeight: '600', marginBottom: 10, textAlign: 'center', fontSize: 13 }}>
                {googleToken ? "✓ Authenticated with Google" : "❌ Disconnected from Google"}
              </Text>
              
              {isSyncing ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ActivityIndicator size="small" color={c.brass} />
                  <Text style={{ color: c.inkSoft }}>Fetching transaction emails...</Text>
                </View>
              ) : (
                <TouchableOpacity 
                  onPress={googleToken ? syncGmail : () => setActiveTab('settings')} 
                  style={[s.btn(c), { backgroundColor: c.brass, borderColor: c.brass, paddingHorizontal: 20 }]}
                >
                  <Text style={{ color: '#FFFFFA', fontWeight: '700' }}>
                    {googleToken ? "Sync Gmail Now" : "Configure Gmail in Settings"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          {entryMode === 'sms' ? (
            <View style={{ marginTop: 12, paddingVertical: 10 }}>
              <Text style={{ color: c.inkMid, fontWeight: '700', fontSize: 13, marginBottom: 8 }}>
                Native Message Syncer
              </Text>
              <Text style={{ color: c.inkSoft, fontSize: 11, marginBottom: 12, lineHeight: 16 }}>
                Fetch SMS alerts from HDFC, ICICI, SBI, Axis, etc. to detect card and bank transactions instantly.
              </Text>
              
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                <TouchableOpacity 
                  onPress={() => fetchSmsMessages(false)}
                  style={[s.btn(c), { flex: 1, backgroundColor: c.brass, borderColor: c.brass, paddingVertical: 12 }]}
                >
                  <Text style={{ color: '#FFFFFA', fontWeight: '700', fontSize: 12 }}>Connect Messages</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => fetchSmsMessages(true)}
                  style={[s.btn(c), { flex: 1, backgroundColor: 'transparent', borderColor: c.brass, paddingVertical: 12 }]}
                >
                  <Text style={{ color: c.brass, fontWeight: '700', fontSize: 12 }}>Simulate SMS</Text>
                </TouchableOpacity>
              </View>

              {isSmsSyncing ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', marginVertical: 16 }}>
                  <ActivityIndicator size="small" color={c.brass} />
                  <Text style={{ color: c.inkSoft }}>Fetching transaction logs...</Text>
                </View>
              ) : null}

              {!isSmsSyncing && detectedSmsTransactions.length > 0 ? (
                <View>
                  <Text style={{ color: c.inkSoft, fontWeight: '800', fontSize: 10.5, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                    Detected Transactions ({detectedSmsTransactions.length})
                  </Text>
                  <View style={{ gap: 8 }}>
                    {detectedSmsTransactions.map(tx => (
                      <View key={tx.id} style={{ padding: 12, backgroundColor: c.paper, borderWidth: 1, borderColor: c.line, borderRadius: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: c.ink }}>₹</Text>
                            <TextInput
                              keyboardType="numeric"
                              value={String(tx.amount)}
                              onChangeText={(val) => {
                                const amt = parseFloat(val) || 0;
                                setDetectedSmsTransactions(prev => prev.map(item => item.id === tx.id ? { ...item, amount: amt } : item));
                              }}
                              style={{ fontSize: 14, fontWeight: '800', color: c.ink, borderBottomWidth: 0.5, borderBottomColor: c.line, padding: 0, minWidth: 60, marginLeft: 2 }}
                            />
                          </View>
                          <TouchableOpacity 
                            onPress={() => importSmsTransaction(tx)}
                            style={{ backgroundColor: c.green, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50 }}
                          >
                            <Text style={{ color: '#FFFFFA', fontSize: 11, fontWeight: '800' }}>Import</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <TextInput 
                            value={tx.vendor}
                            onChangeText={(val) => {
                              setDetectedSmsTransactions(prev => prev.map(item => item.id === tx.id ? { ...item, vendor: val } : item));
                            }}
                            placeholder="Identify Merchant..."
                            placeholderTextColor={c.inkSoft}
                            style={{ fontSize: 12, fontWeight: '700', color: c.brass, padding: 0, margin: 0, minWidth: 100, borderBottomWidth: 0.5, borderBottomColor: c.line }}
                          />
                          <TextInput
                            value={tx.date}
                            onChangeText={(val) => {
                              setDetectedSmsTransactions(prev => prev.map(item => item.id === tx.id ? { ...item, date: val } : item));
                            }}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={c.inkSoft}
                            style={{ fontSize: 11, color: c.inkSoft, fontWeight: '600', padding: 0, margin: 0, width: 90, borderBottomWidth: 0.5, borderBottomColor: c.line, textAlign: 'right' }}
                          />
                        </View>
                        <Text style={{ fontSize: 10, color: c.inkSoft, fontStyle: 'italic', lineHeight: 14, borderTopWidth: 0.5, borderTopColor: c.line, paddingTop: 6 }}>
                          "{tx.body}"
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                !isSmsSyncing && (
                  <Text style={{ color: c.inkSoft, fontSize: 12, textAlign: 'center', fontStyle: 'italic', marginVertical: 14 }}>
                    No pending transactions detected. Click "Connect Messages" or "Simulate SMS" to fetch.
                  </Text>
                )
              )}
            </View>
          ) : null}

          {entryMode === 'telegram' ? (
            <View style={{ marginTop: 12, paddingVertical: 10 }}>
              <Text style={{ color: c.inkMid, fontWeight: '700', fontSize: 13, marginBottom: 8 }}>
                🤖 Telegram Bot Syncer
              </Text>
              <Text style={{ color: c.inkSoft, fontSize: 11, marginBottom: 12, lineHeight: 16 }}>
                iOS Workaround: Retrieves SMS transaction messages forwarded to your Telegram bot via Apple Automation Shortcuts.
              </Text>
              
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                <TouchableOpacity 
                  onPress={() => fetchTelegramMessages(false)}
                  style={[s.btn(c), { flex: 1, backgroundColor: c.brass, borderColor: c.brass, paddingVertical: 12 }]}
                >
                  <Text style={{ color: '#FFFFFA', fontWeight: '700', fontSize: 12 }}>Sync Telegram</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => fetchTelegramMessages(true)}
                  style={[s.btn(c), { flex: 1, backgroundColor: 'transparent', borderColor: c.brass, paddingVertical: 12 }]}
                >
                  <Text style={{ color: c.brass, fontWeight: '700', fontSize: 12 }}>Simulate Alert</Text>
                </TouchableOpacity>
              </View>

              {isTgSyncing ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', marginVertical: 16 }}>
                  <ActivityIndicator size="small" color={c.brass} />
                  <Text style={{ color: c.inkSoft }}>Checking bot updates...</Text>
                </View>
              ) : null}

              {!isTgSyncing && detectedTgTransactions.length > 0 ? (
                <View>
                  <Text style={{ color: c.inkSoft, fontWeight: '800', fontSize: 10.5, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                    Pending Updates ({detectedTgTransactions.length})
                  </Text>
                  <View style={{ gap: 8 }}>
                    {detectedTgTransactions.map(tx => (
                      <View key={tx.id} style={{ padding: 12, backgroundColor: c.paper, borderWidth: 1, borderColor: c.line, borderRadius: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: c.ink }}>₹</Text>
                            <TextInput
                              keyboardType="numeric"
                              value={String(tx.amount)}
                              onChangeText={(val) => {
                                const amt = parseFloat(val) || 0;
                                setDetectedTgTransactions(prev => prev.map(item => item.id === tx.id ? { ...item, amount: amt } : item));
                              }}
                              style={{ fontSize: 14, fontWeight: '800', color: c.ink, borderBottomWidth: 0.5, borderBottomColor: c.line, padding: 0, minWidth: 60, marginLeft: 2 }}
                            />
                          </View>
                          <TouchableOpacity 
                            onPress={() => importTelegramTransaction(tx)}
                            style={{ backgroundColor: c.green, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50 }}
                          >
                            <Text style={{ color: '#FFFFFA', fontSize: 11, fontWeight: '800' }}>Import</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <TextInput 
                            value={tx.vendor}
                            onChangeText={(val) => {
                              setDetectedTgTransactions(prev => prev.map(item => item.id === tx.id ? { ...item, vendor: val } : item));
                            }}
                            placeholder="Identify Merchant..."
                            placeholderTextColor={c.inkSoft}
                            style={{ fontSize: 12, fontWeight: '700', color: c.brass, padding: 0, margin: 0, minWidth: 100, borderBottomWidth: 0.5, borderBottomColor: c.line }}
                          />
                          <TextInput
                            value={tx.date}
                            onChangeText={(val) => {
                              setDetectedTgTransactions(prev => prev.map(item => item.id === tx.id ? { ...item, date: val } : item));
                            }}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={c.inkSoft}
                            style={{ fontSize: 11, color: c.inkSoft, fontWeight: '600', padding: 0, margin: 0, width: 90, borderBottomWidth: 0.5, borderBottomColor: c.line, textAlign: 'right' }}
                          />
                        </View>
                        <Text style={{ fontSize: 10, color: c.inkSoft, fontStyle: 'italic', lineHeight: 14, borderTopWidth: 0.5, borderTopColor: c.line, paddingTop: 6 }}>
                          "{tx.body}"
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                !isTgSyncing && (
                  <Text style={{ color: c.inkSoft, fontSize: 12, textAlign: 'center', fontStyle: 'italic', marginVertical: 14 }}>
                    No pending bot messages. Configure Bot Token in Settings to sync.
                  </Text>
                )
              )}
            </View>
          ) : null}

          {/* Core Fields (Always shown for editing/manual addition) */}
          {entryMode !== 'sync' && entryMode !== 'sms' && entryMode !== 'telegram' ? (
            <View style={{ marginTop: 12 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel(c)}>Amount</Text>
                  <TextInput
                    style={s.input(c)}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={c.inkSoft}
                    value={amount}
                    onChangeText={setAmount}
                  />
                </View>
                <View style={{ flex: 2 }}>
                  <Text style={s.fieldLabel(c)}>Vendor / Note</Text>
                  <TextInput
                    style={s.input(c)}
                    placeholder="e.g. Swiggy"
                    placeholderTextColor={c.inkSoft}
                    value={vendor}
                    onChangeText={handleVendorChange}
                  />
                </View>
              </View>

              <View style={{ marginTop: 10 }}>
                <Text style={s.fieldLabel(c)}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 6 }}>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => { setCategory(cat.id); setSubCat(''); }}
                      style={[s.badge(c), { backgroundColor: category === cat.id ? cat.color : c.paperRule }]}
                    >
                      <Text style={{ color: category === cat.id ? '#FFFFFA' : c.inkMid, fontSize: 12 }}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Subcategory */}
              {categories.find(x => x.id === category)?.subcats?.length ? (
                <View style={{ marginTop: 10 }}>
                  <Text style={s.fieldLabel(c)}>Subcategory (Optional)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => setSubCat('')}
                      style={[s.badge(c), { backgroundColor: !subCat ? c.brass : c.paperRule }]}
                    >
                      <Text style={{ color: !subCat ? '#FFFFFA' : c.inkMid, fontSize: 12 }}>General</Text>
                    </TouchableOpacity>
                    {categories.find(x => x.id === category).subcats.map(sub => (
                      <TouchableOpacity
                        key={sub.id}
                        onPress={() => setSubCat(sub.id)}
                        style={[s.badge(c), { backgroundColor: subCat === sub.id ? c.brass : c.paperRule }]}
                      >
                        <Text style={{ color: subCat === sub.id ? '#FFFFFA' : c.inkMid, fontSize: 12 }}>{sub.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {/* Mode selection */}
              <View style={{ marginTop: 12, flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel(c)}>Payment Mode</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 5 }}>
                    {['upi', 'credit', 'debit', 'cash', 'netbanking'].map(m => (
                      <TouchableOpacity
                        key={m}
                        onPress={() => { setPaymentMode(m); setInstrId(''); }}
                        style={[s.badge(c), { backgroundColor: paymentMode === m ? c.ink : c.paperRule }]}
                      >
                        <Text style={{ color: paymentMode === m ? c.paper : c.inkMid, fontSize: 11, textTransform: 'uppercase' }}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Dynamic Instrument selection */}
              {currentInstruments.length ? (
                <View style={{ marginTop: 10 }}>
                  <Text style={s.fieldLabel(c)}>Instrument Used</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 6 }}>
                    {currentInstruments.map(inst => (
                      <TouchableOpacity
                        key={inst.id}
                        onPress={() => setInstrId(inst.id)}
                        style={[s.badge(c), { backgroundColor: instrId === inst.id ? c.brass : c.paperRule }]}
                      >
                        <Text style={{ color: instrId === inst.id ? '#FFFFFA' : c.inkMid, fontSize: 12 }}>{inst.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {paymentMode === 'upi' ? (
                <View style={{ marginTop: 10 }}>
                  <Text style={s.fieldLabel(c)}>Bank Account Used</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 6, marginVertical: 2 }}>
                    {['HDFC', 'ICICI', 'SBI', 'Axis', 'AMEX', 'Other'].map(b => (
                      <TouchableOpacity
                        key={b}
                        onPress={() => setUpiBank(b)}
                        style={[s.badge(c), { backgroundColor: upiBank === b ? c.brass : c.paperRule }]}
                      >
                        <Text style={{ color: upiBank === b ? '#FFFFFA' : c.inkMid, fontSize: 12 }}>{b}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {upiBank === 'Other' ? (
                    <TextInput
                      style={[s.input(c), { marginTop: 6 }]}
                      placeholder="e.g. Kotak"
                      placeholderTextColor={c.inkSoft}
                      value={upiBankCustom}
                      onChangeText={setUpiBankCustom}
                    />
                  ) : null}
                </View>
              ) : null}

              {paymentMode === 'netbanking' ? (
                <View style={{ marginTop: 10 }}>
                  <Text style={s.fieldLabel(c)}>Bank Name</Text>
                  <TextInput
                    style={s.input(c)}
                    placeholder="e.g. HDFC Bank"
                    value={instrText}
                    onChangeText={setInstrText}
                  />
                </View>
              ) : null}

              {/* MCC Badge info */}
              {mccGroup !== 'other' ? (
                <View style={{ marginTop: 12, flexDirection: 'row' }}>
                  <View style={[s.badge(c), { borderColor: c.brass, borderWidth: 1, backgroundColor: c.brassBg }]}>
                    <Text style={{ color: c.inkMid, fontSize: 12 }}>📍 Detected MCC: {MCC_BY_ID[mccGroup]?.label || mccGroup}</Text>
                  </View>
                </View>
              ) : null}

              {/* Submit */}
              <TouchableOpacity onPress={handleSaveEntry} style={[s.btn(c), { marginTop: 15 }]}>
                <Text style={{ color: c.paper, fontWeight: '700' }}>Save Entry</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Category breakdown visual representation */}
        <Text style={s.sectionHeader(c)}>SPENDING BY CATEGORY</Text>
        <View style={s.card(c)}>
          {Object.keys(breakdownData).length === 0 ? (
            <Text style={{ fontStyle: 'italic', color: c.inkSoft, textAlign: 'center' }}>No ledger data available.</Text>
          ) : (
            categories.map(cat => {
              const total = breakdownData[cat.id] || 0;
              if (total === 0) return null;
              return (
                <View key={cat.id} style={{ marginVertical: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Text style={{ color: c.ink, fontSize: 13, fontWeight: '600' }}>{cat.name}</Text>
                    <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', color: c.ink, fontWeight: '600' }}>{fmt(total)}</Text>
                  </View>
                  <View style={[s.progressBarTrack(c)]}>
                    <View style={{ height: '100%', backgroundColor: cat.color, borderRadius: 3, width: `${Math.min(100, (total / currentMonthSpent) * 100)}%` }} />
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Recent Transactions List */}
        <Text style={s.sectionHeader(c)}>RECENT TRANSACTIONS</Text>
        {filteredEntries.length === 0 ? (
          <View style={s.card(c)}>
            <Text style={{ fontStyle: 'italic', color: c.inkSoft, textAlign: 'center' }}>No transactions found.</Text>
          </View>
        ) : (
          filteredEntries.map(e => {
            const cat = catById(e.category);
            let instrStr = '';
            if (e.cardId) {
              const card = cards.find(x => x.id === e.cardId);
              if (card) instrStr = `${card.bank ? card.bank + ' · ' : ''}${card.name}`;
            } else if (e.upiAccountId) {
              const upi = upiAccounts.find(x => x.id === e.upiAccountId);
              if (upi) instrStr = `${e.upiBank ? e.upiBank + ' · ' : ''}${upi.name}`;
            } else if (e.instrLabel) {
              instrStr = e.instrLabel;
            }
            return (
              <View key={e.id} style={[s.card(c), { marginVertical: 5, paddingVertical: 10 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 2 }}>
                    <Text style={{ fontWeight: '700', fontSize: 15, color: c.ink }}>{e.vendor}</Text>
                    <Text style={{ fontSize: 11, color: c.inkSoft, marginTop: 2 }}>{e.date} · {MODE_LABEL[e.paymentMode] || e.paymentMode}{instrStr ? ` · ${instrStr}` : ''}</Text>
                  </View>
                  <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: c.red }}>-{fmt(e.amount)}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cat?.color || '#999', marginRight: 4 }} />
                      <Text style={{ fontSize: 11, color: c.inkSoft }}>{cat?.name || e.category}</Text>
                    </View>
                    {(() => {
                      const rewards = entryRewards(e);
                      return rewards.cash > 0 ? (
                        <Text style={{ fontSize: 11, fontWeight: '700', color: c.brass, marginTop: 2 }}>
                          🪙 {rewards.type === 'Points' ? `${rewards.points} pts` : fmt(rewards.cash)}
                        </Text>
                      ) : null;
                    })()}
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        "Options",
                        "What would you like to do with this transaction?",
                        [
                          { text: "Cancel", style: "cancel" },
                          { text: "✂️ Split Transaction", onPress: () => handlePromptSplitTransaction(e) },
                          { text: "🗑️ Delete Transaction", style: "destructive", onPress: () => {
                            Alert.alert(
                              "Delete Entry",
                              `Delete expense of ${fmt(e.amount)} at ${e.vendor}?`,
                              [
                                { text: "Cancel", style: "cancel" },
                                { text: "Delete", style: "destructive", onPress: () => {
                                  const updated = entries.filter(x => x.id !== e.id);
                                  setEntries(updated);
                                  persistState({ entries: updated });
                                }}
                              ]
                            );
                          }}
                        ]
                      );
                    }}
                    style={{ marginLeft: 12, padding: 8 }}
                  >
                    <Text style={{ color: c.inkSoft, fontSize: 18, fontWeight: '700' }}>⋮</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  // INSTRUMENTS TAB SCREEN
  const InstrumentsScreen = () => {
    // UPI logic
    const [upiName, setUpiName] = useState('');
    const [upiAddress, setUpiAddress] = useState('');
    const [editingUpiIdState, setEditingUpiIdState] = useState(null);

    // Card logic
    const [cardBank, setCardBank] = useState('HDFC');
    const [cardBankCustom, setCardBankCustom] = useState('');
    const [cardName, setCardName] = useState('');
    const [cardLast4, setCardLast4] = useState('');
    const [cardNetwork, setCardNetwork] = useState('Visa');
    const [cardDefRate, setCardDefRate] = useState('1.0');
    const [cardCap, setCardCap] = useState('');
    const [cCardType, setCCardType] = useState('Credit');
    const [cardRewardType, setCardRewardType] = useState('Cashback');
    const [cardPointVal, setCardPointVal] = useState('1.00');
    const [editingCardIdState, setEditingCardIdState] = useState(null);

    const handleSaveUPI = () => {
      if (!upiName.trim()) { Alert.alert("Error", "Enter UPI App Name"); return; }
      let updated;
      if (editingUpiIdState) {
        updated = upiAccounts.map(u => u.id === editingUpiIdState ? { ...u, name: upiName, upiId: upiAddress } : u);
      } else {
        updated = [...upiAccounts, { id: uid(), name: upiName, upiId: upiAddress }];
      }
      setUpiAccounts(updated);
      persistState({ upiAccounts: updated });
      setUpiName(''); setUpiAddress(''); setEditingUpiIdState(null);
    };

    const handleSaveCard = () => {
      if (!cardName.trim()) { Alert.alert("Error", "Enter Card Name"); return; }
      const defRateNum = parseFloat(cardDefRate);
      if (isNaN(defRateNum)) { Alert.alert("Error", "Enter valid default rate"); return; }
      
      const bankToSave = cardBank === 'Other' ? (cardBankCustom.trim() || 'Other') : cardBank;
      const newCard = {
        id: editingCardIdState || uid(),
        bank: bankToSave,
        name: cardName.trim(),
        last4: cardLast4.trim() || null,
        network: cardNetwork,
        type: cCardType,
        defaultRate: defRateNum,
        cap: cardCap ? parseFloat(cardCap) : null,
        mccRates: {},
        excluded: [],
        rewardType: cardRewardType,
        pointValue: parseFloat(cardPointVal) || 1.00
      };

      let updated;
      if (editingCardIdState) {
        updated = cards.map(c => c.id === editingCardIdState ? newCard : c);
      } else {
        updated = [...cards, newCard];
      }
      setCards(updated);
      persistState({ cards: updated });

      // reset
      setCardBank('HDFC'); setCardBankCustom(''); setCardName(''); setCardLast4(''); setCardDefRate('1.0'); setCardCap(''); setEditingCardIdState(null);
      setCardRewardType('Cashback'); setCardPointVal('1.00');
      Alert.alert("Success", "Card configurations saved");
    };

    return (
      <ScrollView style={{ flex: 1, padding: 14 }}>
        {/* UPI List */}
        <Text style={s.sectionHeader(c)}>UPI ACCOUNTS</Text>
        <View style={s.card(c)}>
          {upiAccounts.map(u => (
            <View key={u.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.line }}>
              <View>
                <Text style={{ fontWeight: '700', color: c.ink }}>{u.name}</Text>
                {u.upiId ? <Text style={{ fontSize: 11, color: c.inkSoft, fontFamily: 'monospace' }}>{u.upiId}</Text> : null}
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity onPress={() => { setEditingUpiIdState(u.id); setUpiName(u.name); setUpiAddress(u.upiId || ''); }} style={s.icoBtn(c)}><Text style={{ color: c.inkMid }}>✎</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  const updated = upiAccounts.filter(x => x.id !== u.id);
                  setUpiAccounts(updated); persistState({ upiAccounts: updated });
                }} style={s.icoBtn(c)}><Text style={{ color: c.red }}>✕</Text></TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={{ marginTop: 12, gap: 10 }}>
            <TextInput style={s.input(c)} placeholder="Account/App Name (e.g. GPAY)" placeholderTextColor={c.inkSoft} value={upiName} onChangeText={setUpiName} />
            <TextInput style={s.input(c)} placeholder="UPI ID / VPA (Optional)" placeholderTextColor={c.inkSoft} value={upiAddress} onChangeText={setUpiAddress} />
            <TouchableOpacity onPress={handleSaveUPI} style={s.btn(c)}>
              <Text style={{ color: c.paper, fontWeight: '600' }}>{editingUpiIdState ? "Update UPI" : "Add UPI"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card config */}
        <Text style={s.sectionHeader(c)}>CREDIT &amp; DEBIT CARDS</Text>
        <View style={s.card(c)}>
          {cards.map(card => (
            <View key={card.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.line }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700', color: c.ink }}>{card.bank ? `${card.bank} · ` : ''}{card.name} ({card.type})</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity onPress={() => {
                    setEditingCardIdState(card.id);
                    const standardBanks = ['HDFC', 'ICICI', 'SBI', 'Axis', 'AMEX'];
                    if (standardBanks.includes(card.bank)) {
                      setCardBank(card.bank);
                      setCardBankCustom('');
                    } else {
                      setCardBank('Other');
                      setCardBankCustom(card.bank || '');
                    }
                    setCardName(card.name);
                    setCardLast4(card.last4 || '');
                    setCardNetwork(card.network);
                    setCardDefRate(String(card.defaultRate));
                    setCardCap(card.cap ? String(card.cap) : '');
                    setCCardType(card.type);
                    setCardRewardType(card.rewardType || 'Cashback');
                    setCardPointVal(card.pointValue ? String(card.pointValue) : '1.00');
                  }} style={s.icoBtn(c)}><Text style={{ color: c.inkMid }}>✎</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => {
                    const updated = cards.filter(x => x.id !== card.id);
                    setCards(updated); persistState({ cards: updated });
                  }} style={s.icoBtn(c)}><Text style={{ color: c.red }}>✕</Text></TouchableOpacity>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: c.inkSoft, marginTop: 2 }}>{card.network} · {card.last4 ? '••'+card.last4 : 'no digit'} · {card.defaultRate}% default rate {card.cap ? `· Cap ₹${card.cap}` : ''}</Text>
            </View>
          ))}

          <View style={{ marginTop: 14, gap: 10 }}>
            <Text style={{ fontWeight: '600', color: c.ink, fontSize: 13 }}>{editingCardIdState ? "Edit Card" : "New Card Setup"}</Text>
            
            {/* Bank Select Scroll Row */}
            <Text style={s.fieldLabel(c)}>Select Bank</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 6, marginVertical: 2 }}>
              {['HDFC', 'ICICI', 'SBI', 'Axis', 'AMEX', 'Other'].map(b => (
                <TouchableOpacity
                  key={b}
                  onPress={() => setCardBank(b)}
                  style={[s.badge(c), { backgroundColor: cardBank === b ? c.brass : c.paperRule }]}
                >
                  <Text style={{ color: cardBank === b ? '#FFFFFA' : c.inkMid, fontSize: 12 }}>{b}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Custom Bank Name Input */}
            {cardBank === 'Other' ? (
              <TextInput
                style={s.input(c)}
                placeholder="Enter custom bank name (e.g. Kotak)"
                placeholderTextColor={c.inkSoft}
                value={cardBankCustom}
                onChangeText={setCardBankCustom}
              />
            ) : null}

            {/* Quick-fill filtered templates row */}
            {CARD_TEMPLATES.filter(t => t.bank === cardBank).length > 0 ? (
              <View style={{ marginVertical: 4 }}>
                <Text style={s.fieldLabel(c)}>Quick-fill from template</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 6 }}>
                  {CARD_TEMPLATES.filter(t => t.bank === cardBank).map(t => (
                    <TouchableOpacity
                      key={t.name}
                      onPress={() => {
                        setCardName(t.name);
                        setCardNetwork(t.network);
                        setCardDefRate(String(t.defaultRate));
                        setCardCap(t.cap ? String(t.cap) : '');
                        setCCardType(t.type);
                        setCardRewardType(t.rewardType || 'Cashback');
                        setCardPointVal(t.pointValue ? String(t.pointValue) : '1.00');
                      }}
                      style={[s.badge(c), { backgroundColor: c.paperRule, paddingVertical: 5 }]}
                    >
                      <Text style={{ color: c.inkMid, fontSize: 11 }}>⚡ {t.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <Text style={s.fieldLabel(c)}>Card Name</Text>
            <TextInput style={s.input(c)} placeholder="Card Name (e.g. Regalia)" placeholderTextColor={c.inkSoft} value={cardName} onChangeText={setCardName} />
            
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel(c)}>Last 4 Digits</Text>
                <TextInput style={s.input(c)} maxLength={4} keyboardType="numeric" placeholder="1234" placeholderTextColor={c.inkSoft} value={cardLast4} onChangeText={setCardLast4} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel(c)}>Network</Text>
                <TextInput style={s.input(c)} placeholder="Visa / MasterCard" placeholderTextColor={c.inkSoft} value={cardNetwork} onChangeText={setCardNetwork} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel(c)}>Default Rate %</Text>
                <TextInput style={s.input(c)} keyboardType="numeric" placeholder="1.0" placeholderTextColor={c.inkSoft} value={cardDefRate} onChangeText={setCardDefRate} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel(c)}>Monthly Cap ₹</Text>
                <TextInput style={s.input(c)} keyboardType="numeric" placeholder="No cap" placeholderTextColor={c.inkSoft} value={cardCap} onChangeText={setCardCap} />
              </View>
            </View>

            <View style={{ marginTop: 6 }}>
              <Text style={s.fieldLabel(c)}>Card Type</Text>
              <View style={s.segRow}>
                <TouchableOpacity onPress={() => setCCardType('Credit')} style={[s.segBtn(c), cCardType === 'Credit' && s.segActive(c)]}>
                  <Text style={{ color: cCardType === 'Credit' ? c.paper : c.ink, fontWeight: '600' }}>Credit Card</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setCCardType('Debit')} style={[s.segBtn(c), cCardType === 'Debit' && s.segActive(c)]}>
                  <Text style={{ color: cCardType === 'Debit' ? c.paper : c.ink, fontWeight: '600' }}>Debit Card</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ marginTop: 6 }}>
              <Text style={s.fieldLabel(c)}>Reward Type</Text>
              <View style={s.segRow}>
                <TouchableOpacity onPress={() => setCardRewardType('Cashback')} style={[s.segBtn(c), cardRewardType === 'Cashback' && s.segActive(c)]}>
                  <Text style={{ color: cardRewardType === 'Cashback' ? c.paper : c.ink, fontWeight: '600' }}>Cashback</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setCardRewardType('Points')} style={[s.segBtn(c), cardRewardType === 'Points' && s.segActive(c)]}>
                  <Text style={{ color: cardRewardType === 'Points' ? c.paper : c.ink, fontWeight: '600' }}>Points</Text>
                </TouchableOpacity>
              </View>
            </View>

            {cardRewardType === 'Points' ? (
              <View style={{ marginTop: 6 }}>
                <Text style={s.fieldLabel(c)}>Point Value (INR) (e.g. 0.25)</Text>
                <TextInput style={s.input(c)} keyboardType="numeric" placeholder="0.25" placeholderTextColor={c.inkSoft} value={cardPointVal} onChangeText={setCardPointVal} />
              </View>
            ) : null}

            <TouchableOpacity onPress={handleSaveCard} style={[s.btn(c), { marginTop: 10 }]}>
              <Text style={{ color: c.paper, fontWeight: '700' }}>Save Card Configuration</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  // MERCHANTS TAB SCREEN
  const MerchantsScreen = () => {
    const [meName, setMeName] = useState('');
    const [meMcc, setMeMcc] = useState('dining');
    const [meCode, setMeCode] = useState('');

    const handleSaveMerchant = () => {
      const key = meName.toLowerCase().trim();
      if (!key) { Alert.alert("Error", "Enter merchant name"); return; }
      
      const updated = {
        ...merchantDb,
        [key]: { mcc: meMcc, mccCode: meCode.trim() || null, custom: true }
      };
      setMerchantDb(updated);
      persistState({ merchantDb: updated });
      setMeName(''); setMeCode('');
      Alert.alert("Success", "Merchant saved to database");
    };

    return (
      <ScrollView style={{ flex: 1, padding: 14 }}>
        <Text style={s.sectionHeader(c)}>ADD MERCHANT MAPPING</Text>
        <View style={s.card(c)}>
          <TextInput style={s.input(c)} placeholder="Merchant Name (e.g. Swiggy)" placeholderTextColor={c.inkSoft} value={meName} onChangeText={setMeName} />
          
          <Text style={[s.fieldLabel(c), { marginTop: 10 }]}>MCC Group</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 6, marginVertical: 6 }}>
            {MCC_GROUPS.map(g => (
              <TouchableOpacity
                key={g.id}
                onPress={() => setMeMcc(g.id)}
                style={[s.badge(c), { backgroundColor: meMcc === g.id ? c.brass : c.paperRule }]}
              >
                <Text style={{ color: meMcc === g.id ? '#FFFFFA' : c.inkMid, fontSize: 12 }}>{g.ico} {g.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TextInput style={[s.input(c), { marginTop: 10 }]} maxLength={4} keyboardType="numeric" placeholder="4-digit MCC Code (Optional)" placeholderTextColor={c.inkSoft} value={meCode} onChangeText={setMeCode} />
          
          <TouchableOpacity onPress={handleSaveMerchant} style={[s.btn(c), { marginTop: 15 }]}>
            <Text style={{ color: c.paper, fontWeight: '700' }}>Save Merchant Mapping</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.sectionHeader(c)}>MERCHANT DIRECTORY</Text>
        <View style={s.card(c)}>
          {Object.keys(merchantDb).length === 0 ? (
            <Text style={{ fontStyle: 'italic', color: c.inkSoft, textAlign: 'center' }}>No custom merchants added.</Text>
          ) : (
            Object.entries(merchantDb).map(([name, val]) => (
              <View key={name} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.line }}>
                <View>
                  <Text style={{ fontWeight: '700', textTransform: 'capitalize', color: c.ink }}>{name}</Text>
                  <Text style={{ fontSize: 11, color: c.inkSoft }}>{MCC_BY_ID[val.mcc]?.label} {val.mccCode ? `· MCC ${val.mccCode}` : ''}</Text>
                </View>
                <TouchableOpacity onPress={() => {
                  const updated = { ...merchantDb };
                  delete updated[name];
                  setMerchantDb(updated); persistState({ merchantDb: updated });
                }} style={s.icoBtn(c)}><Text style={{ color: c.red }}>✕</Text></TouchableOpacity>
              </View>
            ))
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  // CATEGORIES TAB SCREEN
  const CategoriesScreen = () => {
    const [catName, setCatName] = useState('');
    const [catColor, setCatColor] = useState('#4A708B');
    const [subName, setSubName] = useState('');
    const [targetCatForSub, setTargetCatForSub] = useState(categories[0]?.id || '');

    const handleAddCategory = () => {
      if (!catName.trim()) { Alert.alert("Error", "Enter Category Name"); return; }
      const newCat = {
        id: catName.toLowerCase().replace(/\s+/g, '_') + '_' + uid(),
        name: catName.trim(),
        color: catColor,
        mccGroups: ['other'],
        subcats: [],
        builtin: false
      };
      const updated = [...categories, newCat];
      setCategories(updated);
      persistState({ categories: updated });
      setCatName('');
      Alert.alert("Success", "Category added");
    };

    const handleAddSubcat = () => {
      if (!subName.trim()) { Alert.alert("Error", "Enter Subcategory Name"); return; }
      const updated = categories.map(cat => {
        if (cat.id === targetCatForSub) {
          const sub = cat.subcats || [];
          return { ...cat, subcats: [...sub, { id: cat.id + '_' + uid(), name: subName.trim() }] };
        }
        return cat;
      });
      setCategories(updated);
      persistState({ categories: updated });
      setSubName('');
      Alert.alert("Success", `Subcategory added to ${categories.find(x => x.id === targetCatForSub)?.name}`);
    };

    return (
      <ScrollView style={{ flex: 1, padding: 14 }}>
        <Text style={s.sectionHeader(c)}>SPENDING CATEGORIES</Text>
        <View style={s.card(c)}>
          {categories.map(cat => (
            <View key={cat.id} style={{ marginVertical: 8, paddingBottom: 8, borderBottomColor: c.line, borderBottomWidth: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: cat.color }} />
                  <Text style={{ fontWeight: '700', fontSize: 14, color: c.ink }}>{cat.name}</Text>
                </View>
                {!cat.builtin ? (
                  <TouchableOpacity onPress={() => {
                    const updated = categories.filter(x => x.id !== cat.id);
                    setCategories(updated); persistState({ categories: updated });
                  }} style={s.icoBtn(c)}><Text style={{ color: c.red }}>✕</Text></TouchableOpacity>
                ) : null}
              </View>

              {/* Subcategories list */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6, paddingLeft: 22 }}>
                {cat.subcats?.map(s => (
                  <View key={s.id} style={[s.badge(c), { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                    <Text style={{ fontSize: 11, color: c.inkMid }}>{s.name}</Text>
                    <TouchableOpacity onPress={() => {
                      const updated = categories.map(x => x.id === cat.id ? { ...x, subcats: x.subcats.filter(z => z.id !== s.id) } : x);
                      setCategories(updated); persistState({ categories: updated });
                    }}><Text style={{ color: c.red, fontSize: 10 }}>✕</Text></TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Add custom Category */}
        <Text style={s.sectionHeader(c)}>CREATE CUSTOM CATEGORY</Text>
        <View style={s.card(c)}>
          <TextInput style={s.input(c)} placeholder="Category Name (e.g. Fitness)" placeholderTextColor={c.inkSoft} value={catName} onChangeText={setCatName} />
          
          <Text style={[s.fieldLabel(c), { marginTop: 10 }]}>Hex Colour Code</Text>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <TextInput style={[s.input(c), { flex: 1 }]} placeholder="#4A708B" value={catColor} onChangeText={setCatColor} />
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: catColor.startsWith('#') ? catColor : '#999' }} />
          </View>

          <TouchableOpacity onPress={handleAddCategory} style={[s.btn(c), { marginTop: 15 }]}>
            <Text style={{ color: c.paper, fontWeight: '700' }}>Add Category</Text>
          </TouchableOpacity>
        </View>

        {/* Add Subcategory */}
        <Text style={s.sectionHeader(c)}>ADD SUBCATEGORY</Text>
        <View style={s.card(c)}>
          <Text style={s.fieldLabel(c)}>Parent Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 6, marginVertical: 6 }}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setTargetCatForSub(cat.id)}
                style={[s.badge(c), { backgroundColor: targetCatForSub === cat.id ? c.brass : c.paperRule }]}
              >
                <Text style={{ color: targetCatForSub === cat.id ? '#FFFFFA' : c.inkMid, fontSize: 12 }}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TextInput style={[s.input(c), { marginTop: 10 }]} placeholder="Subcategory Name (e.g. Gym)" placeholderTextColor={c.inkSoft} value={subName} onChangeText={setSubName} />
          
          <TouchableOpacity onPress={handleAddSubcat} style={[s.btn(c), { marginTop: 15 }]}>
            <Text style={{ color: c.paper, fontWeight: '700' }}>Add Subcategory</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  // SETTINGS TAB SCREEN
  const SettingsScreen = () => {
    const [tempCurrency, setTempCurrency] = useState(settings.currency || '₹');
    const [tempClientId, setTempClientId] = useState(settings.googleClientId || '');
    const [tempDays, setTempDays] = useState(String(settings.syncDays || 14));
    const [tempTgToken, setTempTgToken] = useState(settings.telegramBotToken || '');
    const [tempTgChatId, setTempTgChatId] = useState(settings.telegramChatId || '');
    const [manualToken, setManualToken] = useState('');
    const [tgSetupOs, setTgSetupOs] = useState('ios');

    const handleSaveSettings = () => {
      const updated = {
        ...settings,
        currency: tempCurrency,
        googleClientId: tempClientId,
        syncDays: parseInt(tempDays) || 14,
        telegramBotToken: tempTgToken,
        telegramChatId: tempTgChatId
      };
      setSettings(updated);
      persistState({ settings: updated });
      Alert.alert("Success", "Settings saved successfully!");
    };

    const handleConnectGmail = () => {
      if (!tempClientId.trim()) { Alert.alert("Error", "Please enter a Google Client ID first"); return; }
      
      const clientId = encodeURIComponent(tempClientId.trim());
      const scope = encodeURIComponent('https://www.googleapis.com/auth/gmail.readonly');
      
      // Redirect URI using standard Expo deep linking scheme
      const redirectUri = encodeURIComponent('exp://127.0.0.1:8081'); // Fallback for local Expo CLI
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}&prompt=select_account`;
      
      Linking.openURL(authUrl).catch(err => {
        Alert.alert("Browser Error", "Could not open authorization page.");
        console.error(err);
      });
    };

    const handleManualTokenSubmit = async () => {
      if (!manualToken.trim()) { Alert.alert("Error", "Please paste an access token first"); return; }
      const token = manualToken.trim();
      setGoogleToken(token);
      await AsyncStorage.setItem('googleToken', token);
      await AsyncStorage.setItem('googleTokenTime', String(Date.now()));
      setManualToken('');
      Alert.alert("Success", "Connected via manual token!");
    };

    const handleDisconnectGmail = async () => {
      setGoogleToken(null);
      await AsyncStorage.removeItem('googleToken');
      await AsyncStorage.removeItem('googleTokenTime');
      Alert.alert("Success", "Disconnected from Google.");
    };

    const handleClearData = () => {
      Alert.alert(
        "Clear All Data",
        "Are you absolutely sure you want to clear all entries, cards, and custom databases?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Clear Everything", style: "destructive", onPress: async () => {
            await AsyncStorage.removeItem(STORE_KEY);
            setEntries([]);
            setCards([]);
            setUpiAccounts(DEFAULT_UPI);
            setMerchantDb({});
            setCategories(DEFAULT_CATS);
            setSettings({ currency: '₹', googleClientId: '', syncDays: 14 });
            setGoogleToken(null);
            Alert.alert("Success", "All settings and data wiped!");
          }}
        ]
      );
    };

    return (
      <ScrollView style={{ flex: 1, padding: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity onPress={() => setActiveTab('ledger')} style={{
            backgroundColor: 'transparent', borderWidth: 1, borderColor: c.line, borderRadius: 50, paddingHorizontal: 16, paddingVertical: 8
          }}>
            <Text style={{ color: c.inkMid, fontWeight: '700', fontSize: 12 }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: '800', color: c.ink }}>Settings</Text>
          <View style={{ width: 60 }} />
        </View>
        
        <Text style={s.sectionHeader(c)}>📧 GMAIL SYNC SETTINGS</Text>
        <View style={s.card(c)}>
          <Text style={s.fieldLabel(c)}>Google Cloud Client ID</Text>
          <TextInput
            style={s.input(c)}
            placeholder="xxxx.apps.googleusercontent.com"
            placeholderTextColor={c.inkSoft}
            value={tempClientId}
            onChangeText={setTempClientId}
          />
          
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel(c)}>Sync Window (Days)</Text>
              <TextInput style={s.input(c)} keyboardType="numeric" value={tempDays} onChangeText={setTempDays} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel(c)}>Currency Symbol</Text>
              <TextInput style={s.input(c)} maxLength={3} value={tempCurrency} onChangeText={setTempCurrency} />
            </View>
          </View>

          <TouchableOpacity onPress={handleSaveSettings} style={[s.btn(c), { marginTop: 12 }]}>
            <Text style={{ color: c.paper, fontWeight: '600' }}>Save Configurations</Text>
          </TouchableOpacity>

          <View style={{ height: 1, backgroundColor: c.line, marginVertical: 14 }} />

          <Text style={s.fieldLabel(c)}>Connection Status</Text>
          <Text style={{ color: googleToken ? c.green : c.red, fontWeight: '700', marginBottom: 10, fontSize: 13 }}>
            {googleToken ? "✓ Connected to Google" : "❌ Disconnected"}
          </Text>

          {googleToken ? (
            <TouchableOpacity onPress={handleDisconnectGmail} style={[s.btn(c), { backgroundColor: c.red, borderColor: c.red }]}>
              <Text style={{ color: '#FFFFFA', fontWeight: '600' }}>Disconnect Google Account</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleConnectGmail} style={[s.btn(c), { backgroundColor: c.brass, borderColor: c.brass }]}>
              <Text style={{ color: '#FFFFFA', fontWeight: '600' }}>Connect Gmail API</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 1, backgroundColor: c.line, marginVertical: 14 }} />

          {/* Manual token input developer fallback */}
          <Text style={s.fieldLabel(c)}>Developer Token (Fallback)</Text>
          <Text style={{ color: c.inkSoft, fontSize: 11, marginBottom: 6 }}>Paste a Google Access Token directly to test instantly:</Text>
          <TextInput
            style={s.input(c)}
            secureTextEntry
            placeholder="ya29.a0AfB_..."
            placeholderTextColor={c.inkSoft}
            value={manualToken}
            onChangeText={setManualToken}
          />
          <TouchableOpacity onPress={handleManualTokenSubmit} style={[s.btn(c), { marginTop: 8, backgroundColor: c.inkMid, borderColor: c.inkMid }]}>
            <Text style={{ color: c.paper, fontWeight: '600' }}>Apply Manual Access Token</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.sectionHeader(c)}>🤖 TELEGRAM SYNC SETTINGS</Text>
        <View style={s.card(c)}>
          <Text style={{ color: c.inkSoft, fontSize: 12, marginBottom: 12, lineHeight: 16 }}>
            iOS Workaround: Forward SMS alerts from iOS Shortcut automations to your Telegram Bot. Configure Bot connection parameters below.
          </Text>

          <Text style={s.fieldLabel(c)}>Telegram Bot Token</Text>
          <TextInput
            style={s.input(c)}
            secureTextEntry
            placeholder="e.g. 123456789:ABCdefGh..."
            placeholderTextColor={c.inkSoft}
            value={tempTgToken}
            onChangeText={setTempTgToken}
          />

          <Text style={[s.fieldLabel(c), { marginTop: 10 }]}>Telegram Chat ID</Text>
          <TextInput
            style={s.input(c)}
            placeholder="e.g. 987654321"
            placeholderTextColor={c.inkSoft}
            value={tempTgChatId}
            onChangeText={setTempTgChatId}
          />

          <TouchableOpacity onPress={handleSaveSettings} style={[s.btn(c), { marginTop: 14, backgroundColor: c.brass, borderColor: c.brass }]}>
            <Text style={{ color: '#FFFFFA', fontWeight: '700' }}>Save Telegram bot settings</Text>
          </TouchableOpacity>

          <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 0.5, borderTopColor: c.line }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: c.brass, marginBottom: 8 }}>📋 SETUP GUIDE:</Text>
            
            {/* iOS / Android selector buttons */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
              <TouchableOpacity
                onPress={() => setTgSetupOs('ios')}
                style={{
                  flex: 1,
                  paddingVertical: 6,
                  alignItems: 'center',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: tgSetupOs === 'ios' ? c.brass : c.line,
                  backgroundColor: tgSetupOs === 'ios' ? c.brass : 'transparent'
                }}
              >
                <Text style={{ color: tgSetupOs === 'ios' ? '#FFFFFA' : c.inkMid, fontWeight: '700', fontSize: 10.5 }}>📱 iOS Shortcut</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTgSetupOs('android')}
                style={{
                  flex: 1,
                  paddingVertical: 6,
                  alignItems: 'center',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: tgSetupOs === 'android' ? c.brass : c.line,
                  backgroundColor: tgSetupOs === 'android' ? c.brass : 'transparent'
                }}
              >
                <Text style={{ color: tgSetupOs === 'android' ? '#FFFFFA' : c.inkMid, fontWeight: '700', fontSize: 10.5 }}>🤖 Android App</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 11, fontWeight: '700', color: c.ink, marginBottom: 2 }}>1. Create Bot & Chat ID:</Text>
            <Text style={{ fontSize: 10, color: c.inkSoft, marginBottom: 8, lineHeight: 14 }}>
              • Search @BotFather on Telegram, send /newbot, and copy the HTTP Token.{"\n"}
              • Search @userinfobot to get your numeric Chat ID.{"\n"}
              • IMPORTANT: Send a message to your new bot (click Start) so it can contact you.
            </Text>

            {tgSetupOs === 'ios' ? (
              <View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: c.ink, marginBottom: 2 }}>2. iOS Shortcut Setup (Reliable POST Method):</Text>
                <Text style={{ fontSize: 10, color: c.inkSoft, lineHeight: 14 }}>
                  • Open Shortcuts app → Automation tab → Create Personal Automation.{"\n"}
                  • Choose Message trigger (Sender: Anyone, Contains: "debited" or "spent", Run Immediately).{"\n"}
                  • Add Action: URL (paste URL: https://api.telegram.org/bot[TOKEN]/sendMessage).{"\n"}
                  • Add Action: Get Contents of URL (Method: POST, Headers: Content-Type = application/json, Body: JSON, Add field 'chat_id' (Text, paste Chat ID) and field 'text' (Text, select Shortcut Input -> Message -> Body).
                </Text>
              </View>
            ) : (
              <View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: c.ink, marginBottom: 2 }}>2. Android Auto-Forwarder App:</Text>
                <Text style={{ fontSize: 10, color: c.inkSoft, lineHeight: 14 }}>
                  • Install a free SMS forwarding app from Google Play Store (e.g. "SMS to Telegram" by LanRen).{"\n"}
                  • Open the app, select Telegram Bot as destination.{"\n"}
                  • Paste your Bot Token and Chat ID from Step 1.{"\n"}
                  • Set up text filters containing words like "spent", "debited", "spent on Card", "Rs.", "₹", "INR".{"\n"}
                  • Enable service and SMS permission. Incoming alerts will now auto-sync!
                </Text>
              </View>
            )}
          </View>
        </View>

        <Text style={s.sectionHeader(c)}>DANGER ZONE</Text>
        <View style={s.card(c)}>
          <Text style={{ color: c.inkSoft, fontSize: 12, marginBottom: 12 }}>This action deletes all transactions, customized credit cards, UPI connections, and merchant mappings permanently.</Text>
          <TouchableOpacity onPress={handleClearData} style={[s.btn(c), { backgroundColor: c.red, borderColor: c.red }]}>
            <Text style={{ color: '#FFFFFA', fontWeight: '700' }}>Wipe All Data</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.paper, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={c.paper} />
      
      {/* Brand Header */}
      <View style={[s.pageHead(c), { paddingHorizontal: 14, paddingBottom: 10 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={[s.brandTitle(c)]}>The Ledger</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <Text style={{ fontSize: 11, color: c.inkSoft, fontStyle: 'italic' }}>track what goes out</Text>
              <Switch value={isDarkMode} onValueChange={setIsDarkMode} style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }} trackColor={{ false: c.line, true: c.brass }} thumbColor={isDarkMode ? c.paper : c.inkSoft} />
            </View>
          </View>
          
          {/* Top Accounts Option widget with settings inside */}
          <TouchableOpacity onPress={() => setActiveTab('settings')} style={{
            flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderWidth: 1, borderColor: c.line, borderRadius: 50, paddingHorizontal: 12, paddingVertical: 6, gap: 4
          }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: c.inkMid }}>💳 Accounts</Text>
            <Text style={{ fontSize: 13, marginLeft: 2 }}>⚙️</Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* Screen Views Render */}
      <View style={{ flex: 1 }}>
        {activeTab === 'ledger' ? <LedgerScreen /> : null}
        {activeTab === 'cards' ? <InstrumentsScreen /> : null}
        {activeTab === 'merchants' ? <MerchantsScreen /> : null}
        {activeTab === 'categories' ? <CategoriesScreen /> : null}
        {activeTab === 'settings' ? <SettingsScreen /> : null}
      </View>

      {/* Custom Bottom Tab bar navigation */}
      <View style={s.tabBar(c)}>
        <TouchableOpacity onPress={() => setActiveTab('ledger')} style={s.tabBtn}>
          <Text style={{ fontSize: 19 }}>📒</Text>
          <Text style={[s.tabBtnText(c), activeTab === 'ledger' && { fontWeight: '700', color: c.ink }]}>Ledger</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setActiveTab('cards')} style={s.tabBtn}>
          <Text style={{ fontSize: 19 }}>💳</Text>
          <Text style={[s.tabBtnText(c), activeTab === 'cards' && { fontWeight: '700', color: c.ink }]}>Instruments</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setActiveTab('merchants')} style={s.tabBtn}>
          <Text style={{ fontSize: 19 }}>🏪</Text>
          <Text style={[s.tabBtnText(c), activeTab === 'merchants' && { fontWeight: '700', color: c.ink }]}>Merchants</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setActiveTab('categories')} style={s.tabBtn}>
          <Text style={{ fontSize: 19 }}>🏷️</Text>
          <Text style={[s.tabBtnText(c), activeTab === 'categories' && { fontWeight: '700', color: c.ink }]}>Categories</Text>
        </TouchableOpacity>

      </View>

      {/* Gmail Import Modal Dialog */}
      <Modal visible={isImportModalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalSheet(c)}>
            <View style={s.modalHead(c)}>
              <Text style={{ fontWeight: '700', fontSize: 16, color: c.ink }}>Review Detected Expenses</Text>
              <TouchableOpacity onPress={() => { setIsImportModalVisible(false); setImportQueue([]); }}><Text style={{ color: c.inkSoft, fontSize: 18 }}>✕</Text></TouchableOpacity>
            </View>
            
            <ScrollView style={{ flex: 1, padding: 14 }}>
              {importQueue.map((item, idx) => {
                const itemCat = catById(item.category);
                return (
                  <TouchableOpacity 
                    key={item.id} 
                    onPress={() => {
                      const updated = [...importQueue];
                      updated[idx].selected = !updated[idx].selected;
                      setImportQueue(updated);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.line }}
                  >
                    <View style={[s.checkbox(c), item.selected && s.checkboxChecked(c)]}>
                      {item.selected ? <Text style={{ color: '#FFFFFA', fontSize: 10 }}>✓</Text> : null}
                    </View>
                    <View style={{ flex: 1, paddingLeft: 10 }}>
                      <Text style={{ fontWeight: '700', fontSize: 14, color: c.ink }}>{item.vendor}</Text>
                      <Text style={{ fontSize: 11, color: c.inkSoft, marginTop: 2 }}>{item.date} · {MCC_BY_ID[item.mccGroup]?.ico} {itemCat?.name}</Text>
                      {item._dupe ? <Text style={{ color: c.red, fontSize: 10, marginTop: 1, fontWeight: '600' }}>⚠️ Possible Duplicate</Text> : null}
                    </View>
                    <Text style={{ fontWeight: '700', color: c.red, fontSize: 14 }}>-{fmt(item.amount)}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={s.modalFoot(c)}>
              <Text style={{ fontSize: 12, color: c.inkSoft }}>
                {importQueue.filter(item => item.selected).length} selected of {importQueue.length}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={() => { setIsImportModalVisible(false); setImportQueue([]); }} style={s.badge(c)}><Text style={{ color: c.inkMid, paddingVertical: 4 }}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleImportSelected} style={[s.btn(c), { backgroundColor: c.brass, borderColor: c.brass }]}><Text style={{ color: '#FFFFFA', fontWeight: '600' }}>Import Selected</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Transaction Split Modal Dialog */}
      <Modal visible={splitModalVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.modalSheet(c), { maxHeight: 380, marginHorizontal: 20, borderRadius: 16 }]}>
            <View style={s.modalHead(c)}>
              <Text style={{ fontWeight: '700', fontSize: 16, color: c.ink }}>Split Transaction</Text>
              <TouchableOpacity onPress={() => setSplitModalVisible(false)}><Text style={{ color: c.inkSoft, fontSize: 18 }}>✕</Text></TouchableOpacity>
            </View>
            
            <View style={{ padding: 16, gap: 14 }}>
              {splitTargetEntry ? (
                <Text style={{ fontSize: 12, color: c.inkSoft, lineHeight: 16 }}>
                  Splitting expense at <Text style={{ fontWeight: '700', color: c.ink }}>{splitTargetEntry.vendor}</Text> ({fmt(splitTargetEntry.amount)})
                </Text>
              ) : null}

              <View>
                <Text style={s.fieldLabel(c)}>Amount to Split Off</Text>
                <TextInput
                  style={s.input(c)}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                  placeholderTextColor={c.inkSoft}
                  value={splitAmountText}
                  onChangeText={setSplitAmountText}
                />
              </View>

              <View>
                <Text style={s.fieldLabel(c)}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 6, marginVertical: 4 }}>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setSplitCategoryVal(cat.id)}
                      style={[s.badge(c), { backgroundColor: splitCategoryVal === cat.id ? cat.color : c.paperRule }]}
                    >
                      <Text style={{ color: splitCategoryVal === cat.id ? '#FFFFFA' : c.inkMid, fontSize: 12 }}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity onPress={confirmMobileSplit} style={[s.btn(c), { backgroundColor: c.brass, borderColor: c.brass, marginTop: 10 }]}>
                <Text style={{ color: '#FFFFFA', fontWeight: '700', textAlign: 'center' }}>Confirm Split</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════
// FLEXBOX STYLES
// ═══════════════════════════════════════════════
const s = {
  pageHead: (c) => ({
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: c.ink,
  }),
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  brandTitle: (c) => ({
    fontSize: 27,
    fontWeight: '700',
    color: c.ink,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  }),
  headerSpent: (c) => ({
    fontSize: 20,
    fontWeight: '600',
    color: c.red,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginTop: 2
  }),
  ruleBrass: (c) => ({
    height: 2,
    backgroundColor: c.brass,
    marginTop: 8,
  }),
  card: (c) => ({
    backgroundColor: c.card,
    borderColor: c.line,
    borderWidth: 1,
    borderRadius: 6,
    padding: 14,
    marginTop: 12,
  }),
  segRow: {
    flexDirection: 'row',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#20291D',
    overflow: 'hidden',
  },
  segBtn: (c) => ({
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    backgroundColor: c.card,
  }),
  segActive: (c) => ({
    backgroundColor: c.ink,
  }),
  fieldLabel: (c) => ({
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: c.inkSoft,
    marginBottom: 4,
    fontWeight: '600',
  }),
  input: (c) => ({
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: 4,
    padding: 9,
    fontSize: 14,
    color: c.ink,
    backgroundColor: c.paper,
  }),
  badge: (c) => ({
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: c.paperRule,
    alignSelf: 'center',
    marginRight: 6,
  }),
  btn: (c) => ({
    backgroundColor: c.ink,
    borderColor: c.ink,
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  }),
  icoBtn: (c) => ({
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: 3,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  }),
  sectionHeader: (c) => ({
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 10,
    letterSpacing: 1,
    color: c.inkSoft,
    textTransform: 'uppercase',
    marginTop: 22,
  }),
  progressBarTrack: (c) => ({
    height: 8,
    backgroundColor: c.paperRule,
    borderRadius: 4,
    overflow: 'hidden',
  }),
  tabBar: (c) => ({
    height: 60,
    backgroundColor: c.card,
    borderTopWidth: 1,
    borderTopColor: c.line,
    flexDirection: 'row',
    paddingBottom: Platform.OS === 'ios' ? 12 : 2,
  }),
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnText: (c) => ({
    fontSize: 10,
    color: c.inkSoft,
    marginTop: 2,
  }),
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18,22,17,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: (c) => ({
    backgroundColor: c.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    borderTopWidth: 2,
    borderTopColor: c.ink,
  }),
  modalHead: (c) => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: c.line,
  }),
  modalFoot: (c) => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: c.line,
  }),
  checkbox: (c) => ({
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: c.inkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  }),
  checkboxChecked: (c) => ({
    backgroundColor: c.ink,
    borderColor: c.ink,
  })
};
