export interface Artwork {
  id: string;
  title: string;
  year: number;
  technique: string;
  dimensions: string;
  description: string;
  image: string;
  category: 'painting' | 'mural' | 'installation' | 'print';
  isFeatured: boolean;
  price?: string;
  status: 'available' | 'sold' | 'exhibition' | 'private';
  exhibition?: string;
}

export interface NewsPost {
  id: string;
  title: string;
  date: string;
  content: string;
  image?: string;
  category: 'exhibition' | 'press' | 'event' | 'studio';
}

export const artworks: Artwork[] = [
  {
    id: '1',
    title: 'Sunset Reflections',
    year: 2024,
    technique: 'Acrylic on canvas — Horizontal line matrix',
    dimensions: '150 × 120 cm',
    description: 'A mesmerizing landscape depicting a sunset over water, rendered through Da Silva\'s signature horizontal dash technique. The interplay of deep aubergine strokes against a soft pink and coral sky creates a meditative quality, while the water\'s reflection fragments the scene into rhythmic linear patterns.',
    image: '',
    category: 'painting',
    isFeatured: true,
    status: 'exhibition',
    exhibition: 'Galerie Perrotin, Paris'
  },
  {
    id: '2',
    title: 'Portrait — Coco',
    year: 2023,
    technique: 'Acrylic on canvas — Dot matrix portrait',
    dimensions: '200 × 180 cm',
    description: 'A striking portrait composed entirely of horizontal dots and dashes of varying density. The subject emerges from the accumulation of marks, creating a pixelated yet deeply expressive likeness. Electric blue and purple tones against a vibrant magenta background give the work a contemporary energy.',
    image: '',
    category: 'mural',
    isFeatured: true,
    status: 'sold'
  },
  {
    id: '3',
    title: 'Bouquet Violet',
    year: 2024,
    technique: 'Acrylic on canvas — Line scan',
    dimensions: '100 × 80 cm',
    description: 'A delicate still life of flowers, deconstructed through vertical and horizontal scanning lines. The monochromatic violet palette creates depth through density variation, with the flowers emerging as ghostly, ethereal forms from the systematic line work.',
    image: '',
    category: 'painting',
    isFeatured: true,
    status: 'available',
    price: '€12,000'
  },
  {
    id: '4',
    title: 'Seascape — Dawn',
    year: 2023,
    technique: 'Acrylic on canvas — Horizontal stripe',
    dimensions: '120 × 90 cm',
    description: 'A coastal scene at dawn, where the sea and sky merge through horizontal bands of varying width. The characteristic black and white palette is punctuated by subtle flashes of neon pink, evoking the first rays of sunlight breaking through clouds.',
    image: '',
    category: 'painting',
    isFeatured: false,
    status: 'available',
    price: '€8,500'
  },
  {
    id: '5',
    title: 'Mural — Place de la République',
    year: 2024,
    technique: 'Exterior mural — Mixed media',
    dimensions: '8m × 5m',
    description: 'A monumental public mural commissioned by the City of Paris. The large-scale work translates Da Silva\'s intimate studio technique to an architectural scale, creating a portrait that shifts and transforms as viewers move past it.',
    image: '',
    category: 'mural',
    isFeatured: true,
    status: 'private'
  },
  {
    id: '6',
    title: 'Série Noire #03',
    year: 2022,
    technique: 'India ink on paper — Line matrix',
    dimensions: '60 × 40 cm',
    description: 'Part of the minimalist Série Noire collection, this work strips the technique to its essence. Pure black ink on white paper creates a landscape that hovers between abstraction and figuration.',
    image: '',
    category: 'print',
    isFeatured: false,
    status: 'sold'
  },
  {
    id: '7',
    title: 'Flamingo Dreams',
    year: 2024,
    technique: 'Acrylic on canvas — Gradient matrix',
    dimensions: '130 × 100 cm',
    description: 'A tropical scene rendered in the artist\'s signature style with an expanded palette of hot pinks, corals, and deep navy. The flamingo subject allows for playful exploration of form through line density.',
    image: '',
    category: 'painting',
    isFeatured: false,
    status: 'available',
    price: '€10,000'
  },
  {
    id: '8',
    title: 'Urban Decay #12',
    year: 2023,
    technique: 'Acrylic and spray on canvas',
    dimensions: '180 × 140 cm',
    description: 'An exploration of urban textures and deterioration, combining the artist\'s matrix technique with raw spray paint gestures. The contrast between systematic precision and spontaneous marks creates a powerful visual tension.',
    image: '',
    category: 'painting',
    isFeatured: false,
    status: 'exhibition',
    exhibition: 'Art Basel Miami, 2023'
  }
];

export const newsPosts: NewsPost[] = [
  {
    id: '1',
    title: 'Solo Exhibition at Galerie Perrotin',
    date: '2024-03-15',
    content: 'Thrilled to announce my upcoming solo exhibition "Between the Lines" at Galerie Perrotin, Paris. The show will feature 12 new large-scale works exploring the boundaries between digital aesthetics and traditional painting techniques. Opening reception on March 28th.',
    category: 'exhibition'
  },
  {
    id: '2',
    title: 'Featured in Art Forum Magazine',
    date: '2024-02-20',
    content: 'Honored to be featured in the February issue of Art Forum. The article explores the intersection of technology and traditional painting in contemporary art, with a deep dive into my line matrix technique and its evolution over the past five years.',
    category: 'press'
  },
  {
    id: '3',
    title: 'New Mural Commission — Lyon',
    date: '2024-01-10',
    content: 'Excited to share that I\'ve been commissioned to create a monumental mural in Lyon\'s Confluence district. The 15-meter work will be my largest outdoor piece to date, bringing the line matrix technique to a new architectural scale.',
    category: 'event'
  },
  {
    id: '4',
    title: 'Studio Visit — New Series in Progress',
    date: '2023-12-05',
    content: 'Currently in the studio working on a new series that pushes the boundaries of my technique. Experimenting with metallic inks and UV-reactive pigments to create works that transform under different lighting conditions.',
    category: 'studio'
  },
  {
    id: '5',
    title: 'Art Basel Miami — Recap',
    date: '2023-11-28',
    content: 'What an incredible week at Art Basel Miami! Thank you to everyone who visited the booth and connected with the work. Special thanks to Galerie Perrotin for the beautiful presentation. Three works found new homes during the fair.',
    category: 'exhibition'
  }
];
