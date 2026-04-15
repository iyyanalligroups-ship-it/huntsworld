const COMPANY_SYNONYMS = {
  // 1. MANUFACTURER / FACTORY
  manufacturer: [
    'manufacturer', 'manufacturers', 'manufacturing', 'factory', 'factory wala',
    'company', 'mill', 'unit', 'production unit', 'fabrication', 'plant',
    'banane wala', 'banata hai', 'banane ki company', 'producer',
    'original manufacturer', 'direct factory', 'factory rate', 'factory price',
    'factory se', 'factory direct', 'factory outlet', 'factory supply'
  ],

  // 2. SUPPLIER
  supplier: [
    'supplier', 'suppliers', 'supply', 'supply karne wala', 'supply karta hai',
    'wholesaler supplier', 'stockist', 'vendor', 'distributor supplier',
    'material supplier', 'raw material supplier', 'bulk supplier', 'direct supplier',
    'supplier chahiye', 'supplier wanted', 'supply milega'
  ],

  // 3. WHOLESALER
  wholesaler: [
    'wholesaler', 'wholesale', 'wholesale wala', 'wholesale rate',
    'bada dukaan', 'bazaar wala', 'mandi wala', 'bulk seller',
    'wholesale market', 'wholesale price', 'wholesale ka rate',
    'wholesale dukaan', 'wholesale shop', 'bazaar rate'
  ],

  // 4. DISTRIBUTOR / STOCKIST
  distributor: [
    'distributor', 'distributors', 'distributorship', 'dealer distributor',
    'stockist', 'c&f', 'cfa', 'super stockist', 'area distributor',
    'district distributor', 'distributor chahiye', 'distributorship available',
    'stock point', 'main distributor', 'authorized distributor'
  ],

  // 5. DEALER / RETAILER
  dealer: [
    'dealer', 'dealers', 'retailer', 'shop', 'dukaan', 'store',
    'near me', 'local dealer', 'city dealer', 'showroom', 'shop wala',
    'retail shop', 'counter', 'outlet', 'franchise', 'franchisee',
    'dealership', 'authorized dealer', 'main dealer', 'retail outlet'
  ],

  // 6. TRADER / MERCHANT
  trader: [
    'trader', 'trading', 'merchant', 'exporter trader', 'importer trader',
    'buy sell', 'buying selling', 'trade', 'business', 'vyapaari',
    'trading company', 'merchant exporter', 'buying house'
  ],

  // 7. EXPORTER
  exporter: [
    'exporter', 'export', 'export house', 'international supplier',
    'overseas supplier', 'foreign buyer', 'export quality', 'export company',
    'export karne wala', 'export ka maal', 'export grade'
  ],

  // 8. IMPORTER
  importer: [
    'importer', 'import', 'imported goods', 'china goods', 'dubai goods',
    'foreign goods', 'import karne wala', 'import company',
    'china se', 'dubai se', 'imported maal', 'foreign brand'
  ],

  // 9. SERVICE PROVIDER
  'service provider': [
    'service provider', 'service', 'services', 'karigar', 'mistri',
    'contractor', 'agency', 'consultant', 'service center',
    'repairing', 'maintenance', 'installation', 'fitter', 'technician',
    'service wala', 'kaam karne wala', 'repair', 'fitting'
  ],

  // 10. LOCAL SHOPS & SERVICES (MOST IMPORTANT FOR BASE MEMBER)
  grocery: [
    'grocery', 'kirana', 'kirana store', 'general store', 'provision store',
    'dukaan', 'mart', 'daily needs', 'ration', 'grahasti', 'saman', 'kirana dukaan',
    'general provision', 'chai', 'biscuit', 'namkeen', 'dal', 'chawal', 'atta'
  ],

  medical: [
    'medical', 'medicine', 'dawa', 'dawai', 'chemist', 'pharmacy', 'drug store',
    'medical store', 'dawa dukaan', 'tablet', 'syrup', 'injection', 'capsule',
    'aankh ki dawa', 'itone', 'clinic', 'doctor', 'health', 'dawai wala'
  ],

  farmer: [
    'farmer', 'kisan', 'krishi', 'kheti', 'kheti badi', 'agriculture', 'agri',
    'crop', 'wheat', 'rice', 'beej', 'seed', 'fertilizer', 'khad', 'tractor',
    'pump', 'kisan bhai', 'gaon', 'khet', 'fasal'
  ],

  plumber: [
    'plumber', 'plumbing', 'pipe fitter', 'sanitary', 'bathroom fitter',
    'mistri', 'plumber service', 'water line', 'tap', 'pipe', 'fitting',
    'sanitary work', 'bathroom work', 'plumber mistri', 'nal wala'
  ],

  electrician: [
    'electrician', 'bijli wala', 'electric work', 'wiring', 'fan repair',
    'mcbb fitting', 'electric mistri', 'bijli ka kaam', 'light fitting',
    'switch board', 'inverter wiring', 'electrical contractor'
  ],

  carpenter: [
    'carpenter', 'badhai', 'wood work', 'furniture maker', 'door maker',
    'wooden work', 'carpentry', 'furniture contractor', 'lakdi ka kaam'
  ],

  painter: [
    'painter', 'painting', 'wall painting', 'house painting', 'distemper',
    'asian paint wala', 'painting contractor', 'paint work', 'color wala'
  ],

  'real estate': [
    'real estate', 'property dealer', 'builder', 'construction company',
    'flat seller', 'plot dealer', 'broker', 'realtor', 'makaan bechne wala',
    'ghar bechne wala', 'property consultant', 'flat', 'plot', 'house for sale'
  ],

  'packers movers': [
    'packers and movers', 'shifting', 'relocation', 'home shifting',
    'office shifting', 'transport', 'lorry', 'truck booking', 'ghar badalna'
  ],

  'web developer': [
    'website banane wala', 'web developer', 'app developer', 'software company',
    'it company', 'digital marketing', 'website design', 'app banane wala'
  ],

  // 11. COMMON BUYER INTENT WORDS
  'dukaan': ['dukaan', 'shop', 'store', 'outlet', 'showroom', 'dukan'],
  'factory': ['factory', 'mill', 'unit', 'plant', 'production', 'factory se'],
  'company': ['company', 'firm', 'pvt ltd', 'private limited', 'limited company', 'co'],
  'brand': ['brand', 'branded', 'company ka maal', 'original brand', 'asli brand'],
  'rate': ['rate', 'price', 'kimat', 'daam', 'quotation', 'quote', 'ka rate'],
  'near me': ['near me', 'mere area mein', 'local', 'city mein', 'pass mein', 'paas mein'],
  'chahiye': ['chahiye', 'wanted', 'required', 'need', 'jarurat hai', 'lena hai'],
  'mil jaayega': ['mil jaayega', 'available', 'milega', 'supply hoga', 'mil jayega'],
  'best price': ['best price', 'sasta', 'kam rate', 'lowest price', 'best rate'],
  'wholesale': ['wholesale', 'bazaar rate', 'mandi rate', 'bulk rate'],
  'direct': ['direct', 'factory se', 'direct supplier', 'direct dealer']
};

