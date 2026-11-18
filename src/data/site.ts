// MOCK DATA — demo placeholders. Replace every value with real details
// before launch: product names, prices, email and social handles are invented.
export const site = {
  name: 'AURA',
  tagline: 'Crafted for Focus. Designed for Life.',
  url: 'https://auraaudioo.pages.dev',
  description:
    'AURA is a premium audio brand — over-ear headphones, wireless earbuds, smartwatch, portable speaker and charging dock. Crafted for focus, designed for life.',
  year: 2026,
};

export const FREE_SHIPPING_THRESHOLD = 150;

export const contact = {
  email: 'hello@aura.audio',
  hours: 'Mon–Sat, 10am–7pm IST',
  location: 'Mumbai, India · Shipping worldwide',
};

export const socials = [
  { label: 'X', href: 'https://x.com/aura_audio' },
  { label: 'Instagram', href: 'https://instagram.com/aura.audio' },
  { label: 'YouTube', href: 'https://youtube.com/@auraaudio' },
];

export const announcements = [
  'Free shipping on orders over $150',
  '30-day easy returns, no questions asked',
  '2-year warranty on every product',
];

export const nav = [
  { label: 'Shop', href: '/products/' },
  { label: 'Technology', href: '/technology/' },
  { label: 'Story', href: '/story/' },
  { label: 'Journal', href: '/journal/' },
  { label: 'Support', href: '/support/' },
];

export const features = [
  {
    num: '01',
    id: 'performance',
    title: 'Engineered for\nPure Performance.',
    body: 'Every detail is precisely crafted to deliver exceptional sound, comfort, and clarity.',
    img: 'earcup-closeup',
    alt: 'Macro close-up of the AURA headphone earcup — brushed aluminium, mesh fabric and USB-C port',
    ratio: 'aspect-[3/2]',
  },
  {
    num: '02',
    id: 'technology',
    title: 'Technology That\nElevates Every Moment.',
    body: 'Advanced acoustic architecture for immersive sound and intelligent noise control.',
    img: 'exploded-view',
    alt: 'Exploded view of the AURA headphones — driver, magnet, circuit board and earcup shells',
    ratio: 'aspect-[16/10]',
  },
  {
    num: '03',
    id: 'design',
    title: 'Minimal Design.\nMaximum Impact.',
    body: 'A timeless silhouette that fits seamlessly into your life and your world.',
    img: 'lifestyle-desk',
    alt: 'AURA headphones resting on a light desk next to their fabric carrying case',
    ratio: 'aspect-[3/2]',
  },
];

export type Category = 'Headphones' | 'Earbuds' | 'Wearables' | 'Speakers' | 'Accessories';

export interface Product {
  slug: string;
  name: string;
  tagline: string;
  price: number;
  compareAt?: number;
  category: Category;
  rating: number;
  reviewsCount: number;
  badge?: 'New' | 'Bestseller';
  colors: string[];
  stock: string;
  lowStock?: boolean;
  inBox: string[];
  specs: { driver: string; battery: string; anc: string; bluetooth: string; weight: string; charging: string };
  gallery: string[];
  img: string;
  alt: string;
  description: string;
  features: string[];
}

export const categories: Category[] = ['Headphones', 'Earbuds', 'Wearables', 'Speakers', 'Accessories'];

