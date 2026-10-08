// Database abstraction layer supporting Firebase Firestore with Cloudinary uploads
import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';
import { cloudinaryConfig, isCloudinaryConfigured } from './cloudinary-config.js';

let app = null;
let db = null;
let auth = null;
let initializePromise = null;

// Per-page-load memoization cache for collection reads to avoid duplicate Firestore reads
const collectionMemoCache = new Map();

export function clearCollectionCache(collectionName) {
  if (collectionName) {
    collectionMemoCache.delete(collectionName);
  } else {
    collectionMemoCache.clear();
  }
}

// Determine if the current script is running within the Admin panel
export function isAdminContext() {
  return typeof window !== 'undefined' && 
    (window.location.pathname.includes('/admin/') || window.location.href.includes('/admin/'));
}

// Initialize Firebase if configured
export async function initFirebase() {
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
      } catch (err) {
        console.warn("Firebase initialization failed:", err);
        if (isAdminContext()) {
          throw new Error("Firebase initialization failed: " + (err.message || err));
        }
      }
    } else {
      if (isAdminContext()) {
        throw new Error("Firebase is not configured in js/firebase-config.js. Cannot perform admin operations.");
      }
    }
    return { app, db, auth };
  })();

  return initializePromise;
}

// XSS Sanitizer: complete character escape
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

// Whitelist HTML sanitizer allowing only <span>, <strong>, <em>, <br>
export function sanitizeHTML(html) {
  if (html === null || html === undefined) return '';
  if (typeof html !== 'string') return String(html);

  const div = document.createElement('div');
  div.textContent = html;
  let escaped = div.innerHTML;

  // Unescape safe allowed tags
  escaped = escaped
    .replace(/&lt;br\s*\/?&gt;/gi, '<br>')
    .replace(/&lt;strong&gt;/gi, '<strong>')
    .replace(/&lt;\/strong&gt;/gi, '</strong>')
    .replace(/&lt;em&gt;/gi, '<em>')
    .replace(/&lt;\/em&gt;/gi, '</em>')
    .replace(/&lt;span&gt;/gi, '<span>')
    .replace(/&lt;span class="([a-zA-Z0-9_\-\s]+)"&gt;/gi, '<span class="$1">')
    .replace(/&lt;span style="([a-zA-Z0-9_\-\s:;#]+)"&gt;/gi, '<span style="$1">')
    .replace(/&lt;\/span&gt;/gi, '</span>');

  return escaped;
}

// CSS URL Sanitizer to prevent CSS breakout or javascript: protocol
export function sanitizeCSSUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const clean = url.trim();
  const lower = clean.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('vbscript:') || 
      clean.includes('"') || clean.includes("'") || clean.includes(')')) {
    return '';
  }
  return clean;
}

// Normalize WhatsApp number to international format with country code (defaults to Sri Lanka +94)
export function normalizeWhatsAppNumber(raw) {
  if (!raw) return '94772013059';
  let clean = String(raw).replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '94' + clean.slice(1);
  } else if (!clean.startsWith('94') && clean.length === 9) {
    clean = '94' + clean;
  }
  return clean || '94772013059';
}

// Sanitize telephone number for tel: links
export function sanitizeTel(phone) {
  if (!phone) return '';
  return String(phone).replace(/[^\d+]/g, '');
}

// Sanitize email address for mailto: links
export function sanitizeMailto(email) {
  if (!email) return '';
  return encodeURIComponent(String(email).trim());
}

