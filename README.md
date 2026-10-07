# Danan Car & Bike Rentals (Peradeniya & Kandy, Sri Lanka)

STEP 1 Website & Admin Panel built with static HTML5, CSS3 (Rento theme layout & animations), ES Modules Vanilla JavaScript, Firebase (Auth + Firestore), and Cloudinary (Image Uploads).

---

## 📁 Project Structure

```
DANAN CAR & BIKE RENTALS/
├── admin/
│   ├── index.html          # Admin Dashboard
│   ├── login.html          # Admin Login Page
│   ├── settings.html       # Business & Theme Settings Editor
│   ├── home-editor.html    # Home Page & Gallery Content Editor
│   └── vehicles.html      # Fleet & Vehicle Manager
├── assets/
│   └── images/
│       ├── logo/           # Real logo images
│       ├── hero/           # Hero background banner
│       ├── vehicles/       # Fleet photo banners
│       └── customers/      # Real customer photos
├── css/
│   ├── style.css           # Rento-inspired public stylesheet
│   └── admin.css           # Admin dashboard stylesheet
├── js/
│   ├── firebase-config.js  # Firebase project configuration
│   ├── cloudinary-config.js# Cloudinary upload configuration
│   ├── db.js               # Database abstraction (Firestore + JSON/LocalStorage fallback)
│   ├── main.js             # Public site rendering engine
│   └── admin.js            # Admin authentication & global helpers
├── data/                   # Fallback JSON datasets
│   ├── settings.json
│   ├── home.json
│   ├── vehicles.json
│   ├── faqs.json
│   ├── rules.json
│   ├── reviews.json
│   └── gallery.json
├── index.html              # Main Home Page
├── vehicles.html           # Full Fleet Page
├── sitemap.html            # Sitemap Page
├── sitemap.xml             # XML Sitemap for Search Engines
├── firestore.rules         # Security Rules for Firebase Firestore
└── README.md               # Setup Guide & Documentation
```

---

## ⚡ Quick Start / Local Testing
1. You can open `index.html` directly in any web browser or serve it using a local HTTP server (such as VS Code Live Server).
2. The site automatically runs in **Offline/Fallback mode** using the local `data/*.json` files until you configure real Firebase & Cloudinary keys!
3. To access the Admin Panel, navigate to `/admin/login.html` and click **Sign In**.

---

## 🛠️ Step-by-Step Production Setup Instructions

### 1. Firebase Setup (Authentication & Firestore)
1. Go to [Firebase Console](https://console.firebase.google.com/) and click **Add Project**. Name it `danan-rentals`.
2. Register a **Web App** (click the `</>` icon) and copy the `firebaseConfig` object.
3. Open `js/firebase-config.js` and replace the placeholder values with your real Firebase keys.
4. Enable **Authentication**:
   - In Firebase Console, go to **Build > Authentication**.
   - Click **Get Started**, choose **Email/Password**, and enable it.
   - Go to the **Users** tab and click **Add user**. Create your admin email and password.
5. Create **Firestore Database**:
   - Go to **Build > Firestore Database** and click **Create database**.
   - Choose **Production mode** and select your closest location (e.g. `asia-south1`).
   - Go to the **Rules** tab, paste the contents of `firestore.rules`, and click **Publish**.
6. Add **Authorized Domain**:
   - Under **Authentication > Settings > Authorized domains**, add your custom domain or GitHub Pages domain (e.g., `username.github.io`).

---

### 2. Cloudinary Setup (Unsigned Image Upload Preset)
1. Sign up for a free account at [Cloudinary](https://cloudinary.com/).
2. In your Cloudinary Dashboard, copy your **Cloud Name**.
3. Go to **Settings (Gear icon) > Upload > Upload presets**.
4. Scroll down, click **Add upload preset**:
   - Name the preset (e.g., `danan_uploads`).
   - Set **Signing Mode** to **Unsigned**.
   - Click **Save**.
5. Open `js/cloudinary-config.js` and paste your `cloudName` and `uploadPreset`.

---

### 3. Seeding Default Data to Firestore
1. Log into your admin panel at `/admin/login.html`.
2. In the sidebar, click **⚡ Seed Default Data**.
3. This will write all initial vehicle fleet data, FAQs, rules, reviews, and site settings directly into your Firestore database!

---

### 4. Deploying to GitHub Pages
1. Initialize git in the project root:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Danan Car & Bike Rentals"
   ```
2. Create a public repository on GitHub named `danan-rentals` or `danan-car-and-bike-rentals`.
3. Push your repository:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.name.git
   git branch -M main
   git push -u origin main
   ```
4. On GitHub, go to **Settings > Pages**:
   - Under **Source**, select **Deploy from a branch**.
   - Select `main` branch and `/ (root)` folder.
   - Click **Save**.
5. Your website will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`!
