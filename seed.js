const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// 1. Manually parse .env.local because we are running raw Node.js script
const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      let key = match[1].trim();
      let val = match[2].trim();
      // Remove surrounding quotes if any
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  });
}

// 2. Initialize Firebase Admin
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!privateKey || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  console.error("Missing Firebase Admin Credentials in .env.local!");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: privateKey ? privateKey.replace(/\\n/g, "\n") : undefined,
  }),
});

const adminAuth = admin.auth();
const adminDb = admin.firestore();

// 3. Seed function
async function seed() {
  try {
    console.log("🚀 Starting Seeding for Project:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
    
    // --- ADMIN ---
    console.log("Seeding Admin User...");
    try {
      await adminAuth.createUser({
        email: "admin@kreasi.id",
        password: "Password123!",
        displayName: "Super Admin",
      });
      console.log("✅ Admin user created.");
    } catch (e) {
      if (e.code === 'auth/email-already-exists') {
        console.log("⚠️ Admin user already exists. Updating password to Password123!...");
        const adminUser = await adminAuth.getUserByEmail("admin@kreasi.id");
        await adminAuth.updateUser(adminUser.uid, { password: "Password123!" });
      } else {
        throw e;
      }
    }
    const adminUser = await adminAuth.getUserByEmail("admin@kreasi.id");
    await adminAuth.setCustomUserClaims(adminUser.uid, { admin: true });
    console.log("✅ Admin custom claims set.");

    // --- SELLER ---
    console.log("\nSeeding Seller User...");
    try {
      await adminAuth.createUser({
        email: "seller@kreasi.id",
        password: "Password123!",
        displayName: "Demo Seller",
      });
      console.log("✅ Seller user created.");
    } catch (e) {
      if (e.code === 'auth/email-already-exists') {
        console.log("⚠️ Seller user already exists. Updating password to Password123!...");
        const sellerUser = await adminAuth.getUserByEmail("seller@kreasi.id");
        await adminAuth.updateUser(sellerUser.uid, { password: "Password123!" });
      } else {
        throw e;
      }
    }
    const sellerUser = await adminAuth.getUserByEmail("seller@kreasi.id");
    
    await adminDb.collection("sellers").doc(sellerUser.uid).set({
      name: "Demo Seller",
      email: "seller@kreasi.id",
      status: "active",
      balance: 150000,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      avatar: "https://i.pravatar.cc/150?u=seller"
    }, { merge: true });
    console.log("✅ Seller document created in Firestore.");

    // --- PRODUCT ---
    console.log("\nSeeding Demo Product...");
    const productRef = adminDb.collection("products").doc("demo-product-1");
    await productRef.set({
      title: "Preset Lightroom Cinematic Vibes",
      slug: "preset-lightroom-cinematic-vibes",
      description: "Preset Lightroom khusus untuk membuat foto Anda terlihat seperti adegan film.",
      price: 50000,
      category: "preset",
      sellerId: sellerUser.uid,
      sellerName: "Demo Seller",
      thumbnail: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800",
      fileUrl: "https://drive.google.com/file/d/demo123/view",
      reviewStatus: "approved",
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log("✅ Demo Product created in Firestore.");

    console.log("\n🎉 Seeding Complete! 🎉");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding:", err);
    process.exit(1);
  }
}

seed();
