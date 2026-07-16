// Seeding script for Google Firebase
import { collection, doc, setDoc } from 'firebase/firestore';
import { db as firebaseDb } from './firebase';
import { getCars, getUsers, getSettings, getInquiries, getContacts } from './db';

// Map functions to convert to snake_case format for database consistency
const mapCarToDb = (c) => {
  return {
    id: c.id,
    name: c.name,
    make: c.make,
    model: c.model,
    year: Number(c.year),
    fuel_type: c.fuelType,
    transmission: c.transmission,
    mileage: c.mileage,
    ownership: c.ownership,
    location: c.location,
    price: Number(c.price),
    price_display: c.priceDisplay,
    tag: c.tag || null,
    image: c.image,
    gallery: c.gallery || [],
    description: c.description || '',
    seller_email: c.sellerEmail,
    seller_name: c.sellerName || c.seller,
    seller_phone: c.sellerPhone,
    seller_type: c.sellerType || 'Private Seller',
    status: c.status || 'pending',
    views: c.views || 0,
    inquiry_count: c.inquiryCount || 0,
    specs: c.specs || [],
    color: c.color || 'Standard',
    registration: c.registration || '',
    negotiable: c.negotiable ?? true,
    created_at: c.createdAt || new Date().toISOString()
  };
};

const mapProfileToDb = (p) => {
  return {
    email: p.email,
    name: p.name,
    phone: p.phone || '',
    role: p.role,
    avatar: p.avatar,
    joined_at: p.joinedAt || new Date().toISOString(),
    banned: p.banned ?? false
  };
};

const mapInquiryToDb = (i) => {
  return {
    car_id: i.carId,
    seller_email: i.sellerEmail,
    buyer_name: i.buyerName,
    buyer_phone: i.buyerPhone,
    buyer_email: i.buyerEmail,
    message: i.message,
    read: i.read ?? false,
    created_at: i.createdAt || new Date().toISOString()
  };
};

const mapContactToDb = (c) => {
  return {
    name: c.name,
    email: c.email,
    phone: c.phone,
    subject: c.subject || '',
    message: c.message,
    read: c.read ?? false,
    created_at: c.createdAt || new Date().toISOString()
  };
};

const mapSettingsToDb = (s) => {
  return {
    admin_whatsapp: s.adminWhatsApp,
    listing_fee: s.listingFee,
    ai_model: s.aiModel,
    email_notifications: s.emailNotifications,
    moderation_enabled: s.moderationEnabled,
    site_name: s.siteName
  };
};

export const seedDatabase = async () => {
  try {
    console.log('Starting full database sync to Firestore...');

    // 1. Sync All Cars
    const cars = await getCars();
    for (const car of cars) {
      const carRef = doc(collection(firebaseDb, 'cars'), car.id);
      await setDoc(carRef, mapCarToDb(car));
    }
    console.log(`Successfully uploaded ${cars.length} cars.`);

    // 2. Sync All Users & Admins
    const users = await getUsers();
    for (const user of users) {
      const safeEmailId = user.email.replace(/[@.]/g, '_');
      const userRef = doc(collection(firebaseDb, 'profiles'), safeEmailId);
      await setDoc(userRef, mapProfileToDb(user));
    }
    console.log(`Successfully uploaded ${users.length} users and admins.`);

    // 3. Sync Settings
    const settings = await getSettings();
    if (settings) {
      const settingsRef = doc(collection(firebaseDb, 'settings'), 'platform');
      await setDoc(settingsRef, mapSettingsToDb(settings));
      console.log('Successfully uploaded platform settings.');
    }

    // 4. Sync Inquiries & Messages
    const inquiries = await getInquiries();
    for (const inq of inquiries) {
      const inqRef = doc(collection(firebaseDb, 'inquiries'), inq.id);
      await setDoc(inqRef, mapInquiryToDb(inq));
    }

    const contacts = await getContacts();
    for (const contact of contacts) {
      const contactRef = doc(collection(firebaseDb, 'contacts'), contact.id);
      await setDoc(contactRef, mapContactToDb(contact));
    }
    console.log(`Successfully uploaded ${inquiries.length} inquiries and ${contacts.length} contact messages.`);

    console.log('FULL DATABASE SYNC COMPLETED!');
    alert('Firebase Database successfully populated with ALL your users, admins, cars, and messages! Check your Firebase Console.');
    
  } catch (error) {
    console.error('Error syncing database:', error);
    alert('Error syncing to Firebase. Check console for details.');
  }
};