// Helper to determine relative path to data folder from current location
function getDataPath(filename, docId) {
  const isSubFolder = typeof window !== 'undefined' && window.location.pathname.includes('/admin/');
  const prefix = isSubFolder ? '../data/' : './data/';
  if (filename === 'pages' && docId) {
    if (docId === 'destinations') return `${prefix}destinations-page.json`;
    if (docId === 'bookings') return `${prefix}bookings-content.json`;
    return `${prefix}${docId}.json`;
  }
  const fileMap = {
    'destinations_page': 'destinations-page',
    'bookings_page': 'bookings-content'
  };
  const target = fileMap[filename] || filename;
  return `${prefix}${target}.json`;
}

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
      console.warn(`Firestore getDoc(${collectionName}/${docId}) failed:`, e);
      if (isAdminContext()) {
        throw new Error(`Firestore read error (${collectionName}/${docId}): ` + (e.message || e));
      }
    }
  }

  // Fallback to static JSON file only when Firestore is unavailable
  try {
    const res = await fetch(getDataPath(collectionName, docId));
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
export async function getCollection(collectionName, forceFresh = false) {
  if (!forceFresh && collectionMemoCache.has(collectionName)) {
    return collectionMemoCache.get(collectionName);
  }

  await initFirebase();

  if (db) {
    try {
      const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
      const colRef = collection(db, collectionName);
      
      // Fetch collection without orderBy to avoid dropping documents missing the 'order' field
      const snap = await getDocs(colRef);
      
      // When Firestore succeeds without error, Firestore is the authoritative source of truth,
      // even if the collection is empty (e.g. admin deleted all items).
      const list = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Client-side sort by 'order' (missing order goes to end, then tie-break by date/id)
      list.sort((a, b) => {
        const orderA = (typeof a.order === 'number') ? a.order : 999999;
        const orderB = (typeof b.order === 'number') ? b.order : 999999;
        if (orderA !== orderB) return orderA - orderB;
        const dateA = a.createdAt || a.updatedAt || a.id || '';
        const dateB = b.createdAt || b.updatedAt || b.id || '';
        return String(dateA).localeCompare(String(dateB));
      });

      collectionMemoCache.set(collectionName, list);
      return list;
    } catch (e) {
      console.warn(`Firestore getCollection(${collectionName}) failed, using static fallback:`, e);
      if (isAdminContext()) {
        throw new Error(`Firestore read error on collection '${collectionName}': ` + (e.message || e));
      }
    }
  }

  // Fallback to static JSON file ONLY when Firestore is unreachable or unconfigured
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
      collectionMemoCache.set(collectionName, freshList);
      return freshList;
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

  if (isAdminContext() && !db) {
    throw new Error("Cannot save: Firebase Firestore is not initialized or offline. Please check your admin login.");
  }

  if (db) {
    try {
      const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, payload, { merge: true });
    } catch (e) {
      console.error(`Firestore saveDoc error in ${collectionName}/${docId}:`, e);
      // In admin context, throw immediately so the admin is informed of save failure!
      if (isAdminContext()) {
        throw new Error(`Firestore save failed (${e.code || 'error'}): ${e.message || e}`);
      }
      throw e;
    }
  } else {
    if (isAdminContext()) {
      throw new Error("Firestore is not available. Changes were not saved to database.");
    }
  }

  // Clear memoized cache for this collection so subsequent reads get the fresh data
  clearCollectionCache(collectionName);

  return { id: docId, ...payload };
}

// DELETE Document
export async function deleteDoc(collectionName, docId) {
  await initFirebase();

  if (isAdminContext() && !db) {
    throw new Error("Cannot delete: Firebase Firestore is not initialized or offline.");
  }

  if (db) {
    try {
      const { doc, deleteDoc: firestoreDelete } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
      const docRef = doc(db, collectionName, docId);
      await firestoreDelete(docRef);
    } catch (e) {
      console.error(`Firestore deleteDoc error in ${collectionName}/${docId}:`, e);
      if (isAdminContext()) {
        throw new Error(`Firestore delete failed (${e.code || 'error'}): ${e.message || e}`);
      }
      throw e;
    }
  } else {
    if (isAdminContext()) {
      throw new Error("Firestore is not available. Delete operation aborted.");
    }
  }

  // Clear memoized cache for this collection
  clearCollectionCache(collectionName);

  return true;
}