// REVERSE MAP
const COMPANY_REVERSE_MAP = {};
Object.entries(COMPANY_SYNONYMS).forEach(([key, synonyms]) => {
  synonyms.forEach(term => {
    COMPANY_REVERSE_MAP[term.toLowerCase()] = key;
  });
  COMPANY_REVERSE_MAP[key.toLowerCase()] = key;
});

const getCompanyExpandedTerms = (input) => {
  const lower = input.toLowerCase().trim();
  if (!lower || lower.length < 2) return [lower];

  const result = new Set([lower]);

  // Direct match
  if (COMPANY_REVERSE_MAP[lower]) {
    const mainKey = COMPANY_REVERSE_MAP[lower];
    result.add(mainKey);
    COMPANY_SYNONYMS[mainKey]?.forEach(s => result.add(s.toLowerCase()));
  }

  // Partial / fuzzy match
  Object.keys(COMPANY_SYNONYMS).forEach(key => {
    const keywords = COMPANY_SYNONYMS[key];
    if (keywords.some(kw => lower.includes(kw) || kw.includes(lower))) {
      result.add(key);
      keywords.forEach(s => result.add(s.toLowerCase()));
    }
  });

  return [...result].filter(t => t.length >= 2);
};

module.exports = { 
  getCompanyExpandedTerms, 
  COMPANY_SYNONYMS,
  COMPANY_REVERSE_MAP 
};