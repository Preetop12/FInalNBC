// NoBrokerCars — MongoDB & Local Database Layer
import { mongoFetch, isMongoConfigured } from './mongodb';
import { cars as defaultCars } from '../data/cars';

// Initialize localStorage on demand
const initLocalDb = () => {
  if (!localStorage.getItem('nbc_cars')) {
    const initialCars = defaultCars.map((car) => {
      const specs = car.specs || [];
      return {
        id: car.id,
        name: car.name,
        make: car.make,
        model: car.model,
        year: Number(car.year),
        fuel_type: car.fuelType || 'Petrol',
        transmission: car.transmission || 'Automatic',
        mileage: car.mileage || '10,000 km',
        ownership: car.ownership || '1st Owner',
        location: car.location || 'Delhi',
        price: Number(car.price),
        price_display: car.priceDisplay || `₹${(car.price / 100000).toFixed(1)}L`,
        tag: car.tag || null,
        image: car.image || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80',
        gallery: car.gallery || [car.image],
        description: car.description || '',
        seller_email: 'seller@nobrokercars.com',
        seller_name: car.seller || 'Private Seller',
        seller_phone: '919999999999',
        seller_type: car.sellerType || 'Private Seller',
        status: 'active',
        views: Math.floor(Math.random() * 150) + 10,
        inquiry_count: 0,
        specs: specs,
        color: 'Standard',
        registration: 'MH01AB1234',
        negotiable: true,
        created_at: new Date().toISOString()
      };
    });
    localStorage.setItem('nbc_cars', JSON.stringify(initialCars));
  }
  if (!localStorage.getItem('nbc_profiles')) {
    localStorage.setItem('nbc_profiles', JSON.stringify([
      {
        id: 'admin-id',
        email: 'admin@nobrokercars.com',
        name: 'NBC Admin',
        phone: '919999999999',
        role: 'admin',
        avatar: 'A',
        joined_at: new Date().toISOString(),
        banned: false
      },
      {
        id: 'seller-id',
        email: 'seller@nobrokercars.com',
        name: 'Premium Seller',
        phone: '919999999999',
        role: 'seller',
        avatar: 'S',
        joined_at: new Date().toISOString(),
        banned: false
      }
    ]));
  }
  if (!localStorage.getItem('nbc_inquiries')) {
    localStorage.setItem('nbc_inquiries', JSON.stringify([]));
  }
  if (!localStorage.getItem('nbc_contacts')) {
    localStorage.setItem('nbc_contacts', JSON.stringify([]));
  }
  if (!localStorage.getItem('nbc_settings')) {
    localStorage.setItem('nbc_settings', JSON.stringify({
      id: 'platform',
      admin_whatsapp: '919999999999',
      listing_fee: 'Free',
      ai_model: 'v2.4',
      email_notifications: true,
      moderation_enabled: true,
      site_name: 'NoBrokerCars'
    }));
  }
  if (!localStorage.getItem('nbc_saved_cars')) {
    localStorage.setItem('nbc_saved_cars', JSON.stringify({}));
  }
};

const getLocalCarsRaw = () => {
  initLocalDb();
  return JSON.parse(localStorage.getItem('nbc_cars') || '[]');
};
const setLocalCarsRaw = (cars) => {
  localStorage.setItem('nbc_cars', JSON.stringify(cars));
};

const getLocalProfiles = () => {
  initLocalDb();
  return JSON.parse(localStorage.getItem('nbc_profiles') || '[]');
};
const setLocalProfiles = (profiles) => {
  localStorage.setItem('nbc_profiles', JSON.stringify(profiles));
};

const getLocalInquiries = () => {
  initLocalDb();
  return JSON.parse(localStorage.getItem('nbc_inquiries') || '[]');
};
const setLocalInquiries = (inquiries) => {
  localStorage.setItem('nbc_inquiries', JSON.stringify(inquiries));
};

const getLocalContacts = () => {
  initLocalDb();
  return JSON.parse(localStorage.getItem('nbc_contacts') || '[]');
};
const setLocalContacts = (contacts) => {
  localStorage.setItem('nbc_contacts', JSON.stringify(contacts));
};

