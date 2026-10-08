// Database abstraction layer supporting Firebase Firestore with JSON/LocalStorage fallback
import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';
import { cloudinaryConfig, isCloudinaryConfigured } from './cloudinary-config.js';

let app = null;
let db = null;
let auth = null;

let initializePromise = null;

// Initialize Firebase if configured
async function initFirebase() {
  if (initializePromise) return initializePromise;

  initializePromise = (async () => {
    if (isFirebaseConfigured()) {
      try {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
        
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        console.log("Firebase initialized successfully.");
      } catch (err) {
        console.warn("Firebase initialization failed, falling back to local storage:", err);
      }
    } else {
      console.log("Firebase credentials not configured. Using local JSON / LocalStorage fallback.");
    }
  })();

  return initializePromise;
}

// XSS Prevention helper
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  if (typeof str !== 'string') return String(str);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper to determine relative path to data folder from current location
function getDataPath(filename) {
  const isSubFolder = window.location.pathname.includes('/admin/');
  const prefix = isSubFolder ? '../data/' : './data/';
  const fileMap = {
    'pages': 'home'
  };
  const target = fileMap[filename] || filename;
  return `${prefix}${target}.json`;
}

// GET Single Document
export async function getDoc(collectionName, docId) {
  await initFirebase();
  
  if (db) {
    try {
      const { doc, getDoc: getFirestoreDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
      const docRef = doc(db, collectionName, docId);
      const snap = await getFirestoreDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
    } catch (e) {
      console.warn(`Firestore getDoc(${collectionName}/${docId}) error, checking local fallback:`, e);
    }
  }

  // Fallback: local storage override or JSON file
  const localKey = `danan_${collectionName}_${docId}`;
  const localData = localStorage.getItem(localKey);
  if (localData) {
    return JSON.parse(localData);
  }

  try {
    const res = await fetch(getDataPath(collectionName));
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json)) {
        return json.find(item => item.id === docId) || null;
      }
      return json[docId] || json;
    }
  } catch (err) {
    console.error(`Error loading fallback for ${collectionName}:`, err);
  }

  return null;
}

// GET Collection
// Helper to normalize image paths for admin vs root pages
export function fixImgPath(path, isSubFolder = true) {
  if (!path || typeof path !== 'string') return '';
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  if (isSubFolder && path.startsWith('./assets/')) {
    return '../' + path.substring(2);
  }
  if (!isSubFolder && path.startsWith('../assets/')) {
    return './' + path.substring(3);
  }
  return path;
}

export async function getCollection(collectionName) {
  await initFirebase();

  const deletedKey = `danan_deleted_${collectionName}`;
  const deletedIds = JSON.parse(localStorage.getItem(deletedKey) || '[]');

  function filterDeleted(list) {
    if (!Array.isArray(list)) return [];
    if (deletedIds.length === 0) return list;
    return list.filter(item => item && !deletedIds.includes(item.id));
  }

  if (db) {
    try {
      const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
      const colRef = collection(db, collectionName);
      let snap;
      try {
        const q = query(colRef, orderBy("order", "asc"));
        snap = await getDocs(q);
      } catch (err) {
        snap = await getDocs(colRef);
      }
      if (!snap.empty) {
        const list = [];
        snap.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        return filterDeleted(list);
      }
    } catch (e) {
      console.warn(`Firestore getCollection(${collectionName}) failed, using local fallback:`, e);
    }
  }

  // Check local storage fallback first
  const localKey = `danan_col_${collectionName}`;
  const localList = localStorage.getItem(localKey);
  if (localList) {
    try {
      const parsedLocal = JSON.parse(localList);
      if (Array.isArray(parsedLocal)) {
        return filterDeleted(parsedLocal);
      }
    } catch(e) {}
  }

  // Fetch initial JSON fallback and populate local storage
  try {
    const res = await fetch(getDataPath(collectionName));
    if (res.ok) {
      const json = await res.json();
      let freshList = [];
      if (Array.isArray(json)) {
        freshList = json;
      } else if (typeof json === 'object') {
        freshList = Object.keys(json).map(key => ({ id: key, ...json[key] }));
      }
      
      localStorage.setItem(localKey, JSON.stringify(freshList));
      return filterDeleted(freshList);
    }
  } catch (err) {
    console.error(`Error fetching collection fallback ${collectionName}:`, err);
  }

  return [];
}

