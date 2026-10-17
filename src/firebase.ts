import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBVK6S7_YlDH7jNJayGL5c4j1STX4VxpSI",
  authDomain: "artist-portfolio-28ba9.firebaseapp.com",
  projectId: "artist-portfolio-28ba9",
  storageBucket: "artist-portfolio-28ba9.firebasestorage.app",
  messagingSenderId: "194689703586",
  appId: "1:194689703586:web:30dec428ba551515ed41fb",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

/**
 * Comptes Google autorisés à modifier le site. La même liste doit figurer dans
 * les règles Firestore et Storage (firestore.rules, storage.rules) : ce sont elles qui protègent.
 */
export const ADMIN_EMAILS = ['adrien.enaer@gmail.com', 'myriam.ajabi@gmail.com'];