const getLocalSettings = () => {
  initLocalDb();
  return JSON.parse(localStorage.getItem('nbc_settings') || '{}');
};
const setLocalSettings = (settings) => {
  localStorage.setItem('nbc_settings', JSON.stringify(settings));
};


// ─── Data Mappers ─────────────────────────────────────────────────────────────
const mapCarFromDb = (c) => {
  if (!c) return null;
  return {
    id: c.id || c._id,
    name: c.name,
    make: c.make,
    model: c.model,
    year: c.year,
    fuelType: c.fuelType || c.fuel_type,
    transmission: c.transmission,
    mileage: c.mileage,
    ownership: c.ownership,
    location: c.location,
    price: Number(c.price),
    priceDisplay: c.priceDisplay || c.price_display || `₹${Number(c.price).toLocaleString('en-IN')}`,
    tag: c.tag,
    image: c.image,
    gallery: c.gallery || [],
    description: c.description,
    sellerEmail: c.sellerEmail || c.seller_email,
    sellerName: c.sellerName || c.seller_name || c.seller,
    sellerPhone: c.sellerPhone || c.seller_phone,
    sellerType: c.sellerType || c.seller_type || 'Private Seller',
    status: c.status,
    views: c.views,
    inquiryCount: c.inquiryCount || c.inquiry_count || 0,
    createdAt: c.createdAt || c.created_at,
    specs: c.specs || [],
    color: c.color,
    registration: c.registration,
    negotiable: c.negotiable
  };
};

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
    price_display: c.priceDisplay || `₹${(c.price / 100000).toFixed(1)}L`,
    tag: c.tag || null,
    image: c.image,
    gallery: c.gallery || [],
    description: c.description || '',
    seller_email: c.sellerEmail,
    seller_name: c.sellerName,
    seller_phone: c.sellerPhone,
    seller_type: c.sellerType || 'Private Seller',
    status: c.status || 'pending',
    views: c.views || 0,
    inquiry_count: c.inquiryCount || 0,
    specs: c.specs || [],
    color: c.color || 'Standard',
    registration: c.registration || '',
    negotiable: c.negotiable ?? true
  };
};

const mapProfileFromDb = (p) => {
  if (!p) return null;
  return {
    email: p.email,
    name: p.name,
    phone: p.phone,
    role: p.role,
    avatar: p.avatar,
    joinedAt: p.joinedAt || p.joined_at,
    banned: p.banned
  };
};

const mapInquiryFromDb = (i) => {
  if (!i) return null;
  return {
    id: i.id || i._id,
    carId: i.carId || i.car_id,
    sellerEmail: i.sellerEmail || i.seller_email,
    buyerName: i.buyerName || i.buyer_name,
    buyerPhone: i.buyerPhone || i.buyer_phone,
    buyerEmail: i.buyerEmail || i.buyer_email,
    message: i.message,
    read: i.read,
    createdAt: i.createdAt || i.created_at
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
    read: i.read ?? false
  };
};

const mapContactFromDb = (c) => {
  if (!c) return null;
  return {
    id: c.id || c._id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    subject: c.subject,
    message: c.message,
    read: c.read,
    createdAt: c.createdAt || c.created_at
  };
};

const mapContactToDb = (c) => {
  return {
    name: c.name,
    email: c.email,
    phone: c.phone,
    subject: c.subject,
    message: c.message,
    read: c.read ?? false
  };
};