// SAVE Document
export async function saveDoc(collectionName, docId, data) {
  await initFirebase();

  const timestamp = new Date().toISOString();
  const payload = { ...data, updatedAt: timestamp };

  let savedInFirestore = false;
  if (db) {
    try {
      const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, payload, { merge: true });
      savedInFirestore = true;
    } catch (e) {
      console.warn(`Firestore setDoc error in ${collectionName}/${docId}:`, e);
    }
  }

  // Remove from deleted tracking if re-added
  const deletedKey = `danan_deleted_${collectionName}`;
  let deletedIds = JSON.parse(localStorage.getItem(deletedKey) || '[]');
  if (deletedIds.includes(docId)) {
    deletedIds = deletedIds.filter(id => id !== docId);
    localStorage.setItem(deletedKey, JSON.stringify(deletedIds));
  }

  // Always update localStorage fallback for responsive UI & offline capability
  if (docId) {
    localStorage.setItem(`danan_${collectionName}_${docId}`, JSON.stringify({ id: docId, ...payload }));
  }

  // If array collection, sync local collection array
  const localColKey = `danan_col_${collectionName}`;
  let existingCol = JSON.parse(localStorage.getItem(localColKey) || '[]');
  const idx = existingCol.findIndex(item => item.id === docId);
  if (idx >= 0) {
    existingCol[idx] = { id: docId, ...payload };
  } else {
    existingCol.push({ id: docId, ...payload });
  }
  localStorage.setItem(localColKey, JSON.stringify(existingCol));

  return { id: docId, firestore: savedInFirestore, ...payload };
}

// DELETE Document
export async function deleteDoc(collectionName, docId) {
  await initFirebase();

  if (db) {
    try {
      const { doc, deleteDoc: firestoreDelete } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
      const docRef = doc(db, collectionName, docId);
      await firestoreDelete(docRef);
    } catch (e) {
      console.warn(`Firestore deleteDoc error:`, e);
    }
  }

  // Record deleted ID in local tracking
  const deletedKey = `danan_deleted_${collectionName}`;
  let deletedIds = JSON.parse(localStorage.getItem(deletedKey) || '[]');
  if (!deletedIds.includes(docId)) {
    deletedIds.push(docId);
    localStorage.setItem(deletedKey, JSON.stringify(deletedIds));
  }

  localStorage.removeItem(`danan_${collectionName}_${docId}`);
  const localColKey = `danan_col_${collectionName}`;
  let existingCol = JSON.parse(localStorage.getItem(localColKey) || '[]');
  existingCol = existingCol.filter(item => item.id !== docId);
  localStorage.setItem(localColKey, JSON.stringify(existingCol));

  return true;
}

// UPLOAD Image (Cloudinary or Base64 Data URL fallback)
export async function uploadImage(file) {
  if (isCloudinaryConfigured()) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', cloudinaryConfig.uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        return data.secure_url;
      } else {
        console.error("Cloudinary upload failed:", await res.text());
      }
    } catch (err) {
      console.error("Cloudinary upload error:", err);
    }
  }

  // Fallback to base64 Data URL for local testing
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

// SEED Initial Data to Firestore
export async function seedInitialData() {
  await initFirebase();

  const collections = ['settings', 'home', 'vehicles', 'faqs', 'rules', 'reviews', 'gallery', 'backgrounds'];
  const results = [];

  for (const name of collections) {
    try {
      const res = await fetch(getDataPath(name));
      if (res.ok) {
        const json = await res.json();
        if (name === 'settings') {
          await saveDoc('settings', 'site', json);
          results.push(`settings/site seeded.`);
        } else if (name === 'backgrounds') {
          await saveDoc('backgrounds', 'main', json);
          results.push(`backgrounds seeded.`);
        } else if (name === 'home') {
          await saveDoc('pages', 'home', json);
          results.push(`pages/home seeded.`);
        } else if (Array.isArray(json)) {
          for (const item of json) {
            await saveDoc(name, item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, item);
          }
          results.push(`${name} collection (${json.length} items) seeded.`);
        }
      }
    } catch (e) {
      console.error(`Failed to seed ${name}:`, e);
    }
  }

  return results;
}

export { auth, db };
