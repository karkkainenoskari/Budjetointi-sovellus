// src/services/categories.ts

import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { firestore } from '../api/firebaseConfig';

// Tyyppimäärittely, käytettäväksi myös UI:ssa
export interface Category {
  id: string;
  title: string;
  allocated: number;
  parentId: string | null;
  type: 'main' | 'sub';
  createdAt: any; // Timestamp, mutta UI voi käsitellä sitä kuten haluaa
}

/**
 * Hakee kaikki kategoriat tietyltä käyttäjältä.
 * Palautuu taulukko Category‐olioita.
 */
export async function getCategories(userId: string): Promise<Category[]> {
  const categoriesRef = collection(firestore, 'budjetit', userId, 'categories');
  // Järjestä luomisajan mukaan (vanhimmasta uusimpaan) tai haluamallasi järjestyksellä
  const q = query(categoriesRef, orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(q);
  const categories: Category[] = [];
  snapshot.forEach((docSnap) => {
    categories.push({
      id: docSnap.id,
      title: docSnap.data().title,
      allocated: docSnap.data().allocated,
      parentId: docSnap.data().parentId || null,
      type: docSnap.data().type,
      createdAt: docSnap.data().createdAt,
    });
  });
  return categories;
}

/**
 * Lisää uuden pää- tai alakategorian.
 * parentId = null jos pää, muuten pääkategorian id.
 */
export async function addCategory(
  userId: string,
  {
    title,
    allocated,
    parentId,
    type,
  }: { title: string; allocated: number; parentId: string | null; type: 'main' | 'sub' }
): Promise<string> {
  const categoriesRef = collection(firestore, 'budjetit', userId, 'categories');
   const docRef = await addDoc(categoriesRef, {
    title,
    allocated,
    parentId,
    type,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Päivittää olemassa olevaa kategoriaa (title ja/tai allocated).
 * parentId ja type eivät yleensä muutu muokkauksessa, mutta voit lisätä nekin parametrina, jos haluat.
 */
export async function updateCategory(
  userId: string,
  categoryId: string,
  { title, allocated }: { title: string; allocated: number }
): Promise<void> {
  const categoryDocRef = doc(firestore, 'budjetit', userId, 'categories', categoryId);
  await updateDoc(categoryDocRef, {
    title,
    allocated,
    // createdAt ei yleensä päivitetä, joten sitä ei kosketa
  });
}

/**
 * Poistaa kategorian (ja kaikki sen alikategoriat, jos parentId‐rakennetta ei muuten käsitellä).
 * HUOM: jos haluat varmistaa, että alakategoriat usein poistuvat oikein, kutsu ensin getSubcategories ja poista ne ennen tätä.
 */
export async function deleteCategory(
  userId: string,
  categoryId: string
): Promise<void> {
  const categoryDocRef = doc(firestore, 'budjetit', userId, 'categories', categoryId);
  await deleteDoc(categoryDocRef);
  
  // (Optionaali: poista myös alakategoriat, jos olet jo implementoinut parentId‐loogikan)
  const subCatsQuery = query(
    collection(firestore, 'budjetit', userId, 'categories'),
    where('parentId', '==', categoryId)
  );
  const subCatsSnapshot = await getDocs(subCatsQuery);
  for (const subSnap of subCatsSnapshot.docs) {
    await deleteDoc(
      doc(firestore, 'budjetit', userId, 'categories', subSnap.id)
    );
  }
}
// ──────────────────────────────────────────────────────────────────────────────
// Default categories
// ──────────────────────────────────────────────────────────────────────────────

export interface DefaultCategory {
  title: string;
  subs?: string[];
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  {
    title: 'Lainat',
    subs: [
      'Asuntolaina',
      'Taloyhtiölaina',
      'Opintolaina',
      'Autolaina',
      'Kulutusluotto',
      'Luottokortti',
      'Lainat yhteensä',
    ],
  },
  {
    title: 'Asuminen',
    subs: ['Yhtiövastike/vuokra', 'Vesi', 'Sähkö', 'Asuminen yhteensä'],
  },
  {
    title: 'Vakuutukset',
    subs: ['Kotivakuutus', 'Autovakuutus', 'Sairauskuluvakuutus', 'Vakuutukset yhteensä'],
  },
  {
    title: 'Ruoka',
    subs: ['Ruokakauppa', 'Ulkona syönti', 'Tilausruoka', 'Ruoka yhteensä'],
  },
  {
    title: 'Liikenne',
    subs: [
      'Bensa',
      'Bussi',
      'Autohuolto- ja renkaanvaihdot',
      'Pysäköintimaksut',
      'Ajoneuvovero',
      'Liikenne yhteensä',
    ],
  },
  {
    title: 'Harrastukset',
    subs: ['Kuntosali', 'Padel', 'Harrastukset yhteensä'],
  },
  {
    title: 'Terveys',
    subs: ['Lääkäri', 'Lääkkeet', 'Hieroja', 'Terveydenhuolto yhteensä'],
  },
  {
    title: 'Kauneus',
    subs: ['Kampaaja/parturi', 'Meikit', 'Ihonhoito', 'Kauneudenhoito yhteensä'],
  },
  {
    title: 'Viihde ja elektroniikka',
    subs: ['Puhelinlasku', 'Netflix', 'Spotify', 'Netti', 'Viihde ja elektroniikka yhteensä'],
  },
  {
    title: 'Lemmikit',
    subs: ['Ruoka', 'Harrastukset', 'Lääkärit', 'Lemmikit yhteensä'],
  },
  {
    title: 'Muut menot',
    subs: [
      'Vaatteet',
      'Juhliminen',
      'Sisustaminen',
      'Oma hupitili',
      'Varaus budjetin ylitykselle',
      'Muut menot yhteensä',
    ],
  },
];

/**
 * Luo käyttäjälle oletuskategoriat. Kutsutaan esim. rekisteröitymisen
 * jälkeen, jotta budjetointi voi alkaa heti valmiilla pohjalla.
 */
export async function seedDefaultCategories(userId: string): Promise<void> {
  for (const cat of DEFAULT_CATEGORIES) {
    const mainId = await addCategory(userId, {
      title: cat.title,
      allocated: 0,
      parentId: null,
      type: 'main',
    });
    if (cat.subs) {
      for (const sub of cat.subs) {
        await addCategory(userId, {
          title: sub,
          allocated: 0,
          parentId: mainId,
          type: 'sub',
        });
      }
    }
  }
}
