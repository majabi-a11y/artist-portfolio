/**
 * Default site data — used as initial values when no localStorage data exists.
 * All content that can be edited via the CMS is defined here.
 */

export interface ArtistProfile {
  name: string;
  tagline: string;
  techniqueTitle: string;
  birthInfo: string;
  heroBanner: string;
  bio: string[];
  stats: { label: string; value: string }[];
  contact: { label: string; value: string }[];
  technique: { label: string; desc: string }[];
}

export interface Artwork {
  id: string;
  title: string;
  year: number;
  technique: string;
  dimensions: string;
  description: string;
  images: string[];
  category: 'toile' | 'fresque' | 'graphisme' | 'serigraphie' | 'objets';
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

export interface Exhibition {
  year: string;
  title: string;
  venue: string;
  type: string;
}

export interface PressItem {
  title: string;
  excerpt: string;
  link?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image: string;
  link?: string;
  category: string;
}

export interface SiteData {
  profile: ArtistProfile;
  artworks: Artwork[];
  news: NewsPost[];
  exhibitions: Exhibition[];
  press: PressItem[];
  portfolio: PortfolioItem[];
}

export const defaultSiteData: SiteData = {
  profile: {
    name: 'Adrien Da Silva',
    tagline: 'Artiste contemporain — Paris',
    techniqueTitle: 'Peinture matricielle horizontale',
    birthInfo: 'Artiste peintre — Né en 1992, Lisbonne',
    heroBanner: '',
    bio: [
      'Né en 1992 à Lisbonne, Adrien Da Silva vit et travaille à Paris depuis 2015. Diplômé des Beaux-Arts de Paris (ENSBA) en 2016, il développe dès ses premières années une technique picturale singulière qu\'il nomme la trame matricielle horizontale.',
      'Son travail se situe à la croisée de l\'art numérique et de la peinture traditionnelle. Chaque toile est construite ligne par ligne, tiret par tiret, avec une patience méticuleuse. Les traits — toujours horizontaux — se terminent par un demi-cercle parfait, donnant à chaque marque une qualité de capsule organique.',
      'Ses œuvres questionnent la perception et la représentation à l\'ère du pixel, transformant paysages, portraits et natures mortes en compositions vibrantes où la forme émerge de l\'accumulation systématique de marques élémentaires.',
    ],
    stats: [
      { label: 'Œuvres', value: '50+' },
      { label: 'Expositions', value: '12' },
      { label: 'Murales', value: '8' },
    ],
    contact: [
      { label: 'Atelier', value: 'Paris, France' },
      { label: 'Email', value: 'contact@adriendasilva.com' },
      { label: 'Instagram', value: '@adriendasilva' },
      { label: 'Site', value: 'www.adriendasilva.com' },
    ],
    technique: [
      { label: 'Matrice', desc: 'Lignes horizontales de tirets épais à densité variable' },
      { label: 'Forme', desc: 'Extrémités en demi-cercle parfait — forme capsule' },
      { label: 'Luminosité', desc: 'Densité et épaisseur varient selon la valeur tonale' },
      { label: 'Palette', desc: 'Aubergine profond, rose magenta, noir & blanc' },
      { label: 'Supports', desc: 'Acrylique sur toile, encre sur papier, mural' },
    ],
  },
  artworks: [
    {
      id: '1',
      title: 'Sunset Reflections',
      year: 2024,
      technique: 'Acrylic on canvas — Horizontal line matrix',
      dimensions: '150 × 120 cm',
      description: 'A mesmerizing landscape depicting a sunset over water, rendered through Da Silva\'s signature horizontal dash technique.',
      images: [],
      category: 'toile',
      isFeatured: true,
      status: 'exhibition',
      exhibition: 'Galerie Perrotin, Paris',
    },
    {
      id: '2',
      title: 'Portrait — Coco',
      year: 2023,
      technique: 'Acrylic on canvas — Dot matrix portrait',
      dimensions: '200 × 180 cm',
      description: 'A striking portrait composed entirely of horizontal dots and dashes of varying density.',
      images: [],
      category: 'fresque',
      isFeatured: true,
      status: 'sold',
    },
    {
      id: '3',
      title: 'Bouquet Violet',
      year: 2024,
      technique: 'Acrylic on canvas — Line scan',
      dimensions: '100 × 80 cm',
      description: 'A delicate still life of flowers, deconstructed through vertical and horizontal scanning lines.',
      images: [],
      category: 'toile',
      isFeatured: true,
      status: 'available',
      price: '€12,000',
    },
    {
      id: '4',
      title: 'Seascape — Dawn',
      year: 2023,
      technique: 'Acrylic on canvas — Horizontal stripe',
      dimensions: '120 × 90 cm',
      description: 'A coastal scene at dawn, where the sea and sky merge through horizontal bands of varying width.',
      images: [],
      category: 'toile',
      isFeatured: false,
      status: 'available',
      price: '€8,500',
    },
    {
      id: '5',
      title: 'Mural — Place de la République',
      year: 2024,
      technique: 'Exterior mural — Mixed media',
      dimensions: '8m × 5m',
      description: 'A monumental public mural commissioned by the City of Paris.',
      images: [],
      category: 'fresque',
      isFeatured: true,
      status: 'private',
    },
    {
      id: '6',
      title: 'Série Noire #03',
      year: 2022,
      technique: 'India ink on paper — Line matrix',
      dimensions: '60 × 40 cm',
      description: 'Part of the minimalist Série Noire collection, stripping the technique to its essence.',
      images: [],
      category: 'serigraphie',
      isFeatured: false,
      status: 'sold',
    },
    {
      id: '7',
      title: 'Flamingo Dreams',
      year: 2024,
      technique: 'Acrylic on canvas — Gradient matrix',
      dimensions: '130 × 100 cm',
      description: 'A tropical scene rendered with an expanded palette of hot pinks, corals, and deep navy.',
      images: [],
      category: 'toile',
      isFeatured: false,
      status: 'available',
      price: '€10,000',
    },
    {
      id: '8',
      title: 'Urban Decay #12',
      year: 2023,
      technique: 'Acrylic and spray on canvas',
      dimensions: '180 × 140 cm',
      description: 'An exploration of urban textures and deterioration, combining matrix technique with spray paint.',
      images: [],
      category: 'graphisme',
      isFeatured: false,
      status: 'exhibition',
      exhibition: 'Art Basel Miami, 2023',
    },
  ],
  news: [
    {
      id: '1',
      title: 'Solo Exhibition at Galerie Perrotin',
      date: '2024-03-15',
      content: 'Thrilled to announce my upcoming solo exhibition "Between the Lines" at Galerie Perrotin, Paris. Opening reception on March 28th.',
      category: 'exhibition',
    },
    {
      id: '2',
      title: 'Featured in Art Forum Magazine',
      date: '2024-02-20',
      content: 'Honored to be featured in the February issue of Art Forum, with a deep dive into my line matrix technique.',
      category: 'press',
    },
    {
      id: '3',
      title: 'New Mural Commission — Lyon',
      date: '2024-01-10',
      content: 'Excited to share that I\'ve been commissioned to create a monumental mural in Lyon\'s Confluence district.',
      category: 'event',
    },
    {
      id: '4',
      title: 'Studio Visit — New Series in Progress',
      date: '2023-12-05',
      content: 'Currently in the studio working on a new series. Experimenting with metallic inks and UV-reactive pigments.',
      category: 'studio',
    },
    {
      id: '5',
      title: 'Art Basel Miami — Recap',
      date: '2023-11-28',
      content: 'What an incredible week at Art Basel Miami! Three works found new homes during the fair.',
      category: 'exhibition',
    },
  ],
  exhibitions: [
    { year: '2024', title: 'Between the Lines', venue: 'Galerie Perrotin, Paris', type: 'Solo' },
    { year: '2024', title: 'Mural — Place de la République', venue: 'Commande publique, Paris', type: 'Public' },
    { year: '2023', title: 'Art Basel Miami Beach', venue: 'Miami Beach Convention Center', type: 'Foire' },
    { year: '2023', title: 'Lignes de Fuite', venue: 'Centre Pompidou, Paris', type: 'Collectif' },
    { year: '2023', title: 'New Horizons', venue: 'White Cube, London', type: 'Collectif' },
    { year: '2022', title: 'Série Noire', venue: 'Galerie Thaddaeus Ropac, Paris', type: 'Solo' },
    { year: '2022', title: 'FIAC', venue: 'Grand Palais Éphémère, Paris', type: 'Foire' },
    { year: '2021', title: 'Pixel & Pigment', venue: 'Palais de Tokyo, Paris', type: 'Collectif' },
  ],
  press: [
    { title: 'Art Forum', excerpt: '"Da Silva\'s line matrix technique reinvents the relationship between digital and analog..."', link: '' },
    { title: 'Beaux Arts Magazine', excerpt: '"Une approche radicalement nouvelle du portrait, entre pixelisation et peinture classique."', link: '' },
    { title: 'Le Monde', excerpt: '"L\'artiste qui peint au tiret : Adrien Da Silva transforme le regard."', link: '' },
  ],
  portfolio: [
    { id: '1', title: 'Brand Identity — Maison Lumière', description: 'Direction artistique complète pour une maison de luxe parisienne.', image: '', link: '', category: 'Direction artistique' },
    { id: '2', title: 'Fresque — Hôtel Le Marais', description: 'Fresque murale de 12m pour le lobby de l\'hôtel.', image: '', link: '', category: 'Mural' },
    { id: '3', title: 'Collaboration — Nike', description: 'Collection capsule avec application du motif matriciel sur textile.', image: '', link: '', category: 'Collaboration' },
  ],
};
