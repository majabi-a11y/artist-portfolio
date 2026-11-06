import type { PfBlock, PfSheet } from './defaultData';

/** Le portfolio 2026 d'Adrien (« PORTFOLIO 26 AD.pdf ») refait en pages modifiables ; positions en % de la page. */
export const APLAT = '#281c42';
const P = '/portfolio/p/';
const INK = '#1c2a6e';
const PINK = '#f06a9b';

let n = 0;
const img = (file: string, x: number, y: number, w: number, h: number): PfBlock =>
  ({ id: `b${++n}`, kind: 'image', src: `${P}${file}.jpg`, x, y, w, h });
const txt = (text: string, x: number, y: number, w: number, size = 10.5, extra: Partial<PfBlock> = {}): PfBlock =>
  ({ id: `b${++n}`, kind: 'text', text, x, y, w, h: 0, size, ...extra });
const full = (file: string) => img(file, 0, 0, 100, 100);

const BIO = `Dans ses compositions, Adrien Da Silva nous guide pour
observer son environnement : aplats de couleurs, trame de
lignes et espaces traversés, autant d’éléments qui nourrissent
un foisonnement narratif qui lui est propre.

Adrien alterne entre représentations figuratives et abstraites,
une manière de façonner la réalité en la juxtaposant à son
imagination.
De ses œuvres naissent plusieurs interprétations d’un même
sujet, elles se complètent.
Il faut regarder son travail sous plusieurs angles pour en saisir
l’ensemble. Adrien représente ainsi des scènes de vies ou
paysages qui évoluent dans un univers symbolisant leur propre
conscience.
Tandis que les proportions se développent au rythme de son
geste, les traits se multiplient et finalement synthétise l’idée de
départ.

Rien n’est statique, tout est dynamique.`;

const CV: [string, number, number, number, string][] = [
  ['2020', 12.8, 17.2, 11.8, `Exposition Stéréovision collaboration avec Mara/
Le cabinet d'amateur/Paris
Assistant artiste Hien/Médiatheque Montpellier
Exposition collective/La Serre/Montpellier
Assistant Artiste Zest/K-LIVE/Sète
Exposition collective X Y Z/Pierre Vive/Montpellier`],
  ['2021', 12.8, 17.2, 31.1, `Exposition collective/Urban signature/Paris
Fresque Festival Fenêtre sur rue/Paris
Fresque Festival K-live/Sète
Exposition collective/Humble Galerie/Ile de Ré
Fresque échange Artistique/ASARUE/Rennes
Fresque/Le M.U.R/Pérols`],
  ['2022', 12.8, 17.2, 50.7, `Galerie éphémère/Installation/Villeuneuve-lès-
Maguelones
Fresque Office de tourisme/Montpellier
Assistant Franck Noto/Pont vezinhet Montpellier
Fresque Plein Sud/St rock social club/Montpellier`],
  ['2023', 53.4, 58.4, 11.6, `Fresque galerie éphémère/Villeneuve
Fresque intérieur résidence 56/Montpellier
Exposition personnelle Plein Sud/Château de
melgeuil/Mauguio
Fresque street art festival/Serignan
Exposition collective/Galerie Urban Signature/Paris
Assistant Fred Battle/Fresque/Lunel`],
  ['2024', 53.4, 58.4, 31, `Fresque ENEDIS/Pérols
Fresque Fenêtre sur rue/L’écluse/Paris
Fresque Plein Sud/Carnon
Fresque Mur intérieur/CHU/Montpellier
Exposition personnelle Temps libre/St ravy/Montpellier
Lauréat AAP fresque/Médiathèque/Graulhet
Assistant Olivier Kenneybrew/Fresque/Montpellier
Fresque et atelier/Colors Up/Crous/Montpellier`],
  ['2025', 53.4, 58.4, 50.7, `Assistant Nelio & Rero/fresque/Montpellier
Assistant Adec/fresque/Rechicourt le Château
Exposition collective/Aerochrome/Blagnac
Fresque festival K-Live/Sète
Exposition collective/Galerie Cilas
Fresque festival Plein champs/Le Mans
Exposition Salon d’art/Montpellier`],
];

