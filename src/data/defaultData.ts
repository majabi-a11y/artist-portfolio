/**
 * Default site data — used as initial values when no Firestore data exists.
 * All content that can be edited via the CMS is defined here.
 */

export interface ArtistProfile {
  name: string;
  tagline: string;
  techniqueTitle: string;
  birthInfo: string;
  heroBanner: string;
  appIcon: string;
  bio: string[];
  stats: { label: string; value: string }[];
  contact: { label: string; value: string }[];
  technique: { label: string; desc: string }[];
  cvSections: { title: string; items: string[] }[];
  galleryImages: string[];
}

export interface Artwork {
  id: string;
  title: string;
  year?: number; // facultatif : année inconnue pour certaines fresques
  technique: string;
  dimensions: string;
  description: string;
  images: string[];
  category: 'toile' | 'papier' | 'fresque' | 'graphisme' | 'serigraphie' | 'objets';
  isFeatured: boolean;
  price?: string; // montant en euros, sans symbole (ex. '2200')
  signature?: string; // ex. 'Signée au dos'
  serie?: string; // série (planches du catalogue), voir SERIES
  status: 'available' | 'sold' | 'exhibition' | 'private';
  exhibition?: string;
  lieu?: string; // For fresques: location of the mural
  draft?: boolean; // brouillon (import Drive) : invisible sur le site tant qu'il n'est pas complété
  driveFolderId?: string; // dossier (ou fichier) Drive d'origine
}

export interface NewsPost {
  id: string;
  title: string;
  date: string;
  content: string;
  images: string[]; // Multi-image support
  category: 'exhibition' | 'press' | 'event' | 'studio';
  link?: string; // lien affiché sous le texte (ex. PDF du catalogue)
  draft?: boolean;
  driveFolderId?: string;
  linkLabel?: string;
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
  images: string[]; // Multi-image support (was single 'image')
  link?: string;
  category: string;
}

export interface HomeNavItem {
  direction: 'up' | 'down' | 'left' | 'right' | 'center' | 'bio';
  label: string;
  subtitle: string;
  route: string;
  image: string;
  textColor?: string;
  bgColor?: string; // Background color behind the image
  pwaOnly?: boolean; // If true, only visible when installed as PWA
}

export interface MenuItemConfig {
  label: string;
  route: string;
  textColor?: string;
}

export interface MenuLineConfig {
  color: string;
  thickness: number; // px
  offsetX: number; // % from left
  width: number; // % of container width
}

export interface MenuConfig {
  items: MenuItemConfig[];
  lines: MenuLineConfig[]; // One line config between each item (items.length - 1)
  lineColor: string; // Fallback default
  lineThickness: number; // Fallback default
}

export interface ThemeConfig {
  bgColor: string;
  paletteId: string;
}

export interface SiteData {
  profile: ArtistProfile;
  artworks: Artwork[];
  news: NewsPost[];
  exhibitions: Exhibition[];
  press: PressItem[];
  portfolio: PortfolioItem[];
  theme: ThemeConfig;
  homeNav: HomeNavItem[];
  menuConfig: MenuConfig;
  contactEmail: string; // Email address for contact form submissions
  whatsapp?: string; // numéro international sans « + » ni espaces (ex. 33684732265)
  contentVersion?: number; // voir CONTENT_VERSION
  driveFolderUrl?: string; // dossier Drive partagé d'où viennent les nouvelles photos
  driveImported?: string[]; // identifiants des fichiers Drive déjà importés
}

/**
 * Version du contenu par défaut. Une donnée Firestore d'une version plus ancienne est ignorée
 * (elle contenait le contenu de démonstration) ; l'admin enregistre ensuite la version actuelle.
 */
export const CONTENT_VERSION = 2;

const oeuvre = (slug: string) => `/oeuvres/${slug}.webp`;
const fresque = (slug: string, n: number) => Array.from({ length: n }, (_, i) => `/fresques/${slug}-${i + 1}.webp`);

/** Vignette 900 px des images du site (les images importées depuis l'admin restent telles quelles). */
export const thumb = (src: string) =>
  /^\/(oeuvres|fresques|atelier)\/.+\.webp$/.test(src) ? src.replace(/\.webp$/, '-900.webp') : src;