export const products: Product[] = [
  {
    slug: 'aura-one',
    name: 'AURA One',
    tagline: 'Our flagship over-ear headphones.',
    price: 349,
    compareAt: 399,
    category: 'Headphones',
    rating: 4.9,
    reviewsCount: 214,
    badge: 'Bestseller',
    colors: ['Silver', 'Charcoal'],
    stock: 'In stock — ships within 1 business day',
    inBox: ['AURA One headphones', 'Fabric travel case', 'USB-C charging cable (1.5 m)', '3.5 mm audio cable', 'Quick start guide'],
    specs: {
      driver: '40 mm beryllium',
      battery: '60 hours (ANC on)',
      anc: 'Adaptive ANC, −42 dB',
      bluetooth: '5.4 · multipoint',
      weight: '248 g',
      charging: 'USB-C · 10 min = 5 h',
    },
    gallery: ['hero-headphones', 'earcup-closeup', 'exploded-view', 'lifestyle-desk'],
    img: 'hero-headphones',
    alt: 'Silver AURA One over-ear headphones',
    description:
      'The flagship. Beryllium drivers, adaptive noise cancelling and memory-foam earcups tuned for long listening sessions — from the first call of the day to the last track of the night.',
    features: [
      '40 mm beryllium drivers for detailed, distortion-free sound',
      'Adaptive ANC that adjusts to your surroundings 200 times a second',
      '60-hour battery life, with 5 hours from a 10-minute charge',
      'Multipoint Bluetooth — stay connected to laptop and phone at once',
      'Memory-foam earcups wrapped in breathable acoustic mesh',
    ],
  },
  {
    slug: 'aura-buds',
    name: 'Wireless Earbuds',
    tagline: 'Big sound, pocket size.',
    price: 199,
    category: 'Earbuds',
    rating: 4.7,
    reviewsCount: 168,
    colors: ['White', 'Silver'],
    stock: 'In stock — ships within 1 business day',
    inBox: ['Wireless Earbuds', 'Charging case', 'USB-C charging cable', 'Ear tips (S / M / L)', 'Quick start guide'],
    specs: {
      driver: '11 mm dynamic',
      battery: '8 h + 24 h case',
      anc: 'ANC, −35 dB',
      bluetooth: '5.3',
      weight: '4.6 g per bud',
      charging: 'USB-C + wireless',
    },
    gallery: ['earbuds'],
    img: 'earbuds',
    alt: 'White AURA wireless earbuds in their open charging case',
    description:
      'Feather-light earbuds with real noise cancelling and a case that keeps them charged for a full week of commutes. They disappear in your ear — the music does not.',
    features: [
      '11 mm drivers with deep, controlled bass',
      'Active noise cancelling up to −35 dB',
      '32 hours total listening with the charging case',
      'IPX5 sweat and splash resistance',
      'Wireless charging and USB-C fast charge',
    ],
  },
  {
    slug: 'aura-watch',
    name: 'Smart Watch',
    tagline: 'Time, health and sound on your wrist.',
    price: 299,
    category: 'Wearables',
    rating: 4.8,
    reviewsCount: 96,
    badge: 'New',
    colors: ['Silver', 'Black'],
    stock: 'In stock — ships within 1 business day',
    inBox: ['Smart Watch', 'Magnetic charging puck', 'Sport band (M / L)', 'Quick start guide'],
    specs: {
      driver: '—',
      battery: '14 days',
      anc: '—',
      bluetooth: '5.3',
      weight: '38 g',
      charging: 'Magnetic puck',
    },
    gallery: ['smartwatch'],
    img: 'smartwatch',
    alt: 'Silver AURA smartwatch with a black watch face',
    description:
      'A watch that keeps up with your day and your workouts. Bright always-on display, two weeks of battery, and your AURA audio controls right on your wrist.',
    features: [
      'Bright always-on AMOLED display',
      '14-day battery life on a single charge',
      'Heart rate, sleep and workout tracking',
      'Control AURA audio from your wrist',
      '5 ATM water resistance — swim friendly',
    ],
  },
  {
    slug: 'aura-speaker',
    name: 'Portable Speaker',
    tagline: 'Room-filling sound, wherever you go.',
    price: 149,
    category: 'Speakers',
    rating: 4.6,
    reviewsCount: 142,
    colors: ['Mist Grey', 'Charcoal'],
    stock: 'In stock — ships within 1 business day',
    inBox: ['Portable Speaker', 'USB-C charging cable', 'Quick start guide'],
    specs: {
      driver: '2 × 50 mm',
      battery: '24 hours',
      anc: '—',
      bluetooth: '5.3',
      weight: '680 g',
      charging: 'USB-C',
    },
    gallery: ['speaker'],
    img: 'speaker',
    alt: 'Light grey fabric AURA portable speaker',
    description:
      'A speaker that fills a room and fits in a bag. Dual drivers and a passive radiator deliver warm, full sound — for 24 hours straight.',
    features: [
      'Dual 50 mm drivers with a passive bass radiator',
      '24-hour battery life',
      'IP67 dust and water resistance',
      'Pair two speakers for true stereo',
      'Built-in microphone for hands-free calls',
    ],
  },
  {
    slug: 'aura-dock',
    name: 'Charging Dock',
    tagline: 'One dock for everything AURA.',
    price: 99,
    category: 'Accessories',
    rating: 4.5,
    reviewsCount: 87,
    colors: ['Silver'],
    stock: 'Only 3 left in stock — ships within 1 business day',
    lowStock: true,
    inBox: ['Charging Dock', 'USB-C cable', '30 W power adapter', 'Quick start guide'],
    specs: {
      driver: '—',
      battery: '—',
      anc: '—',
      bluetooth: '—',
      weight: '320 g',
      charging: 'USB-C in · 15 W out',
    },
    gallery: ['charging-dock'],
    img: 'charging-dock',
    alt: 'AURA charging dock holding a smartphone upright',
    description:
      'A weighted aluminium dock that charges your phone, earbuds and watch from one cable — and keeps your desk looking like you mean it.',
    features: [
      'Charges phone, earbuds and watch at once',
      '15 W fast wireless charging',
      'Weighted aluminium base that stays put',
      'One USB-C cable in, everything charged',
    ],
  },
  {
    slug: 'aura-home',
    name: 'AURA Home',
    tagline: 'A smart speaker for the whole room.',
    price: 249,
    category: 'Speakers',
    rating: 4.8,
    reviewsCount: 64,
    badge: 'New',
    colors: ['Mist Grey'],
    stock: 'In stock — ships within 1 business day',
    inBox: ['AURA Home speaker', 'Power cable', 'Quick start guide'],
    specs: {
      driver: '76 mm woofer + tweeter',
      battery: '— (mains)',
      anc: '—',
      bluetooth: '5.4 · Wi-Fi',
      weight: '1.2 kg',
      charging: 'Mains',
    },
    gallery: ['home-speaker'],
    img: 'home-speaker',
    alt: 'AURA Home smart speaker in light grey fabric with an aluminium base',
    description:
      'A room-filling smart speaker wrapped in acoustic fabric. Rich lows, clear highs, and a voice assistant that minds its own business until you ask.',
    features: [
      '76 mm woofer and dedicated tweeter for full-range sound',
      'Room-sensing tuning that adapts to your space',
      'Voice assistant with a physical mic-off switch',
      'Multi-room sync with other AURA speakers',
    ],
  },
  {
    slug: 'aura-buds-pro',
    name: 'AURA Buds Pro',
    tagline: 'Studio sound in your pocket.',
    price: 249,
    compareAt: 279,
    category: 'Earbuds',
    rating: 4.9,
    reviewsCount: 121,
    badge: 'Bestseller',
    colors: ['White', 'Silver'],
    stock: 'In stock — ships within 1 business day',
    inBox: ['AURA Buds Pro', 'Charging case', 'USB-C charging cable', 'Ear tips (XS / S / M / L)', 'Quick start guide'],
    specs: {
      driver: '12 mm beryllium',
      battery: '9 h + 27 h case',
      anc: 'Adaptive ANC, −45 dB',
      bluetooth: '5.4 · multipoint',
      weight: '5.1 g per bud',
      charging: 'USB-C + wireless',
    },
    gallery: ['buds-pro'],
    img: 'buds-pro',
    alt: 'AURA Buds Pro wireless earbuds floating above their open charging case',
    description:
      'Our best earbuds. Beryllium drivers, adaptive ANC and a fit that stays put through runs, calls and red-eyes. The closest thing to wearing nothing at all.',
    features: [
      '12 mm beryllium drivers for studio-grade detail',
      'Adaptive ANC up to −45 dB with transparency mode',
      '36 hours total listening with the case',
      'Multipoint Bluetooth and in-ear detection',
      'IPX5 sweat and splash resistance',
    ],
  },
  {
    slug: 'aura-case',
    name: 'AURA Travel Case',
    tagline: 'Your headphones, first class.',
    price: 79,
    category: 'Accessories',
    rating: 4.7,
    reviewsCount: 203,
    colors: ['Mist Grey', 'Charcoal'],
    stock: 'In stock — ships within 1 business day',
    inBox: ['AURA Travel Case', 'Cable organiser pouch', 'Quick start guide'],
    specs: {
      driver: '—',
      battery: '—',
      anc: '—',
      bluetooth: '—',
      weight: '210 g',
      charging: '—',
    },
    gallery: ['travel-case'],
    img: 'travel-case',
    alt: 'AURA Travel Case in light grey woven fabric with a zipper and leather pull',
    description:
      'A crush-proof hard case in woven fabric with a soft moulded interior — made for AURA One, and built to survive overhead bins, backpacks and Mondays.',
    features: [
      'Crush-proof hard shell with a soft moulded interior',
      'Fits AURA One plus cables and the charging dock',
      'Water-repellent woven fabric, leather pull tab',
      'Slim enough for a laptop bag side pocket',
    ],
  },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const formatPrice = (n: number) => `$${n}`;

export interface Review {
  name: string;
  rating: number;
  title: string;
  body: string;
  product: string;
  date: string;
}

export const reviews: Review[] = [
  { name: 'Ananya Sharma', rating: 5, title: 'My focus headphones', body: 'I wear them eight hours a day for work. The ANC kills the traffic noise outside my window and they still feel light at 6pm. Battery lasts the whole week.', product: 'aura-one', date: 'Nov 2026' },
  { name: 'Rohan Mehta', rating: 5, title: 'Worth every rupee — I mean dollar', body: 'Coming from headphones twice the price, the One holds its own. Bass is tight, not boomy, and calls are crystal clear on both ends.', product: 'aura-one', date: 'Oct 2026' },
  { name: 'Priya Nair', rating: 4, title: 'Great, with one quirk', body: 'Sound is excellent and the case is tiny enough for a jeans pocket. The touch controls took me a day to learn — after that, no complaints.', product: 'aura-buds', date: 'Nov 2026' },
  { name: 'Daniel Kim', rating: 5, title: 'The Pro is the real deal', body: 'Adaptive ANC on a flight is genuinely impressive — the cabin drone just vanishes. Transparency mode sounds natural, not like a hearing aid.', product: 'aura-buds-pro', date: 'Nov 2026' },
  { name: 'Sara Fernandes', rating: 5, title: 'Two weeks, one charge', body: 'Bought the watch for the battery claim and it is real. Fourteen days, with workouts tracked every morning. The audio controls are a bonus I use daily.', product: 'aura-watch', date: 'Oct 2026' },
  { name: 'Arjun Kapoor', rating: 4, title: 'Fills the whole living room', body: 'Small speaker, big sound. It handled a house party without distorting at full volume. Docked one star only because I want more colours.', product: 'aura-speaker', date: 'Sep 2026' },
  { name: 'Meera Iyer', rating: 5, title: 'The case is perfect', body: 'Fits the One, the cable and the dock, and still slides into my laptop bag. The fabric feels premium and the zipper is smooth after months of use.', product: 'aura-case', date: 'Nov 2026' },
  { name: 'Tom Becker', rating: 5, title: 'My kitchen now has a soundtrack', body: 'AURA Home replaced a speaker three times its price. The room tuning actually works — it sounds good in the corner and in the middle of the room.', product: 'aura-home', date: 'Oct 2026' },
  { name: 'Kavya Reddy', rating: 4, title: 'Desk, decluttered', body: 'One cable charges everything and the dock looks beautiful on the desk. Wish the watch charger sat a little flatter, but it works perfectly.', product: 'aura-dock', date: 'Sep 2026' },
];

export interface Faq {
  q: string;
  a: string;
  tag: 'Shipping' | 'Returns' | 'Warranty' | 'Product';
}

export const faqs: Faq[] = [
  { q: 'How long does shipping take?', a: 'Orders ship within 1 business day. Delivery takes 2–5 business days across India and 5–10 business days worldwide. Shipping is free on all orders over $150 — otherwise a flat $9 applies at checkout.', tag: 'Shipping' },
  { q: 'What is your return policy?', a: 'Every product comes with a 30-day return window. If it is not for you, send it back in its original condition for a full refund — no questions asked, no restocking fee. Start a return from the Support page and we will email you a prepaid label.', tag: 'Returns' },
  { q: 'What does the 2-year warranty cover?', a: 'The warranty covers manufacturing defects, battery faults and driver failures for two years from delivery. Accidental damage is not covered, but our support team will always offer a fair repair price first.', tag: 'Warranty' },
  { q: 'Does AURA One support multipoint Bluetooth?', a: 'Yes. AURA One and AURA Buds Pro connect to two devices at once — for example your laptop and your phone — and switch automatically when a call comes in.', tag: 'Product' },
  { q: 'How do I clean the ear cushions?', a: 'Wipe the mesh and cushions with a dry, lint-free cloth. For deeper cleaning, use a slightly damp cloth with mild soap, then let them air-dry completely before use. Never submerge the headphones.', tag: 'Product' },
  { q: 'Are the earbuds water resistant?', a: 'AURA Buds and AURA Buds Pro are IPX5 rated — they handle sweat, rain and splashes. They are not made for swimming or showering, and the charging case is not water resistant.', tag: 'Product' },
  { q: 'How can I track my order?', a: 'As soon as your order ships you will get an email with a tracking link (mock demo — no real shipment is created). You can also check the order status from the confirmation page after checkout.', tag: 'Shipping' },
  { q: 'Do you ship internationally?', a: 'Yes, we ship to most countries. Delivery times and any import duties are shown at checkout before you pay. Duties, where they apply, are the responsibility of the recipient.', tag: 'Shipping' },
];

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  body: string[];
  img: string;
  alt: string;
  date: string;
  readTime: string;
}

