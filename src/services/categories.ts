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

export interface Category {
  id: string;
  title: string;
  allocated: number;
  parentId: string | null;
  type: 'main' | 'sub';
  createdAt: any; 
}

export async function getCategories(userId: string): Promise<Category[]> {
  const categoriesRef = collection(firestore, 'budjetit', userId, 'categories');
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

export async function updateCategory(
  userId: string,
  categoryId: string,
  { title, allocated }: { title: string; allocated: number }
): Promise<void> {
  const categoryDocRef = doc(firestore, 'budjetit', userId, 'categories', categoryId);
  await updateDoc(categoryDocRef, {
    title,
    allocated,
  });
}

export async function deleteCategory(
  userId: string,
  categoryId: string
): Promise<void> {
  const categoryDocRef = doc(firestore, 'budjetit', userId, 'categories', categoryId);
  await deleteDoc(categoryDocRef);
  
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

export interface DefaultCategory {
  title: string;
  subs?: string[];
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  {
    title: 'Lainat',
    subs: [
      'Asuntolaina',
      'Opintolaina',
      'Autolaina',
      'Kulutusluotto',
      'Luottokortti',
      'Lainat yhteensä',
    ],
  },
  {
    title: 'Asuminen',
    subs: ['Yhtiövastike', 'Vesi', 'Sähkö', 'Asuminen yhteensä'],
  },
  {
    title: 'Vakuutukset',
    subs: ['Kotivakuutus', 'Autovakuutus', 'Vakuutukset yhteensä'],
  },
  {
    title: 'Ruoka',
    subs: ['Ruokakauppa', 'Ulkona syönti', 'Tilausruoka', 'Ruoka yhteensä'],
  },
  {
    title: 'Liikenne',
    subs: [
      'Bensa',
      'Julkinen liikenne',
      'Liikenne yhteensä',
    ],
  },
  {
    title: 'Harrastukset',
    subs: ['Kuntosali', 'Harrastukset yhteensä'],
  },
  {
    title: 'Terveys',
    subs: ['Lääkäri', 'Lääkkeet', 'Terveys yhteensä'],
  },
  {
    title: 'Kauneus',
    subs: ['Parturi', 'Ihonhoito', 'Kauneus yhteensä'],
  },
  {
    title: 'Viihde ja elektroniikka',
    subs: ['Puhelinlasku', 'Suoratoistopalvelut', 'Netti', 'Viihde ja elektroniikka yhteensä'],
  },
  {
    title: 'Lemmikit',
    subs: ['Ruoka', 'Harrastukset', 'Lääkärit', 'Lemmikit yhteensä'],
  },
  {
    title: 'Muut menot',
    subs: ['Vaatteet', 'Hupitili', 'Muut menot yhteensä'],
  },
];

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
