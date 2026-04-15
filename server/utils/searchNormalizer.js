
const normalizeSearchTerm = (term) => {
  if (!term || typeof term !== 'string') return [];
  const t = term.trim();
  if (t.length < 2) return [];

  const variants = new Set();

  // Helper to add variant and its transformations
  const add = (str) => {
    if (!str || str.length < 2) return;
    variants.add(str);
    variants.add(str.toLowerCase());
    variants.add(str.toUpperCase());
    variants.add(str.replace(/\s+/g, ''));     // realestate
    variants.add(str.replace(/\s+/g, '-'));   // real-estate
    variants.add(str.replace(/\s+/g, '_'));   // real_estate
  };

  // 1. Original + basic
  add(t);
  add(t.replace(/[^a-zA-Z0-9\s-_]/g, '')); // remove symbols

  // 2. Convert spaces ↔ hyphens ↔ underscores
  const cleaned = t.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, ' ').trim();
  add(cleaned);
  add(cleaned.replace(/\s+/g, '-'));
  add(cleaned.replace(/\s+/g, '_'));
  add(cleaned.replace(/\s+/g, ''));

  // 3. Reverse word order
  const words = cleaned.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    add(words.reverse().join(' '));
    add(words.reverse().join('-'));
    add(words.reverse().join('_'));
  }

  // 4. Common Indian typos & shortcuts
  const typoMap = {
    ril: 'real',
    estat: 'estate',
    servis: 'service',
    servce: 'service',
    manufatur: 'manufacturer',
    manufac: 'manufacturer',
    wholesal: 'wholesale',
    deler: 'dealer',
    suplir: 'supplier',
    supllier: 'supplier',
    bulder: 'builder',
    constructn: 'construction',
    intr: 'interior',
    decorat: 'decoration',
    electrcl: 'electrical',
    electrn: 'electronic',
  };

  let fuzzy = cleaned.toLowerCase();
  Object.entries(typoMap).forEach(([wrong, correct]) => {
    fuzzy = fuzzy.replace(new RegExp(wrong, 'g'), correct);
  });

  if (fuzzy !== cleaned.toLowerCase()) {
    add(fuzzy);
    add(fuzzy.replace(/\s+/g, '-'));
  }

  return [...variants].filter(v => v.length >= 2);
};

module.exports = { normalizeSearchTerm };