export const articles: Article[] = [
  {
    slug: 'the-science-of-silence',
    title: 'The Science of Silence: How ANC Actually Works',
    excerpt: 'Noise cancelling feels like magic, but it is physics — microphones, math and a speaker playing the exact opposite of the world.',
    body: [
      'Active noise cancelling starts with listening. Tiny microphones on the outside of each earcup sample the sound around you — the hum of an air conditioner, the drone of a jet engine, the rumble of a train — hundreds of times per second.',
      'That signal is fed into a processor that computes its exact inverse: a sound wave with the same shape, flipped upside down. When the two waves meet inside your ear, their peaks and troughs cancel out. The result is not silence in the room — it is silence at your eardrum.',
      'Low, steady sounds are the easiest to cancel, which is why ANC feels miraculous on flights and in offices. Sudden, sharp sounds — a door slam, a voice — are harder, because by the time the processor hears them they are already past. That is why the best ANC systems pair active cancelling with good passive isolation: dense foam and a proper seal do the work the chip cannot.',
      'Adaptive ANC goes one step further. Instead of one fixed level, it measures the noise floor continuously and adjusts two hundred times a second. Step from a quiet room into a busy street and the system tightens; sit down in a library and it relaxes, so you never feel that underwater pressure some headphones cause.',
      'The next time you switch ANC on and the world drops away, remember: nothing was removed. Your headphones simply played the world back, upside down, at exactly the right moment.',
    ],
    img: 'exploded-view',
    alt: 'Exploded view of the AURA headphones — driver, magnet, circuit board and earcup shells',
    date: 'Nov 12, 2026',
    readTime: '4 min read',
  },
  {
    slug: 'sound-that-fits-your-day',
    title: 'Sound That Fits Your Day: A Listening Routine',
    excerpt: 'Focus in the morning, energy at noon, calm at night. The same ears, three different soundtracks — here is how to set each one up.',
    body: [
      'Most of us listen to one playlist all day and wonder why focus fades by three in the afternoon. Sound shapes attention more than we admit — the trick is matching the soundtrack to the hour.',
      'Mornings belong to focus. Start with ANC on and something without lyrics: ambient textures, soft piano, or simply the quiet itself. Your brain is fresh, and the less it has to process, the deeper it goes. Keep the volume low — around 60% — so your ears stay fresh too.',
      'Midday is for energy. This is when the playlist earns its keep: something with a pulse for the workout, the walk, or the inbox-clearing sprint. Transparency mode helps here — you stay aware of the world while the music keeps you moving.',
      'Evenings belong to calm. Switch to warm, spacious sound — jazz, acoustic, or a podcast at low volume — and let the day wind down. Your ears have worked all day; the last hour is for them, not for you.',
      'The routine matters less than the intention. Choose the sound for the hour, not the other way round, and the same pair of headphones becomes three different tools.',
    ],
    img: 'lifestyle-desk',
    alt: 'AURA headphones resting on a light desk next to their fabric carrying case',
    date: 'Nov 4, 2026',
    readTime: '3 min read',
  },
  {
    slug: 'inside-the-driver',
    title: 'Inside the Driver: Why Beryllium Sounds Different',
    excerpt: 'A driver is a tiny loudspeaker. What it is made of decides how fast it can move — and how honest your music sounds.',
    body: [
      'A headphone driver is simple in principle: a thin diaphragm, a magnet, and a coil. Play a signal through the coil and the diaphragm moves, pushing air — that moving air is the sound you hear.',
      'The hard part is stopping. A diaphragm that keeps wobbling after the signal ends smears the sound: bass gets boomy, voices get muddy, cymbals turn to hiss. The best diaphragms are light enough to move instantly and stiff enough to stop instantly.',
      'That is where beryllium comes in. It is one of the stiffest and lightest metals that can be formed into a diaphragm — roughly seven times stiffer than aluminium at a similar weight. It starts and stops faster, so the sound it makes is closer to the recording.',
      'You hear it first in the details: the edge of a guitar string, the breath before a vocal, the decay of a piano note fading into silence. Nothing about the sound is exaggerated — it is simply more of what was recorded, and less of the driver itself.',
      'Beryllium is harder to work with and costs more, which is why it lives in flagships rather than everything. But once you have heard a driver that gets out of the way, it is hard to go back.',
    ],
    img: 'earcup-closeup',
    alt: 'Macro close-up of the AURA headphone earcup — brushed aluminium, mesh fabric and USB-C port',
    date: 'Oct 26, 2026',
    readTime: '4 min read',
  },
];

