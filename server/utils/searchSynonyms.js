// config/searchSynonyms.js
// FINAL 2025 INDIAN B2B MASTER COMMON NAME / SYNONYM LIST
// 500+ REAL BUYER TERMS — NO SKIPPING — COVERS EVERYTHING

const COMMON_SEARCH_TERMS = {
  // 1. PHARMACEUTICALS & MEDICINES
  tablet: ['tablet', 'tablets', 'tab', 'medicine', 'medicines', 'pill', 'capsule', 'cap', 'strip', 'tablet medicine', 'dawa', 'goli'],
  syrup: ['syrup', 'liquid', 'suspension', 'cough syrup', 'tonic', 'oral solution', 'liquid medicine', 'kadha', 'sharbat'],
  injection: ['injection', 'inj', 'injectable', 'vial', 'ampoule', 'inj medicine', 'saline', 'drip'],
  cream: ['cream', 'ointment', 'gel', 'lotion', 'skin cream', 'face cream', 'moisturizer', 'fairness cream', 'pain relief'],
  'eye drops': ['eye drop', 'eye drops', 'eye medicine', 'ophthalmic', 'eye ointment', 'itone', 'aankh ki dawa'],
  capsule: ['capsule', 'cap', 'softgel', 'hardgel', 'soft gelatin'],
  powder: ['powder', 'churna', 'protein powder', 'health powder', 'ayurvedic churna'],

  // 2. FMCG & DAILY ESSENTIALS
  soap: ['soap', 'bath soap', 'handwash', 'washing soap', 'detergent bar', 'beauty soap', 'toilet soap', 'medimix', 'dettol soap', 'santoor', 'lifebuoy', 'lux'],
  shampoo: ['shampoo', 'hair shampoo', 'anti dandruff', 'conditioner', 'hair oil shampoo', 'clinic plus', 'head & shoulders'],
  toothpaste: ['toothpaste', 'paste', 'dant manjan', 'oral care', 'colgate', 'sensodyne', 'pepsodent', 'closeup', 'dabur red'],
  oil: ['oil', 'hair oil', 'cooking oil', 'edible oil', 'mustard oil', 'coconut oil', 'groundnut oil', 'sunflower oil', 'refined oil', 'fortune', 'saffola', 'patanjali oil'],
  detergent: ['detergent', 'surf', 'rin', 'ariel', 'tide', 'washing powder', 'detergent cake', 'ghari', 'nirma', 'wheel'],
  biscuit: ['biscuit', 'parle', 'marie gold', 'glucose biscuit', 'cookies', 'britannia', 'sunfeast', 'oreo'],
  namkeen: ['namkeen', 'haldiram', 'bhujia', 'sev', 'mixture', 'aloo bhujia', 'bikaneri bhujia', 'chakli'],
  tea: ['tea', 'chai', 'tata tea', 'brooke bond', 'red label', 'taj mahal', 'wagh bakri', 'lipton', 'dust tea', 'ctc tea'],
  milk: ['milk', 'dairy milk', 'amul', 'mother dairy', 'cow milk', 'buffalo milk', 'toned milk', 'full cream'],

  // 3. FOOD & AGRICULTURE
  rice: ['rice', 'basmati', 'chawal', 'non basmati', 'sona masoori', 'parboiled rice', 'idli rice', 'ponni rice', '1121 basmati', 'pusa basmati'],
  dal: ['dal', 'pulse', 'arhar dal', 'toor dal', 'moong dal', 'chana dal', 'masoor dal', 'urad dal', 'rajma', 'kabuli chana'],
  atta: ['atta', 'wheat flour', 'chakki atta', 'whole wheat', 'maida', 'flour', 'ashirvaad', 'aashirvaad', 'pillsbury', 'bansi'],
  sugar: ['sugar', 'chini', 'desi sugar', 'bura', 'mishri', 'khandsari'],
  spices: ['spices', 'masala', 'garam masala', 'haldi', 'mirchi', 'dhaniya', 'jeera', 'everest', 'mdh', 'badshah', 'turmeric powder', 'red chilli'],
  ghee: ['ghee', 'desi ghee', 'pure ghee', 'amul ghee', 'patanjali ghee'],

  // 4. ELECTRONICS & ELECTRICAL
  mobile: ['mobile', 'phone', 'smartphone', 'android phone', 'iphone', 'samsung', 'oneplus', 'vivo', 'oppo', 'realme', 'redmi', 'poco'],
  led: ['led', 'bulb', 'light', 'tube light', 'panel light', 'street light', 'flood light', 'led tv', 'syska', 'philips', 'wipro', 'havells'],
  fan: ['fan', 'ceiling fan', 'table fan', 'pedestal fan', 'wall fan', 'exhaust fan', 'usha', 'crompton', 'havells', 'bajaj'],
  charger: ['charger', 'mobile charger', 'fast charger', 'adapter', 'power bank', 'mi charger', 'samsung charger'],
  inverter: ['inverter', 'battery', 'luminous', 'exide', 'microtek', 'ups', 'sine wave inverter'],
  wire: ['wire', 'finolex wire', 'polycab', 'havells wire', 'electrical wire', 'cable'],
  switch: ['switch', 'anchor', 'legrand', 'modular switch', 'socket', 'switch board', 'roma', 'pankaj'],

  // 5. BUILDING & CONSTRUCTION
  cement: ['cement', 'opc', 'ppc', 'acc cement', 'ultratech', 'amuja', 'birla cement', 'jk cement', 'bangur'],
  steel: ['steel', 'tmt bar', 'saria', 'iron rod', 'jindal steel', 'tata tiscon', 'sail', 'vizag steel', '500d', '550d'],
  paint: ['paint', 'asian paint', 'berger', 'nerolac', 'distemper', 'emulsion', 'wall paint', 'apex', 'tractor emulsion'],
  tiles: ['tiles', 'floor tiles', 'ceramic tiles', 'vitrified tiles', 'porcelain tiles', 'marble', 'kajaria', 'somany', 'johnson'],
  bricks: ['bricks', 'eeta', 'red brick', 'fly ash brick', 'aac block', 'cement brick'],
  sand: ['sand', 'river sand', 'm sand', 'construction sand', 'plaster sand'],
  plywood: ['plywood', 'ply', 'century ply', 'greenply', 'laminate', 'block board', 'marine ply', 'waterproof ply'],
  pipe: ['pipe', 'pvc pipe', 'gi pipe', 'cpvc', 'upvc', 'astral', 'finolex', 'supreme', 'prince'],

  // 6. HARDWARE & TOOLS
  lock: ['lock', 'godrej lock', 'door lock', 'main door lock', 'padlock', 'harrison', 'link lock'],
  nutbolt: ['nut bolt', 'fastener', 'bolt', 'screw', 'washer', 'allen bolt', 'hex bolt'],
  hinge: ['hinge', 'door hinge', 'bearing hinge', 'l hinge', 'tower bolt'],
  handle: ['handle', 'door handle', 'aldrop', 'latch', 'mortise handle'],

  // 7. TEXTILES & GARMENTS
  shirt: ['shirt', 'mens shirt', 'formal shirt', 'casual shirt', 'cotton shirt', 'peter england', 'van heusen'],
  saree: ['saree', 'silk saree', 'banarasi', 'kanjivaram', 'cotton saree', 'chiffon', 'georgette'],
  kurti: ['kurti', 'ladies kurti', 'cotton kurti', 'anarkali', 'chikan kurti', 'biba', 'w'],
  jeans: ['jeans', 'mens jeans', 'denim', 'levis', 'wrangler', 'killer', 'spykar'],
  tshirt: ['tshirt', 'polo tshirt', 'round neck', 'printed tshirt', 'cotton tshirt'],

  // 8. SERVICES & REAL ESTATE
  'real estate': ['real estate', 'property', 'flat', 'house', 'plot', 'land', 'builder', 'construction', 'broker', 'realtor', 'apartment', 'villa', '2bhk', '3bhk'],
  plumber: ['plumber', 'plumbing', 'pipe fitting', 'sanitary', 'bathroom fitting', 'water tank', 'motor repair'],
  electrician: ['electrician', 'electrical work', 'wiring', 'mcb', 'switch', 'inverter wiring', 'fan repair'],
  carpenter: ['carpenter', 'wood work', 'furniture', 'sofa repair', 'door repair', 'almirah', 'bed making'],
  painter: ['painter', 'wall painting', 'house painting', 'distemper', 'asian paint', 'polish'],

  // 9. MACHINERY & INDUSTRIAL
  generator: ['generator', 'dg set', 'kirloskar', 'silent generator', 'diesel generator', 'cummins', 'mahindra powerol'],
  pump: ['pump', 'submersible pump', 'kirloskar pump', 'crompton pump', 'water pump', 'jet pump'],
  tractor: ['tractor', 'mahindra', 'sonalika', 'swaraj', 'farmtrac', 'massey ferguson', 'john deere'],
  'sewing machine': ['sewing machine', 'usi', 'juki', 'stitching machine', 'industrial sewing', 'overlock', 'picco'],

  // 10. PACKAGING & PLASTIC
  'plastic bag': ['plastic bag', 'poly bag', 'carry bag', 'shopping bag', 'hm bag', 'ld bag'],
  box: ['box', 'carton box', 'corrugated box', 'packaging box', '3 ply', '5 ply', '7 ply'],
  bottle: ['bottle', 'pet bottle', 'plastic bottle', 'water bottle', 'jar', 'container'],

  // 11. OTHERS
  stationery: ['stationery', 'pen', 'notebook', 'classmate', 'luxor', 'apsara', 'natraj pencil'],
  furniture: ['furniture', 'sofa', 'bed', 'chair', 'table', 'wooden furniture', 'office chair', 'dining table'],
  helmet: ['helmet', 'safety helmet', 'bike helmet', 'studds', 'steelbird', 'vega'],
  bag: ['bag', 'school bag', 'laptop bag', 'travel bag', 'american tourister', 'skybags', 'vip'],
  footwear: ['footwear', 'shoes', 'chappal', 'slipper', 'bata', 'paragon', 'liberty'],
  solar: ['solar', 'solar panel', 'solar inverter', 'solar water heater', 'lofin', 'tata power solar'],
  battery: ['battery', 'car battery', 'inverter battery', 'exide', 'amaron', 'luminous', 'livguard'],
  laptop: ['laptop', 'dell', 'hp', 'lenovo', 'acer', 'asus'],
  ac: ['ac', 'air conditioner', 'split ac', 'window ac', 'voltas', 'lg', 'daikin', '1 ton', '1.5 ton'],
};

// REVERSE MAP: "medicine" → "tablet", "chawal" → "rice", "saria" → "steel"
const REVERSE_MAP = {};
Object.entries(COMMON_SEARCH_TERMS).forEach(([key, synonyms]) => {
  synonyms.forEach(syn => {
    REVERSE_MAP[syn.toLowerCase()] = key;
  });
  REVERSE_MAP[key.toLowerCase()] = key;
});

const getExpandedTerms = (input) => {
  const lower = input.toLowerCase().trim();
  if (!lower || lower.length < 2) return [lower];

  const result = new Set([lower]);

  // Direct match
  if (REVERSE_MAP[lower]) {
    const mainKey = REVERSE_MAP[lower];
    result.add(mainKey);
    COMMON_SEARCH_TERMS[mainKey]?.forEach(s => result.add(s.toLowerCase()));
  }

  // Partial match fallback
  Object.keys(COMMON_SEARCH_TERMS).forEach(key => {
    if (lower.includes(key) || key.includes(lower)) {
      result.add(key);
      COMMON_SEARCH_TERMS[key].forEach(s => result.add(s.toLowerCase()));
    }
  });

  return [...result].filter(t => t.length >= 2);
};

module.exports = { getExpandedTerms, COMMON_SEARCH_TERMS };