/** « 2200 » → « 2 200 € » ; une valeur qui contient déjà « € » est laissée telle quelle. */
export const formatPrice = (price: string) => {
  if (price.includes('€')) return price;
  const n = Number(price.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? `${n.toLocaleString('fr-FR')} €` : price;
};

/** Publié sur le site (les brouillons importés du Drive restent dans l'admin). */
export const isPublished = (item: { draft?: boolean }) => !item.draft;

/**
 * Séries d'Adrien, de la plus ancienne à la plus récente (planches du catalogue).
 * Les textes viennent de lui (portfolio, journal) ; pas de texte inventé quand il n'en a pas écrit.
 */
export const SERIES: { id: string; titre: string; texte?: string }[] = [
  { id: 'hors-ligne', titre: 'Hors ligne' },
  { id: 'temps-libre', titre: 'Temps libre', texte: 'Ce temps libre si précieux : la flânerie d\'une balade en ville, les divagations de l\'esprit à la terrasse d\'un café.' },
  { id: 'lignes-de-vies', titre: 'Lignes de vies', texte: 'Des éléments essentiels pour l\'artiste, comme la maison, l\'atelier ou l\'amour.' },
  { id: 'on-dirait-le-sud', titre: 'On dirait le sud' },
];

export const CATALOGUE_PDF = '/catalogue-adrien-da-silva-2026.pdf';


/** Lien WhatsApp direct, avec un message prérempli. */
export const whatsappLink = (number: string, text?: string) =>
  `https://wa.me/${number.replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

/** Lien d'une ligne de contact : Instagram, WhatsApp/téléphone, e-mail ou site. */
export function contactHref(label: string, value: string): string {
  const v = value.trim();
  if (/instagram/i.test(label)) return `https://instagram.com/${v.replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '')}`;
  if (/whatsapp/i.test(label)) return whatsappLink(v);
  if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(v)) return `mailto:${v}`;
  if (v.startsWith('+')) return `tel:${v.replace(/\s/g, '')}`;
  return v.startsWith('http') ? v : `https://${v}`;
}