const mapSettingsFromDb = (s) => {
  if (!s) return null;
  return {
    adminWhatsApp: s.adminWhatsApp || s.admin_whatsapp,
    listingFee: s.listingFee || s.listing_fee,
    aiModel: s.aiModel || s.ai_model,
    emailNotifications: s.emailNotifications || s.email_notifications,
    moderationEnabled: s.moderationEnabled || s.moderation_enabled,
    siteName: s.siteName || s.site_name
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

// ─── Cars API ─────────────────────────────────────────────────────────────────
export const getCars = async () => {
  if (!isMongoConfigured()) {
    return getLocalCarsRaw().map(mapCarFromDb);
  }
  try {
    const response = await mongoFetch('find', 'cars', {
      sort: { created_at: -1 }
    });
    const documents = response?.documents || [];
    if (documents.length === 0) {
      return getLocalCarsRaw().map(mapCarFromDb);
    }
    return documents.map(mapCarFromDb);
  } catch (err) {
    console.error('MongoDB error in getCars, falling back to local:', err);
    return getLocalCarsRaw().map(mapCarFromDb);
  }
};

export const getCarById = async (id) => {
  if (!isMongoConfigured()) {
    const car = getLocalCarsRaw().find(c => c.id === id);
    return car ? mapCarFromDb(car) : null;
  }
  try {
    const response = await mongoFetch('findOne', 'cars', {
      filter: { id: id }
    });
    const docVal = response?.document;
    if (!docVal) {
      const car = getLocalCarsRaw().find(c => c.id === id);
      return car ? mapCarFromDb(car) : null;
    }
    return mapCarFromDb(docVal);
  } catch (err) {
    console.error('MongoDB error in getCarById, falling back to local:', err);
    const car = getLocalCarsRaw().find(c => c.id === id);
    return car ? mapCarFromDb(car) : null;
  }
};

export const getFeaturedCars = async () => {
  if (!isMongoConfigured()) {
    return getLocalCarsRaw().slice(0, 3).map(mapCarFromDb);
  }
  try {
    const response = await mongoFetch('find', 'cars', {
      filter: { status: 'active' },
      limit: 3
    });
    const documents = response?.documents || [];
    if (documents.length === 0) {
      const fallback = await mongoFetch('find', 'cars', { limit: 3 });
      const fbDocs = fallback?.documents || [];
      if (fbDocs.length === 0) {
        return getLocalCarsRaw().slice(0, 3).map(mapCarFromDb);
      }
      return fbDocs.map(mapCarFromDb);
    }
    return documents.map(mapCarFromDb);
  } catch (err) {
    console.error('MongoDB error in getFeaturedCars, falling back to local:', err);
    return getLocalCarsRaw().slice(0, 3).map(mapCarFromDb);
  }
};

export const getCarsByUser = async (email) => {
  if (!isMongoConfigured()) {
    return getLocalCarsRaw().filter(c => c.seller_email === email).map(mapCarFromDb);
  }
  try {
    const response = await mongoFetch('find', 'cars', {
      filter: { seller_email: email }
    });
    return (response?.documents || []).map(mapCarFromDb);
  } catch (err) {
    console.error('MongoDB error in getCarsByUser, falling back to local:', err);
    return getLocalCarsRaw().filter(c => c.seller_email === email).map(mapCarFromDb);
  }
};

export const getCarsByStatus = async (status) => {
  if (!isMongoConfigured()) {
    return getLocalCarsRaw().filter(c => c.status === status).map(mapCarFromDb);
  }
  try {
    const response = await mongoFetch('find', 'cars', {
      filter: { status: status }
    });
    return (response?.documents || []).map(mapCarFromDb);
  } catch (err) {
    console.error('MongoDB error in getCarsByStatus, falling back to local:', err);
    return getLocalCarsRaw().filter(c => c.status === status).map(mapCarFromDb);
  }
};

export const createCar = async (car) => {
  const dbCar = mapCarToDb(car);
  dbCar.created_at = new Date().toISOString();
  if (!isMongoConfigured()) {
    const cars = getLocalCarsRaw();
    cars.push(dbCar);
    setLocalCarsRaw(cars);
    return;
  }
  try {
    await mongoFetch('insertOne', 'cars', {
      document: dbCar
    });
  } catch (err) {
    console.error('MongoDB error in createCar, falling back to local:', err);
    const cars = getLocalCarsRaw();
    cars.push(dbCar);
    setLocalCarsRaw(cars);
  }
};

export const updateCar = async (id, updates) => {
  const dbUpdates = {};
  if (updates.fuelType !== undefined) dbUpdates.fuel_type = updates.fuelType;
  if (updates.priceDisplay !== undefined) dbUpdates.price_display = updates.priceDisplay;
  if (updates.sellerEmail !== undefined) dbUpdates.seller_email = updates.sellerEmail;
  if (updates.sellerName !== undefined) dbUpdates.seller_name = updates.sellerName;
  if (updates.sellerPhone !== undefined) dbUpdates.seller_phone = updates.sellerPhone;
  if (updates.sellerType !== undefined) dbUpdates.seller_type = updates.sellerType;
  if (updates.inquiryCount !== undefined) dbUpdates.inquiry_count = updates.inquiryCount;
  if (updates.createdAt !== undefined) dbUpdates.created_at = updates.createdAt;
  
  Object.keys(updates).forEach((key) => {
    const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    if (dbUpdates[dbKey] === undefined) {
      dbUpdates[dbKey] = updates[key];
    }
  });

  if (!isMongoConfigured()) {
    const cars = getLocalCarsRaw();
    const idx = cars.findIndex(c => c.id === id);
    if (idx > -1) {
      cars[idx] = { ...cars[idx], ...dbUpdates };
      setLocalCarsRaw(cars);
    }
    return;
  }
  try {
    await mongoFetch('updateOne', 'cars', {
      filter: { id: id },
      update: { $set: dbUpdates }
    });
  } catch (err) {
    console.error('MongoDB error in updateCar, falling back to local:', err);
    const cars = getLocalCarsRaw();
    const idx = cars.findIndex(c => c.id === id);
    if (idx > -1) {
      cars[idx] = { ...cars[idx], ...dbUpdates };
      setLocalCarsRaw(cars);
    }
  }
};

export const deleteCar = async (id) => {
  if (!isMongoConfigured()) {
    const cars = getLocalCarsRaw();
    const filtered = cars.filter(c => c.id !== id);
    setLocalCarsRaw(filtered);
    return;
  }
  try {
    await mongoFetch('deleteOne', 'cars', {
      filter: { id: id }
    });
  } catch (err) {
    console.error('MongoDB error in deleteCar, falling back to local:', err);
    const cars = getLocalCarsRaw();
    const filtered = cars.filter(c => c.id !== id);
    setLocalCarsRaw(filtered);
  }
};

export const incrementCarViews = async (id) => {
  if (!isMongoConfigured()) {
    const cars = getLocalCarsRaw();
    const idx = cars.findIndex(c => c.id === id);
    if (idx > -1) {
      cars[idx].views = (cars[idx].views || 0) + 1;
      setLocalCarsRaw(cars);
    }
    return;
  }
  try {
    await mongoFetch('updateOne', 'cars', {
      filter: { id: id },
      update: { $inc: { views: 1 } }
    });
  } catch (err) {
    console.error('MongoDB error in incrementCarViews, falling back to local:', err);
    const cars = getLocalCarsRaw();
    const idx = cars.findIndex(c => c.id === id);
    if (idx > -1) {
      cars[idx].views = (cars[idx].views || 0) + 1;
      setLocalCarsRaw(cars);
    }
  }
};


// ─── Profiles API ─────────────────────────────────────────────────────────────
export const getUsers = async () => {
  if (!isMongoConfigured()) {
    return getLocalProfiles().map(mapProfileFromDb);
  }
  try {
    const response = await mongoFetch('find', 'profiles');
    const documents = response?.documents || [];
    if (documents.length === 0) {
      return getLocalProfiles().map(mapProfileFromDb);
    }
    return documents.map(mapProfileFromDb);
  } catch (err) {
    console.error('MongoDB error in getUsers, falling back to local:', err);
    return getLocalProfiles().map(mapProfileFromDb);
  }
};

export const getUserByEmail = async (email) => {
  if (!isMongoConfigured()) {
    const profile = getLocalProfiles().find(p => p.email === email);
    return profile ? mapProfileFromDb(profile) : null;
  }
  try {
    const response = await mongoFetch('findOne', 'profiles', {
      filter: { email: email }
    });
    const docVal = response?.document;
    if (!docVal) {
      const profile = getLocalProfiles().find(p => p.email === email);
      return profile ? mapProfileFromDb(profile) : null;
    }
    return mapProfileFromDb(docVal);
  } catch (err) {
    console.error('MongoDB error in getUserByEmail, falling back to local:', err);
    const profile = getLocalProfiles().find(p => p.email === email);
    return profile ? mapProfileFromDb(profile) : null;
  }
};

export const upsertUser = async (userData) => {
  const profileData = {
    email: userData.email,
    name: userData.name,
    phone: userData.phone || '',
    role: userData.role || 'user',
    avatar: userData.avatar || userData.email[0].toUpperCase(),
    banned: userData.banned ?? false,
    joined_at: userData.joinedAt || userData.joined_at || new Date().toISOString()
  };

  if (!isMongoConfigured()) {
    const profiles = getLocalProfiles();
    const existingIdx = profiles.findIndex(p => p.email === userData.email);
    if (existingIdx > -1) {
      profiles[existingIdx] = { ...profiles[existingIdx], ...profileData };
    } else {
      profiles.push({
        id: userData.id || Math.random().toString(36).slice(2, 10),
        ...profileData
      });
    }
    setLocalProfiles(profiles);
    return;
  }
  try {
    await mongoFetch('updateOne', 'profiles', {
      filter: { email: userData.email },
      update: { $set: profileData },
      upsert: true
    });
  } catch (err) {
    console.error('MongoDB error in upsertUser, falling back to local:', err);
  }
};

export const updateUserRole = async (email, role) => {
  if (!isMongoConfigured()) {
    const profiles = getLocalProfiles();
    const idx = profiles.findIndex(p => p.email === email);
    if (idx > -1) {
      profiles[idx].role = role;
      setLocalProfiles(profiles);
    }
    return;
  }
  try {
    await mongoFetch('updateOne', 'profiles', {
      filter: { email: email },
      update: { $set: { role: role } }
    });
  } catch (err) {
    console.error('MongoDB error in updateUserRole, falling back to local:', err);
  }
};

export const toggleUserBan = async (email) => {
  if (!isMongoConfigured()) {
    const profiles = getLocalProfiles();
    const idx = profiles.findIndex(p => p.email === email);
    if (idx > -1) {
      profiles[idx].banned = !profiles[idx].banned;
      setLocalProfiles(profiles);
      return profiles[idx].banned;
    }
    return false;
  }
  try {
    const response = await mongoFetch('findOne', 'profiles', {
      filter: { email: email }
    });
    const docVal = response?.document;
    if (docVal) {
      const currentBan = docVal.banned || false;
      await mongoFetch('updateOne', 'profiles', {
        filter: { email: email },
        update: { $set: { banned: !currentBan } }
      });
      return !currentBan;
    }
    return false;
  } catch (err) {
    console.error('MongoDB error in toggleUserBan, falling back to local:', err);
    return false;
  }
};


// ─── Inquiries API ────────────────────────────────────────────────────────────
export const getInquiries = async (sellerEmail) => {
  if (!isMongoConfigured()) {
    initLocalDb();
    const inqs = JSON.parse(localStorage.getItem('nbc_inquiries') || '[]');
    if (sellerEmail) {
      return inqs.filter(i => i.seller_email === sellerEmail).map(mapInquiryFromDb);
    }
    return inqs.map(mapInquiryFromDb);
  }
  try {
    const filter = sellerEmail ? { seller_email: sellerEmail } : {};
    const response = await mongoFetch('find', 'inquiries', {
      filter,
      sort: { created_at: -1 }
    });
    return (response?.documents || []).map(mapInquiryFromDb);
  } catch (err) {
    console.error('MongoDB error in getInquiries, falling back to local:', err);
    return [];
  }
};

export const markInquiryRead = async (id) => {
  if (!isMongoConfigured()) {
    initLocalDb();
    const inqs = JSON.parse(localStorage.getItem('nbc_inquiries') || '[]');
    const idx = inqs.findIndex(i => i.id === id);
    if (idx > -1) {
      inqs[idx].read = true;
      localStorage.setItem('nbc_inquiries', JSON.stringify(inqs));
    }
    return;
  }
  try {
    await mongoFetch('updateOne', 'inquiries', {
      filter: { id: id },
      update: { $set: { read: true } }
    });
  } catch (err) {
    console.error('MongoDB error in markInquiryRead, falling back to local:', err);
  }
};


// ─── Contact Messages API ─────────────────────────────────────────────────────
export const getContacts = async () => {
  if (!isMongoConfigured()) {
    initLocalDb();
    const contacts = JSON.parse(localStorage.getItem('nbc_contacts') || '[]');
    return contacts.map(mapContactFromDb);
  }
  try {
    const response = await mongoFetch('find', 'contacts', {
      sort: { created_at: -1 }
    });
    return (response?.documents || []).map(mapContactFromDb);
  } catch (err) {
    console.error('MongoDB error in getContacts, falling back to local:', err);
    return [];
  }
};

export const markContactRead = async (id) => {
  if (!isMongoConfigured()) {
    initLocalDb();
    const contacts = JSON.parse(localStorage.getItem('nbc_contacts') || '[]');
    const idx = contacts.findIndex(c => c.id === id);
    if (idx > -1) {
      contacts[idx].read = true;
      localStorage.setItem('nbc_contacts', JSON.stringify(contacts));
    }
    return;
  }
  try {
    await mongoFetch('updateOne', 'contacts', {
      filter: { id: id },
      update: { $set: { read: true } }
    });
  } catch (err) {
    console.error('MongoDB error in markContactRead, falling back to local:', err);
  }
};

export const deleteContact = async (id) => {
  if (!isMongoConfigured()) {
    initLocalDb();
    const contacts = JSON.parse(localStorage.getItem('nbc_contacts') || '[]');
    const filtered = contacts.filter(c => c.id !== id);
    localStorage.setItem('nbc_contacts', JSON.stringify(filtered));
    return;
  }
  try {
    await mongoFetch('deleteOne', 'contacts', {
      filter: { id: id }
    });
  } catch (err) {
    console.error('MongoDB error in deleteContact, falling back to local:', err);
  }
};

export const createInquiry = async (inquiry) => {
  const dbInq = mapInquiryToDb(inquiry);
  dbInq.created_at = new Date().toISOString();
  dbInq.id = Math.random().toString(36).substring(2) + Date.now();
  if (!isMongoConfigured()) {
    initLocalDb();
    const inqs = JSON.parse(localStorage.getItem('nbc_inquiries') || '[]');
    inqs.push(dbInq);
    localStorage.setItem('nbc_inquiries', JSON.stringify(inqs));
    return;
  }
  try {
    await mongoFetch('insertOne', 'inquiries', {
      document: dbInq
    });
    
    // Increment inquiry count of car
    await mongoFetch('updateOne', 'cars', {
      filter: { id: dbInq.car_id },
      update: { $inc: { inquiry_count: 1 } }
    });
  } catch (err) {
    console.error('MongoDB error in createInquiry, falling back to local:', err);
  }
};

export const createContact = async (contact) => {
  const dbContact = mapContactToDb(contact);
  dbContact.created_at = new Date().toISOString();
  dbContact.id = Math.random().toString(36).substring(2) + Date.now();
  if (!isMongoConfigured()) {
    initLocalDb();
    const contacts = JSON.parse(localStorage.getItem('nbc_contacts') || '[]');
    contacts.push(dbContact);
    localStorage.setItem('nbc_contacts', JSON.stringify(contacts));
    return;
  }
  try {
    await mongoFetch('insertOne', 'contacts', {
      document: dbContact
    });
  } catch (err) {
    console.error('MongoDB error in createContact, falling back to local:', err);
  }
};


// ─── Saved Cars API ───────────────────────────────────────────────────────────
export const getSavedCars = async (userEmail) => {
  if (!isMongoConfigured()) {
    initLocalDb();
    const saved = JSON.parse(localStorage.getItem('nbc_saved_cars') || '{}');
    return saved[userEmail] || [];
  }
  try {
    const response = await mongoFetch('findOne', 'saved_cars', {
      filter: { user_email: userEmail }
    });
    const docVal = response?.document;
    if (!docVal) return [];
    return docVal.car_ids || [];
  } catch (err) {
    console.error('MongoDB error in getSavedCars, falling back to local:', err);
    initLocalDb();
    const saved = JSON.parse(localStorage.getItem('nbc_saved_cars') || '{}');
    return saved[userEmail] || [];
  }
};

export const toggleSaveCar = async (userEmail, carId) => {
  if (!isMongoConfigured()) {
    initLocalDb();
    const saved = JSON.parse(localStorage.getItem('nbc_saved_cars') || '{}');
    if (!saved[userEmail]) saved[userEmail] = [];
    const idx = saved[userEmail].indexOf(carId);
    if (idx > -1) {
      saved[userEmail].splice(idx, 1);
    } else {
      saved[userEmail].push(carId);
    }
    localStorage.setItem('nbc_saved_cars', JSON.stringify(saved));
    return saved[userEmail];
  }
  try {
    const response = await mongoFetch('findOne', 'saved_cars', {
      filter: { user_email: userEmail }
    });
    const docVal = response?.document;
    let carIds = [];
    if (docVal) {
      carIds = docVal.car_ids || [];
    }
    const idx = carIds.indexOf(carId);
    if (idx > -1) {
      carIds.splice(idx, 1);
    } else {
      carIds.push(carId);
    }
    await mongoFetch('updateOne', 'saved_cars', {
      filter: { user_email: userEmail },
      update: { $set: { car_ids: carIds } },
      upsert: true
    });
    return carIds;
  } catch (err) {
    console.error('MongoDB error in toggleSaveCar, falling back to local:', err);
    initLocalDb();
    const saved = JSON.parse(localStorage.getItem('nbc_saved_cars') || '{}');
    return saved[userEmail] || [];
  }
};


// ─── Settings API ─────────────────────────────────────────────────────────────
export const getSettings = async () => {
  if (!isMongoConfigured()) {
    return mapSettingsFromDb(getLocalSettings());
  }
  try {
    const response = await mongoFetch('findOne', 'settings', {
      filter: { id: 'platform' }
    });
    const docVal = response?.document;
    if (docVal) {
      return mapSettingsFromDb(docVal);
    }
    return mapSettingsFromDb(getLocalSettings());
  } catch (err) {
    console.error('MongoDB error in getSettings, falling back to local:', err);
    return mapSettingsFromDb(getLocalSettings());
  }
};

export const updateSettings = async (settings) => {
  const mapped = mapSettingsToDb(settings);
  if (!isMongoConfigured()) {
    const current = getLocalSettings();
    const updated = { ...current, ...mapped };
    setLocalSettings(updated);
    return;
  }
  try {
    await mongoFetch('updateOne', 'settings', {
      filter: { id: 'platform' },
      update: { $set: mapped },
      upsert: true
    });
  } catch (err) {
    console.error('MongoDB error in updateSettings, falling back to local:', err);
  }
};


// ─── Storage API ──────────────────────────────────────────────────────────────
export const uploadCarImage = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(file);
  });
};


// ─── Analytics helpers ────────────────────────────────────────────────────────
export const getAnalytics = async () => {
  const cars = await getCars();
  const users = await getUsers();
  const inquiries = await getInquiries();
  const contacts = await getContacts();

  const active = cars.filter((c) => c.status === 'active').length;
  const pending = cars.filter((c) => c.status === 'pending').length;
  const totalViews = cars.reduce((s, c) => s + (c.views || 0), 0);
  const avgPrice = cars.length
    ? Math.round(cars.reduce((s, c) => s + (Number(c.price) || 0), 0) / cars.length)
    : 0;

  return { cars, users, inquiries, contacts, active, pending, totalViews, avgPrice };
};

// ─── Export Aliases for Application Compatibility ─────────────────────────────────
export const addCar = createCar;
export const incrementViews = incrementCarViews;
export const addInquiry = createInquiry;
export const getInquiriesForSeller = getInquiries;
export const banUser = toggleUserBan;
export const addContact = createContact;