// UPLOAD Image - Cloudinary is the ONLY upload path in admin (no base64 fallback)
export async function uploadImage(file, onProgress) {
  if (!file) throw new Error("No file selected for upload.");

  // Validate file type
  if (!file.type || !file.type.startsWith('image/')) {
    throw new Error("Invalid file type. Please upload a valid image (JPG, PNG, WebP, GIF, SVG).");
  }

  // Validate max size (5 MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(`Image size (${sizeMB} MB) exceeds maximum allowed limit of 5 MB.`);
  }

  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary image upload is not configured. Please enter your Cloud Name and Unsigned Upload Preset in 'js/cloudinary-config.js'.");
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', cloudinaryConfig.uploadPreset);

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;
  const res = await fetch(endpoint, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errText = await res.text();
    let msg = "Image upload failed";
    try {
      const parsed = JSON.parse(errText);
      if (parsed.error && parsed.error.message) msg += `: ${parsed.error.message}`;
    } catch (e) {
      msg += `: ${errText}`;
    }
    throw new Error(msg);
  }

  const data = await res.json();
  if (!data.secure_url) {
    throw new Error("Cloudinary response did not include a secure image URL.");
  }
  return data.secure_url;
}

// SEED Initial Data to Firestore with meta.seeded protection
export async function seedInitialData(force = false) {
  await initFirebase();

  if (!db) {
    throw new Error("Cannot seed: Firestore is not connected.");
  }

  const meta = await getDoc('settings', 'meta');
  if (meta && meta.seeded && !force) {
    throw new Error("Initial data is already seeded! Use force reset if you explicitly want to re-seed.");
  }

  const results = { success: [], failed: [] };

  // 1. Single Page & Configuration Documents
  const docSeeds = [
    { col: 'settings', id: 'site', file: 'settings' },
    { col: 'backgrounds', id: 'main', file: 'backgrounds' },
    { col: 'pages', id: 'home', file: 'home' },
    { col: 'pages', id: 'about', file: 'about' },
    { col: 'pages', id: 'destinations', file: 'destinations_page' },
    { col: 'pages', id: 'bookings', file: 'bookings_page' },
    { col: 'pages', id: 'contact', file: 'contact' }
  ];

  for (const s of docSeeds) {
    try {
      // Check if doc exists in Firestore; do not overwrite if not force
      if (!force) {
        const existing = await getDoc(s.col, s.id);
        if (existing) {
          results.success.push(`Skipped existing document ${s.col}/${s.id}`);
          continue;
        }
      }

      const res = await fetch(getDataPath(s.file, s.id));
      if (res.ok) {
        const json = await res.json();
        await saveDoc(s.col, s.id, json);
        results.success.push(`Seeded ${s.col}/${s.id}`);
      }
    } catch (e) {
      results.failed.push(`Failed to seed ${s.col}/${s.id}: ${e.message}`);
    }
  }

  // 2. Collection Arrays
  const colSeeds = ['vehicles', 'destinations', 'faqs', 'rules', 'reviews', 'gallery'];
  for (const colName of colSeeds) {
    try {
      const res = await fetch(getDataPath(colName));
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) {
          let count = 0;
          for (let i = 0; i < list.length; i++) {
            const item = list[i];
            const itemId = item.id || `${colName}_${i + 1}`;
            if (!force) {
              const existing = await getDoc(colName, itemId);
              if (existing) continue;
            }
            const itemPayload = { ...item, order: typeof item.order === 'number' ? item.order : i + 1 };
            await saveDoc(colName, itemId, itemPayload);
            count++;
          }
          results.success.push(`Seeded ${count} items in ${colName}`);
        }
      }
    } catch (e) {
      results.failed.push(`Failed to seed ${colName}: ${e.message}`);
    }
  }

  if (results.failed.length > 0) {
    throw new Error(`Seeding partially failed: ${results.failed.join(', ')}`);
  }

  // Set meta.seeded = true in Firestore
  await saveDoc('settings', 'meta', {
    seeded: true,
    seededAt: new Date().toISOString()
  });

  clearCollectionCache();
  return results;
}

export { auth, db };