// Œuvres et légendes : catalogue A.D. 2026 d'Adrien. Fresques : son portfolio 2026.
export const defaultSiteData: SiteData = {
  contentVersion: CONTENT_VERSION,
  profile: {
    name: 'Adrien Da Silva',
    tagline: 'Artiste peintre et muraliste — Montpellier',
    techniqueTitle: '',
    birthInfo: 'Artiste peintre — Né en 1989',
    heroBanner: '/atelier/adrien-au-travail.webp',
    appIcon: '',
    // Bio écrite par Adrien (base du site, avril 2026) ; seules les fautes de frappe sont corrigées.
    bio: [
      'Dans ses compositions, Adrien nous guide pour observer son environnement : aplats de couleurs, trame de lignes et espaces traversés, autant d\'éléments qui nourrissent un foisonnement narratif qui lui est propre.',
      'L\'artiste alterne entre représentations figuratives et abstraites, une manière de façonner la réalité en la juxtaposant à son imagination. De ses œuvres naissent plusieurs interprétations d\'un même sujet, elles se complètent.',
      'Il faut regarder son travail sous plusieurs angles pour en saisir l\'ensemble. Les traits se multiplient, évoquant les strates personnelles d\'un individu : son histoire et ses pensées.',
      'Tandis que les proportions se développent au rythme de son geste, il entre dans notre intimité et synthétise l\'idée de départ.',
    ],
    stats: [],
    contact: [
      { label: 'Atelier', value: 'Montpellier — sur rendez-vous' },
      { label: 'Email', value: 'adrien.enaer@gmail.com' },
      { label: 'Instagram', value: '@adrien_dasilva' },
      { label: 'WhatsApp', value: '+33 6 84 73 22 65' },
    ],
    technique: [],
    cvSections: [
      { title: '2025', items: [
        'Assistant de Nelio & Rero — fresque, Montpellier',
        'Assistant d\'Adec — fresque, Réchicourt-le-Château',
        'Exposition collective — Aérochrome, Blagnac',
        'Fresque — Festival K-Live, Sète',
        'Exposition collective — Galerie Cilas',
        'Fresque — Festival Plein Champs, Le Mans',
        'Salon d\'art — Montpellier',
      ] },
      { title: '2024', items: [
        'Fresque Enedis — Pérols',
        'Fresque Fenêtre sur Rue — L\'Écluse, Paris',
        'Fresque Plein Sud — Carnon',
        'Fresque intérieure — CHU, Montpellier',
        'Exposition personnelle « Temps libre » — St Ravy, Montpellier',
        'Lauréat de l\'appel à projets d\'art public — fresque, Médiathèque de Graulhet',
        'Assistant d\'Olivier Kenneybrew — fresque, Montpellier',
        'Fresque et atelier — Colors Up, CROUS, Montpellier',
      ] },
      { title: '2023', items: [
        'Fresque — Galerie Éphémère, Villeneuve',
        'Fresque intérieure — Résidence 56, Montpellier',
        'Exposition personnelle « Plein Sud » — Château de Melgueil, Mauguio',
        'Fresque — Festival Street Art, Sérignan',
        'Exposition collective — Galerie Urban Signature, Paris',
        'Assistant de Fred Battle — fresque, Lunel',
      ] },
      { title: '2022', items: [
        'Galerie Éphémère — installation, Villeneuve-lès-Maguelone',
        'Fresque — Office de tourisme, Montpellier',
        'Assistant de Franck Noto — Pont Vezinhet, Montpellier',
        'Fresque Plein Sud — St Rock Social Club, Montpellier',
      ] },
      { title: '2021', items: [
        'Exposition collective — Urban Signature, Paris',
        'Fresque — Festival Fenêtre sur Rue, Paris',
        'Fresque — Festival K-Live, Sète',
        'Exposition collective — Humble Galerie, Île de Ré',
        'Fresque — échange artistique ASARUE, Rennes',
        'Fresque — Le M.U.R, Pérols',
      ] },
      { title: '2020', items: [
        'Exposition « Stéréovision », en collaboration avec Mara — Le Cabinet d\'Amateur, Paris',
        'Assistant de Hien — Médiathèque, Montpellier',
        'Exposition collective — La Serre, Montpellier',
        'Assistant de Zest — K-LIVE, Sète',
        'Exposition collective « X Y Z » — Pierre Vive, Montpellier',
      ] },
    ],
    galleryImages: [],
  },
  artworks: [
    // ── Catalogue 2026 (dans l'ordre du catalogue) ──
    { id: 'on-dirait-le-sud-116-x-89', serie: 'on-dirait-le-sud', title: 'On dirait le sud', year: 2026, technique: 'Acrylique sur toile', dimensions: '116 x 89 cm', signature: 'Signée au dos', price: '2200', description: '', images: [oeuvre('on-dirait-le-sud-116-x-89')], category: 'toile', isFeatured: true, status: 'available' },
    { id: 'on-dirait-le-sud-146-x-97', serie: 'on-dirait-le-sud', title: 'On dirait le sud', year: 2026, technique: 'Acrylique sur toile', dimensions: '146 x 97 cm', signature: 'Signée au dos', price: '3000', description: '', images: [oeuvre('on-dirait-le-sud-146-x-97')], category: 'toile', isFeatured: true, status: 'available' },
    { id: 'deconnecte', serie: 'on-dirait-le-sud', title: 'Déconnecté', year: 2024, technique: 'Acrylique sur toile', dimensions: '150 x 150 cm', signature: 'Signée au dos', price: '4600', description: 'La composition saisit un flux de travailleurs pris dans la mécanique du quotidien. Les silhouettes avancent, chargées de leurs obligations, tandis que l\'horizon appelle ailleurs. En creux, la ville retient ceux qui ne rêvent que de temps libre au bord de la mer.', images: [oeuvre('deconnecte')], category: 'toile', isFeatured: true, status: 'available' },
    { id: 'temps-libre-3', serie: 'temps-libre', title: 'Temps libre 3', year: 2024, technique: 'Acrylique sur toile', dimensions: '130 x 97 cm', signature: 'Signée au dos', price: '2700', description: '', images: [oeuvre('temps-libre-3')], category: 'toile', isFeatured: false, status: 'available' },
    { id: 'vita-lenta', serie: 'on-dirait-le-sud', title: 'Vita lenta', year: 2025, technique: 'Acrylique sur toile', dimensions: '100 x 70 cm', signature: 'Signée au dos', price: '1600', description: '', images: [oeuvre('vita-lenta')], category: 'toile', isFeatured: false, status: 'available' },
    { id: 'monotype-serie', serie: 'on-dirait-le-sud', title: 'Monotype série', year: 2025, technique: 'Collage sur toile', dimensions: '25 x 20 cm', signature: 'Signée au dos', price: '220', description: '', images: [oeuvre('monotype-serie')], category: 'toile', isFeatured: false, status: 'available' },
    { id: 'hors-ligne-1-0', serie: 'hors-ligne', title: 'Hors ligne 1.0', year: 2024, technique: 'Acrylique sur toile', dimensions: '130 x 97 cm', signature: 'Signée au dos', price: '2700', description: '', images: [oeuvre('hors-ligne-1-0')], category: 'toile', isFeatured: false, status: 'available' },
    { id: 'serigraphie-temps-libre', serie: 'temps-libre', title: 'Sérigraphie Temps libre', year: 2025, technique: 'Sérigraphie, 6 passages couleurs', dimensions: '70 x 50 cm', signature: 'Signée et numérotée', price: '150', description: '', images: [oeuvre('serigraphie-temps-libre')], category: 'serigraphie', isFeatured: false, status: 'available' },
    { id: 'hors-lignes-5', serie: 'hors-ligne', title: 'Hors lignes 5', year: 2024, technique: 'Acrylique sur papier', dimensions: '100 x 70 cm', signature: 'Signée au devant', price: '1600', description: '', images: [oeuvre('hors-lignes-5')], category: 'papier', isFeatured: false, status: 'available' },
    { id: 'hors-ligne-1', serie: 'hors-ligne', title: 'Hors ligne 1', year: 2024, technique: 'Acrylique sur papier teinté', dimensions: '70 x 50 cm', signature: 'Signée au devant', price: '950', description: '', images: [oeuvre('hors-ligne-1')], category: 'papier', isFeatured: false, status: 'available' },
    { id: 'hors-ligne-2', serie: 'hors-ligne', title: 'Hors ligne 2', year: 2024, technique: 'Acrylique sur papier teinté', dimensions: '70 x 50 cm', signature: 'Signée au devant', price: '950', description: '', images: [oeuvre('hors-ligne-2')], category: 'papier', isFeatured: false, status: 'available' },
    { id: 'temps-libre-1-618', serie: 'temps-libre', title: 'Temps libre 1.618', year: 2024, technique: 'Acrylique sur toile', dimensions: '150 x 100 cm', signature: 'Signée au dos', price: '3000', description: 'Composition en rectangle d\'or : paysage, nature, végétation. Le travail sur la trame et les lignes horizontales joue avec la perception de l\'espace et du volume. Cette composition graphique se lit de façon vibrante, entre abstraction et figuration.', images: [oeuvre('temps-libre-1-618')], category: 'toile', isFeatured: false, status: 'available' },
    { id: 'hors-lignes-3', serie: 'hors-ligne', title: 'Hors lignes 3', year: 2024, technique: 'Acrylique et crayon sur papier', dimensions: '40 x 35 cm', signature: 'Signée au dos', price: '450', description: '', images: [oeuvre('hors-lignes-3')], category: 'papier', isFeatured: false, status: 'available' },
    { id: 'temps-libre-voile', serie: 'temps-libre', title: 'Temps libre voile', year: 2024, technique: 'Acrylique sur toile', dimensions: '70 x 50 cm', signature: 'Signée au dos', price: '950', description: '', images: [oeuvre('temps-libre-voile')], category: 'toile', isFeatured: false, status: 'available' },
    { id: 'hors-lignes-1-0', serie: 'hors-ligne', title: 'Hors lignes 1.0', year: 2022, technique: 'Acrylique et crayon sur papier', dimensions: '70 x 50 cm', signature: 'Signée au devant', price: '950', description: '', images: [oeuvre('hors-lignes-1-0')], category: 'papier', isFeatured: false, status: 'available' },
    { id: 'temps-libre-2-0', serie: 'temps-libre', title: 'Temps libre 2.0', year: 2024, technique: 'Acrylique sur toile', dimensions: '130 x 97 cm', signature: 'Signée au dos', price: '2700', description: '', images: [oeuvre('temps-libre-2-0')], category: 'toile', isFeatured: false, status: 'available' },
    { id: 'le-temps-libre', serie: 'temps-libre', title: 'Le temps libre', year: 2024, technique: 'Acrylique sur toile', dimensions: '196 x 146 cm', signature: 'Signée au dos', price: '5200', description: 'Cette composition explore la densité des flux et des trajectoires quotidiennes dans les lieux de rencontre. Le trait souligne le rythme des passants dans un présent en mouvement et saisit la vitalité des échanges au cœur du tissu urbain.', images: [oeuvre('le-temps-libre')], category: 'toile', isFeatured: true, status: 'available' },
    { id: 'lignes-de-vies-2', serie: 'lignes-de-vies', title: 'Lignes de vies 2', year: 2025, technique: 'Acrylique sur toile', dimensions: '100 x 81 cm', signature: 'Signée au dos', price: '1800', description: 'Lignes de vie est une série de toiles représentant des éléments essentiels pour l\'artiste, comme la maison, l\'atelier ou l\'amour.', images: [oeuvre('lignes-de-vies-2')], category: 'toile', isFeatured: false, status: 'available' },
    // Pastille rouge dans le catalogue d'Adrien : vendue.
    { id: 'lignes-de-vies', serie: 'lignes-de-vies', title: 'Lignes de vies', year: 2025, technique: 'Acrylique sur toile', dimensions: '100 x 100 cm', signature: 'Signée au dos', price: '2000', description: 'Lignes de vie est une série de toiles représentant des éléments essentiels pour l\'artiste, comme la maison, l\'atelier ou l\'amour.', images: [oeuvre('lignes-de-vies')], category: 'toile', isFeatured: false, status: 'sold' },

    // ── Fresques (portfolio 2026) ──
    { id: 'plein-sud-saint-roch', title: 'Plein Sud — Saint Roch Social Club', year: 2022, technique: 'Fresque', dimensions: '1000 m²', lieu: 'Montpellier', description: 'Parasols, corps en mouvement, panorama figuratif et abstrait : l\'artiste joue sur les dimensions, les points de vue et les couleurs. Les traits se multiplient et l\'œil se pose naturellement sur les tons vifs et les contours vibrants. Cette fresque monumentale traite de l\'effervescence des lieux de passage et place la figure humaine au cœur d\'un récit abstrait, entièrement composé par la couleur.', images: fresque('plein-sud-saint-roch', 3), category: 'fresque', isFeatured: true, status: 'private' },
    { id: 'granholat', title: 'Granholat', year: 2024, technique: 'Fresque', dimensions: '18 x 13 m', lieu: 'Médiathèque de Graulhet', description: 'Lauréat de l\'appel à projets de fresque pour la médiathèque de Graulhet, porté par l\'agglomération Gaillac Graulhet, l\'association Cisart et l\'association LineUp. Le récit s\'ancre dans l\'histoire de Graulhet, ancienne capitale du cuir née autour de sa rivière. La superposition des échelles révèle la magie fondatrice de ce cours d\'eau, à l\'origine de l\'activité et des usages quotidiens.', images: fresque('granholat', 2), category: 'fresque', isFeatured: true, status: 'private' },
    { id: 'raconte-moi-carnon', title: 'Raconte-moi Carnon', technique: 'Fresque', dimensions: '18 x 11 m', lieu: 'Carnon, Mauguio', description: 'Projet culturel de la ville de Mauguio Carnon, fresque réalisée avec l\'association LineUp. Un visuel qui raconte l\'identité de Carnon par ses signes familiers : horizons, cabanes de pêcheurs, scènes de plage et mouvements de bateaux composent une mise en abyme du temps libre à Carnon.', images: fresque('raconte-moi-carnon', 1), category: 'fresque', isFeatured: true, status: 'private' },
    { id: 'stereovision', title: 'Stéréovision', technique: 'Fresque', dimensions: '12 x 10 m', lieu: 'Bayonne', description: 'Festival d\'arts urbains Point de vue, ville de Bayonne. Cette œuvre incarne la jeunesse de Bayonne dans une composition originale qui mêle plusieurs plans, des échelles variées et différentes techniques. Les couleurs ont été choisies en lien avec le sport local.', images: fresque('stereovision', 1), category: 'fresque', isFeatured: false, status: 'private' },
    { id: 'colorsup', title: 'ColorsUp', year: 2024, technique: 'Fresque', dimensions: '', lieu: 'Restaurant universitaire Richter, Montpellier', description: 'Projet du Crous réalisé au restaurant universitaire Richter, avec la participation d\'étudiants : portrait et volume. Conçu avec eux, ce portrait s\'intègre naturellement au lieu et devient un point d\'identification pour les jeunes qui y vivent.', images: fresque('colorsup', 2), category: 'fresque', isFeatured: false, status: 'private' },
    { id: 'parisienne', title: 'Parisienne', technique: 'Fresque', dimensions: '50 m²', lieu: 'Pantin', description: 'Programme de renouvellement urbain de la ville de Pantin, fresque réalisée avec l\'association L\'Écluse. Le portrait en gros plan d\'une femme au chapeau, le regard tourné vers l\'avenir, parmi les monuments et l\'architecture de Pantin. Pensée pour durer, sa présence accompagne les habitants d\'un quartier en pleine transformation.', images: fresque('parisienne', 1), category: 'fresque', isFeatured: false, status: 'private' },
    { id: 'plein-sud-2', title: 'Plein Sud 2', year: 2023, technique: 'Fresque', dimensions: '4 x 20 m', lieu: 'Sérignan', description: 'Festival street art de la ville de Sérignan. Le format horizontal, pensé comme une bande dessinée, déroule un récit en séquences qui accompagne la promenade le long de l\'Orb. Abstraction et figuration s\'y mêlent dans des couleurs fluo qui évoquent la saturation des plages.', images: fresque('plein-sud-2', 1), category: 'fresque', isFeatured: false, status: 'private' },
    { id: 'cocktail', title: 'Cocktail', year: 2021, technique: 'Fresque', dimensions: '8 x 4 m', lieu: 'Rennes', description: 'Échange artistique avec les offices de tourisme de Montpellier et de Rennes. Une composition géométrique qui met en scène une figure tournée vers l\'horizon. L\'image évoque les plaisirs simples : un cocktail au bord de la mer, allongé sur le sable.', images: fresque('cocktail', 2), category: 'fresque', isFeatured: false, status: 'private' },
    { id: '34-degres', title: '34 degrés', year: 2021, technique: 'Fresque', dimensions: '43 x 3 m', lieu: 'Le Mur de Pérols', description: 'Installé le long de la route du littoral, ce panoramique de 43 mètres se lit d\'un coup d\'œil. Il offre un échantillon de la destination à travers une suite d\'objets emblématiques.', images: fresque('34-degres', 1), category: 'fresque', isFeatured: false, status: 'private' },
    { id: 'etang-de-l-or', title: 'Étang de l\'or', year: 2024, technique: 'Fresque', dimensions: '20 m²', lieu: 'Pérols', description: 'Réhabilitation d\'un transformateur électrique Enedis pour la ville de Pérols. L\'intervention montre comment des structures techniques deviennent des signaux visuels poétiques. L\'eau est au cœur du projet, par ses couleurs comme par sa représentation, comme une promenade au bord de l\'étang.', images: fresque('etang-de-l-or', 2), category: 'fresque', isFeatured: false, status: 'private' },
  ],
  news: [
    {
      id: 'catalogue-2026',
      title: 'Le catalogue 2026 est en ligne',
      date: '2026-10-17',
      content: 'Dix-neuf œuvres, des toiles « On dirait le sud » aux séries « Temps libre » et « Hors ligne ». À voir dans le catalogue.',
      images: ['/oeuvres/couverture-catalogue-2026.webp', oeuvre('on-dirait-le-sud-146-x-97'), oeuvre('on-dirait-le-sud-116-x-89')],
      category: 'studio',
      link: CATALOGUE_PDF,
      linkLabel: 'Télécharger le catalogue (PDF)',
    },
    {
      id: 'civilisation',
      title: 'Civilisation — Galerie Cilas',
      date: '2026',
      content: 'Avec Civilisation, la Galerie Cilas réunit quatre artistes montpelliérains, Mara, Adrien Da Silva, Julien Barriol et Salamech, autour d\'une réflexion commune sur nos codes, nos traces et nos héritages contemporains.',
      images: [],
      category: 'exhibition',
    },
    {
      id: 'temps-libre',
      title: 'Temps libre',
      date: '2025',
      content: 'Il y a comme un vent de fraîcheur qui souffle dans l\'atelier d\'Adrien Da Silva dernièrement. Les couleurs sont douces, la toile de lin brut recouverte d\'une fine couche de peinture blanche laisse entrevoir la matière çà et là, les compositions sont joyeuses et sereines : on peut presque entendre le bruit de la foule de badauds déambulant dans les allées d\'un marché, un dimanche matin d\'été. Une image que nous avons tous bien en tête : la flânerie d\'une balade en ville, les divagations de l\'esprit lorsque, installés à la terrasse d\'un café, nous nous prenons à rêvasser…\n\nCe sont ces instants-là que l\'artiste a choisi de décrire, sans trop d\'artifices. Ce temps libre si précieux et si crucial, quelle que soit sa forme. Il nous déconnecte d\'un train-train bien huilé qui s\'apparente parfois plus à un sprint sans fin qu\'à une course de fond. Comme une respiration, il a cette faculté de nous soulager et de nous recharger dans le même temps.\n\nCe temps libre, l\'artiste se plaît à le représenter depuis quelques années déjà, sans toutefois verbaliser le pourquoi de cette intention, alors qu\'elle réside simplement dans le désir de montrer la beauté, la simplicité et l\'authenticité de ces moments, d\'offrir une pause contemplative et de revenir à une forme de réalité plus terre-à-terre et ancrée dans l\'instant présent. Il observe puis capture des images mentales pour en livrer une interprétation personnelle, comme s\'il cherchait à immortaliser ces moments pour toujours en les fixant sur la toile. Jour après jour, il passe son temps à peindre le temps libre des autres, sorte de mise en abîme involontaire mais néanmoins captivante.\n\nSe laisser la liberté de s\'arrêter et de contempler. Pour lui, la vérité de l\'humain se loge là.',
      images: [oeuvre('le-temps-libre'), oeuvre('temps-libre-3'), oeuvre('temps-libre-2-0')],
      category: 'exhibition',
    },
  ],
  exhibitions: [],
  press: [],
  portfolio: [],
  theme: {
    bgColor: '#f4f1ea', // papier ; texte à l'encre outremer (piste D)
    paletteId: 'outremer',
  },
  homeNav: [
    { direction: 'bio', label: 'Adrien Da Silva', subtitle: 'Peintre et muraliste — Montpellier', route: '/profile', image: '/atelier/adrien-au-travail.webp', textColor: '#1d1aa8' },
    { direction: 'up', label: 'Catalogue', subtitle: '19 œuvres · 2026', route: '/catalogue', image: oeuvre('on-dirait-le-sud-146-x-97'), textColor: '#1d1aa8' },
    { direction: 'right', label: 'Fresques', subtitle: 'Œuvres murales', route: '/fresques', image: '/fresques/raconte-moi-carnon-1.webp', textColor: '#1d1aa8' },
    { direction: 'center', label: 'Journal', subtitle: 'Actualités et expositions', route: '/journal', image: oeuvre('le-temps-libre'), textColor: '#1d1aa8' },
    { direction: 'center', label: 'Filtre', subtitle: 'Votre photo en lignes', route: '/filter', image: oeuvre('temps-libre-2-0'), textColor: '#1d1aa8' },
    { direction: 'down', label: 'Contact', subtitle: 'Écrire à l\'artiste', route: '/contact', image: oeuvre('lignes-de-vies'), textColor: '#1d1aa8' },
  ],
  menuConfig: {
    items: [
      { label: 'Accueil', route: '/', textColor: '#1d1aa8' },
      { label: 'Catalogue', route: '/catalogue', textColor: '#1d1aa8' },
      { label: 'Fresques', route: '/fresques', textColor: '#1d1aa8' },
      { label: 'Journal', route: '/journal', textColor: '#1d1aa8' },
      { label: 'Filtre', route: '/filter', textColor: '#1d1aa8' },
      { label: 'Contact', route: '/contact', textColor: '#1d1aa8' },
    ],
    lineColor: '#1d1aa8',
    lineThickness: 4,
    lines: [
      { color: '#1d1aa8', thickness: 4, offsetX: 10, width: 35 },
      { color: '#1d1aa8', thickness: 4, offsetX: 45, width: 30 },
      { color: '#1d1aa8', thickness: 4, offsetX: 15, width: 40 },
      { color: '#1d1aa8', thickness: 4, offsetX: 50, width: 25 },
      { color: '#1d1aa8', thickness: 4, offsetX: 20, width: 35 },
    ],
  },
  contactEmail: 'adrien.enaer@gmail.com',
  // Numéro du portfolio 2026 d'Adrien (dos de couverture)
  whatsapp: '33684732265',
  // Dossier « Site Adrien » du Drive de Myriam (sous-dossiers Toiles, Papiers, Sérigraphies, Fresques, Journal)
  driveFolderUrl: 'https://drive.google.com/drive/folders/1fs_EJVulvBkTltv4dQdtj8b1j1mpzV6j',
};
