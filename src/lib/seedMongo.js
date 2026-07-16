// Seeding script for MongoDB Atlas Data API
import { mongoFetch, isMongoConfigured } from './mongodb';
import { getCars, getUsers, getSettings, getInquiries, getContacts } from './db';

// Convert entities to MongoDB database format (snake_case)
const mapCarToDb = (c) => {
  return {
    id: c.id,
    name: c.name,
    make: c.make,
    model: c.model,
    year: Number(c.year),
    fuel_type: c.fuelType || c.fuel_type,
    transmission: c.transmission,
    mileage: c.mileage,
    ownership: c.ownership,
    location: c.location,
    price: Number(c.price),
    price_display: c.priceDisplay || c.price_display,
    tag: c.tag || null,
    image: c.image,
    gallery: c.gallery || [],
    description: c.description || '',
    seller_email: c.sellerEmail || c.seller_email,
    seller_name: c.sellerName || c.seller_name || c.seller,
    seller_phone: c.sellerPhone || c.seller_phone,
    seller_type: c.sellerType || c.seller_type || 'Private Seller',
    status: c.status || 'active',
    views: c.views || 0,
    inquiry_count: c.inquiryCount || c.inquiry_count || 0,
    specs: c.specs || [],
    color: c.color || 'Standard',
    registration: c.registration || '',
    negotiable: c.negotiable ?? true,
    created_at: c.createdAt || c.created_at || new Date().toISOString()
  };
};

const mapProfileToDb = (p) => {
  return {
    email: p.email,
    name: p.name,
    phone: p.phone || '',
    role: p.role,
    avatar: p.avatar,
    joined_at: p.joinedAt || p.joined_at || new Date().toISOString(),
    banned: p.banned ?? false
  };
};

const mapInquiryToDb = (i) => {
  return {
    car_id: i.carId || i.car_id,
    seller_email: i.sellerEmail || i.seller_email,
    buyer_name: i.buyerName || i.buyer_name,
    buyer_phone: i.buyerPhone || i.buyer_phone,
    buyer_email: i.buyerEmail || i.buyer_email,
    message: i.message,
    read: i.read ?? false,
    created_at: i.createdAt || i.created_at || new Date().toISOString()
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
    created_at: c.createdAt || c.created_at || new Date().toISOString()
  };
};

const mapSettingsToDb = (s) => {
  return {
    id: 'platform',
    admin_whatsapp: s.adminWhatsApp || s.admin_whatsapp,
    listing_fee: s.listingFee || s.listing_fee,
    ai_model: s.aiModel || s.ai_model,
    email_notifications: s.emailNotifications || s.email_notifications,
    moderation_enabled: s.moderationEnabled || s.moderation_enabled,
    site_name: s.siteName || s.site_name
  };
};

export const seedDatabase = async () => {
  if (!isMongoConfigured()) {
    alert('MongoDB credentials are not configured! Cannot seed database.');
    return;
  }

  try {
    console.log('Starting full database sync to MongoDB Atlas...');

    // 1. Sync Cars
    const cars = await getCars();
    console.log(`Retrieved ${cars.length} cars from local source. Syncing...`);
    for (const car of cars) {
      await mongoFetch('updateOne', 'cars', {
        filter: { id: car.id },
        update: { $set: mapCarToDb(car) },
        upsert: true
      });
    }
    console.log('Cars successfully synced.');

    // 2. Sync Profiles
    const users = await getUsers();
    console.log(`Retrieved ${users.length} profiles from local source. Syncing...`);
    for (const user of users) {
      await mongoFetch('updateOne', 'profiles', {
        filter: { email: user.email },
        update: { $set: mapProfileToDb(user) },
        upsert: true
      });
    }
    console.log('Profiles successfully synced.');

    // 3. Sync Settings
    const settings = await getSettings();
    if (settings) {
      console.log('Syncing platform settings...');
      await mongoFetch('updateOne', 'settings', {
        filter: { id: 'platform' },
        update: { $set: mapSettingsToDb(settings) },
        upsert: true
      });
      console.log('Platform settings successfully synced.');
    }

    // 4. Sync Inquiries & Messages
    const inquiries = await getInquiries();
    for (const inq of inquiries) {
      const inqId = inq.id || (Math.random().toString(36).substring(2) + Date.now());
      await mongoFetch('updateOne', 'inquiries', {
        filter: { id: inqId },
        update: { $set: mapInquiryToDb(inq) },
        upsert: true
      });
    }

    const contacts = await getContacts();
    for (const contact of contacts) {
      const contactId = contact.id || (Math.random().toString(36).substring(2) + Date.now());
      await mongoFetch('updateOne', 'contacts', {
        filter: { id: contactId },
        update: { $set: mapContactToDb(contact) },
        upsert: true
      });
    }
    console.log('Inquiries and contact messages successfully synced.');

    console.log('FULL MONGO DATABASE SYNC COMPLETED!');
    alert('MongoDB Database successfully populated with ALL your users, admins, cars, and messages! Check your MongoDB Atlas console.');

  } catch (error) {
    console.error('Error seeding MongoDB database:', error);
    alert(`Error seeding to MongoDB: ${error.message || error}`);
  }
};