export const DEFAULT_SHEETS: PfSheet[] = [
  { id: 's1', name: 'Couverture', blocks: [
    full('01'),
    txt('ADRIEN DASILVA', 3.5, 47.1, 15, 18.8, { color: INK }),
    txt('Portfolio', 4.8, 50.3, 8, 19, { color: INK }),
    txt('2026', 11.76, 50.3, 6, 19, { color: PINK }),
  ] },
  { id: 's2', name: 'Présentation', bg: 'aplat', blocks: [img('02', 50, 0, 50, 100), txt(BIO, 10.2, 23.9, 36, 14)] },
  { id: 's3', name: 'Pleine page', blocks: [full('03')] },
  { id: 's4', name: 'Parcours', bg: 'aplat', blocks: [
    img('04', 0, 68.7, 100, 31.3),
    txt('PARCOURS ARTISTIQUE', 8.1, 4.8, 40, 16),
    ...CV.flatMap(([year, xy, xt, y, items]) => [txt(year, xy, y - 0.2, 5, 17.5), txt(items, xt, y + 0.1, 36, 14.7, { lead: 1.16 })]),
  ] },
  { id: 's5', name: 'Hors lignes', blocks: [full('05')] },
  { id: 's6', name: 'Hors lignes, vue entière', blocks: [
    img('06', 8.82, 2.02, 82.03, 87.05),
    txt('Hors lignes / Résidence ADOMA Nîmes / 2026', 30, 92.2, 40, 12.5, { align: 'center' }),
  ] },
  { id: 's7', name: 'Plein Sud Saint Roch', blocks: [full('07')] },
  { id: 's8', name: 'Plein Sud Saint Roch, détails', blocks: [
    img('08a', 2.02, 19, 60.45, 60.69), img('08b', 63.98, 19.12, 33.84, 60.69),
    txt(`Plein Sud Saint Roch Social Club Montpellier
Fresque de 1000 m2
Parasol, corps en mouvement, panorama figuratif et abstrait.
L’artiste joue sur les dimensions , les points de vues et les couleurs.
Les traits se multiplient et notre oeil se dirige naturellement sur les ton vifs
et contours vibrant.`, 64.2, 81.1, 34, 11.8, { lead: 1.34 }),
    txt('Vidéo- PLEIN SUD/ Adrien Dasilva Enaer x Line up/Montpellier', 64.2, 92.4, 34, 11.8, { color: '#3f76b5' }),
  ] },
  { id: 's9', name: 'Granholat', blocks: [
    img('09a', 0, 0, 65.5, 100), img('09b', 69.02, 18.05, 28.3, 41.81),
    txt(`Granholat
Lauréat de l’appel à projet de fresque sur la médiathèque de Graulhet
porté par l’agglomération Gaillac Graulhet , l’association Cisart et
l’association LineUp
18mx13m.`, 69.3, 66, 29, 10.5),
  ] },
  { id: 's10', name: 'Raconte-moi Carnon', blocks: [
    img('10', 0, 0, 81.8, 100),
    txt(`Raconte-moi Carnon
Projet culturel Ville de Mauguio Carnon
Fresque réalisée en collaboration
avec l’association LineUp.
18 x 11 m.`, 82.3, 78.1, 17.6, 11.9),
  ] },
  { id: 's11', name: 'Paysage Lepic', blocks: [
    img('11a', 0, 0, 53.1, 100), img('11b', 57.35, 4.87, 38.79, 72.92),
    txt(`Paysage Lepic
Résidence site EAI Montpellier
2026`, 61.2, 81.6, 30, 12.3),
  ] },
  { id: 's12', name: 'ColorsUp', blocks: [
    img('12a', 2.69, 18.29, 45.68, 63.18), img('12b', 51.89, 18.53, 44.92, 63.54),
    txt(`ColorsUp
Projet du Crous réalisé au restaurant universitaire de Richter
avec la participation d’étudiants
Portrait et Volume`, 3, 83.7, 40, 10.5),
  ] },
  { id: 's13', name: 'Parisienne', blocks: [
    img('13', 0, 0, 100, 82.7),
    txt(`Parisienne
Programme de renouvellement urbain
Ville de Pantin
Fresque réalisée en collaboration
avec l’association L’écluse.
50 m2.`, 1.8, 84.9, 30, 12),
  ] },
  { id: 's14', name: 'Plein Sud 2', blocks: [
    img('14', 0, 0, 100, 78),
    txt(`Plein Sud 2
Festival street art
Ville de Sérignan
4 x 20 m2.`, 50.8, 83.7, 20, 11.7),
  ] },
  { id: 's15', name: 'Cocktail', blocks: [
    img('15a', 0, 17.7, 68.9, 63.18), img('15b', 69.61, 17.58, 30.39, 63.3),
    txt(`Cocktail
Échange artistique en collaboration avec
l’office du tourisme de Montpellier et
Rennes
Ville de Rennes
8 x 4 m2.`, 70, 84.9, 25, 11.9),
  ] },
  { id: 's16', name: 'Stéréovision', blocks: [
    img('16', 0, 0, 81.8, 100),
    txt(`Stéréovision
Festival d’arts urbains Point de vue
Ville de Bayonne
12 x 10 m2.`, 83, 82.4, 16.5, 11.7),
  ] },
  { id: 's17', name: '34 degrés', blocks: [
    img('17', 0, 39.79, 100, 20.07),
    txt(`34 degrés
Le Mur de Pérols
Ville de Pérols
43 x 3 m2.`, 35, 72.9, 30, 11.4, { align: 'center' }),
  ] },
  { id: 's18', name: 'Étang de l’or', blocks: [
    img('18a', 0, 0, 53.05, 100), img('18b', 58.61, 25.65, 36.19, 48.22),
    txt(`Étang de l’or
Projet de réhabilitation de transformateur
électrique Enedis
Ville de Pérols
20 m2.`, 59, 80.5, 30, 12),
  ] },
  { id: 's19', name: '4e de couverture', blocks: [
    img('19', 0, 0, 51.2, 100),
    txt(`ADRIEN DASILVA
15 rue du professeur Jean Granier
34070 Montpellier
Adrien.enaer@gmail.com
Instagram adrien_dasilva`, 59.6, 42.5, 30, 20, { color: INK, align: 'center' }),
  ] },
  // Pages de l'ancien portfolio, absentes du nouveau : en réserve, à remettre d'un clic
  { id: 'r1', name: 'Ancien : Le temps libre', hidden: true, blocks: [full('old-temps-libre')] },
  { id: 'r2', name: 'Ancien : toiles 1', hidden: true, blocks: [full('old-toiles-1')] },
  { id: 'r3', name: 'Ancien : toiles 2', hidden: true, blocks: [full('old-toiles-2')] },
  { id: 'r4', name: 'Ancien : index 1 (anglais)', hidden: true, blocks: [full('old-index-1')] },
  { id: 'r5', name: 'Ancien : index 2 (anglais)', hidden: true, blocks: [full('old-index-2')] },
];