export const testimonials = [
  { name: 'Ananya Sharma', role: 'Product designer, Mumbai', quote: 'The One is the first headphone I forget I am wearing. Eight hours in, still comfortable, still quiet.', rating: 5, product: 'aura-one' },
  { name: 'Daniel Kim', role: 'Frequent flyer, Seoul', quote: 'Adaptive ANC on a flight is genuinely impressive — the cabin drone just vanishes.', rating: 5, product: 'aura-buds-pro' },
  { name: 'Sara Fernandes', role: 'Fitness coach, Goa', quote: 'Two weeks of battery, workouts tracked every morning, and my music controls are on my wrist. Done.', rating: 5, product: 'aura-watch' },
];


export const community = [
  {
    img: 'lifestyle-desk',
    alt: 'AURA headphones resting on a light desk next to their fabric carrying case',
    handle: '@mira.listens',
    quote: 'Morning focus, sorted. The One lives on my desk now.',
  },
  {
    img: 'earcup-closeup',
    alt: 'Macro close-up of the AURA headphone earcup — brushed aluminium, mesh fabric and USB-C port',
    handle: '@daniel.flies',
    quote: 'Cabin drone: gone. These are my flight essential.',
  },
  {
    img: 'exploded-view',
    alt: 'Exploded view of the AURA headphones — driver, magnet, circuit board and earcup shells',
    handle: '@sara.trains',
    quote: 'Buds Pro survive every workout. ANC on, world off.',
  },
];

export const footerShop = [
  { label: 'All products', href: '/products/' },
  { label: 'Headphones', href: '/products/?category=Headphones' },
  { label: 'Earbuds', href: '/products/?category=Earbuds' },
  { label: 'Speakers', href: '/products/?category=Speakers' },
  { label: 'Accessories', href: '/products/?category=Accessories' },
];

export const footerCompany = [
  { label: 'Our Story', href: '/story/' },
  { label: 'Technology', href: '/technology/' },
  { label: 'Journal', href: '/journal/' },
  { label: 'Contact', href: '/support/' },
];

export const footerSupport = [
  { label: 'Help & FAQ', href: '/support/' },
  { label: 'Shipping', href: '/support/#shipping' },
  { label: 'Returns', href: '/support/#returns' },
  { label: 'Warranty', href: '/support/#warranty' },
];

export const footerLegal = [
  { label: 'Privacy', href: '/privacy/' },
  { label: 'Terms', href: '/terms/' },
];
