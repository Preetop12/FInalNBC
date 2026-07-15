// NoBrokerCars — Supabase & Local Database Layer
import { supabase } from './supabase';
import { cars as defaultCars } from '../data/cars';

// ─── Local Database Layer Fallback ────────────────────────────────────────────
const isSupabaseWorking = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('placeholder') || key.includes('placeholder') || key.startsWith('sb_publishable_val')) {
    return false;
  }
  return true;
};

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
        status: 'active', // Seeded cars are active
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
    id: c.id,
    name: c.name,
    make: c.make,
    model: c.model,
    year: c.year,
    fuelType: c.fuel_type,
    transmission: c.transmission,
    mileage: c.mileage,
    ownership: c.ownership,
    location: c.location,
    price: Number(c.price),
    priceDisplay: c.price_display || `₹${Number(c.price).toLocaleString('en-IN')}`,
    tag: c.tag,
    image: c.image,
    gallery: c.gallery || [],
    description: c.description,
    sellerEmail: c.seller_email,
    sellerName: c.seller_name,
    sellerPhone: c.seller_phone,
    sellerType: c.seller_type || 'Private Seller',
    status: c.status,
    views: c.views,
    inquiryCount: c.inquiry_count,
    createdAt: c.created_at,
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
    price_display: c.priceDisplay,
    tag: c.tag,
    image: c.image,
    gallery: c.gallery,
    description: c.description,
    seller_email: c.sellerEmail,
    seller_name: c.sellerName,
    seller_phone: c.sellerPhone,
    seller_type: c.sellerType,
    status: c.status || 'pending',
    views: c.views || 0,
    inquiry_count: c.inquiryCount || 0,
    specs: c.specs || [],
    color: c.color,
    registration: c.registration,
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
    joinedAt: p.joined_at,
    banned: p.banned
  };
};

const mapInquiryFromDb = (i) => {
  if (!i) return null;
  return {
    id: i.id,
    carId: i.car_id,
    sellerEmail: i.seller_email,
    buyerName: i.buyer_name,
    buyerPhone: i.buyer_phone,
    buyerEmail: i.buyer_email,
    message: i.message,
    read: i.read,
    createdAt: i.created_at
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
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    subject: c.subject,
    message: c.message,
    read: c.read,
    createdAt: c.created_at
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
    adminWhatsApp: s.admin_whatsapp,
    listingFee: s.listing_fee,
    aiModel: s.ai_model,
    emailNotifications: s.email_notifications,
    moderationEnabled: s.moderation_enabled,
    siteName: s.site_name
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
  if (!isSupabaseWorking()) {
    return getLocalCarsRaw().map(mapCarFromDb);
  }
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(mapCarFromDb);
  } catch (err) {
    console.error('Supabase error in getCars, falling back to local:', err);
    return getLocalCarsRaw().map(mapCarFromDb);
  }
};

export const getCarById = async (id) => {
  if (!isSupabaseWorking()) {
    const car = getLocalCarsRaw().find(c => c.id === id);
    return car ? mapCarFromDb(car) : null;
  }
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return mapCarFromDb(data);
  } catch (err) {
    console.error('Supabase error in getCarById, falling back to local:', err);
    const car = getLocalCarsRaw().find(c => c.id === id);
    return car ? mapCarFromDb(car) : null;
  }
};

export const getFeaturedCars = async () => {
  if (!isSupabaseWorking()) {
    return getLocalCarsRaw()
      .filter(c => c.status === 'active')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 6)
      .map(mapCarFromDb);
  }
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(6);
    if (error) throw error;
    return data.map(mapCarFromDb);
  } catch (err) {
    console.error('Supabase error in getFeaturedCars, falling back to local:', err);
    return getLocalCarsRaw()
      .filter(c => c.status === 'active')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 6)
      .map(mapCarFromDb);
  }
};

export const getCarsByUser = async (email) => {
  if (!isSupabaseWorking()) {
    return getLocalCarsRaw()
      .filter(c => c.seller_email === email)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(mapCarFromDb);
  }
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('seller_email', email)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(mapCarFromDb);
  } catch (err) {
    console.error('Supabase error in getCarsByUser, falling back to local:', err);
    return getLocalCarsRaw()
      .filter(c => c.seller_email === email)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(mapCarFromDb);
  }
};

export const addCar = async (carData) => {
  const id = carData.id || Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const mapped = mapCarToDb({ ...carData, id });
  
  if (!isSupabaseWorking()) {
    const localCars = getLocalCarsRaw();
    const newCar = {
      ...mapped,
      created_at: new Date().toISOString()
    };
    localCars.unshift(newCar);
    setLocalCarsRaw(localCars);
    return mapCarFromDb(newCar);
  }
  
  try {
    const { data, error } = await supabase
      .from('cars')
      .insert([mapped])
      .select()
      .single();
    if (error) throw error;
    return mapCarFromDb(data);
  } catch (err) {
    console.error('Supabase error in addCar, falling back to local:', err);
    const localCars = getLocalCarsRaw();
    const newCar = {
      ...mapped,
      created_at: new Date().toISOString()
    };
    localCars.unshift(newCar);
    setLocalCarsRaw(localCars);
    return mapCarFromDb(newCar);
  }
};

export const updateCar = async (id, updates) => {
  if (!isSupabaseWorking()) {
    const localCars = getLocalCarsRaw();
    const carIdx = localCars.findIndex(c => c.id === id);
    if (carIdx > -1) {
      const car = localCars[carIdx];
      if (updates.status !== undefined) car.status = updates.status;
      if (updates.views !== undefined) car.views = updates.views;
      if (updates.inquiryCount !== undefined) car.inquiry_count = updates.inquiryCount;
      if (updates.specs !== undefined) car.specs = updates.specs;
      if (updates.gallery !== undefined) car.gallery = updates.gallery;
      if (updates.image !== undefined) car.image = updates.image;
      if (updates.price !== undefined) {
        car.price = Number(updates.price);
        car.price_display = updates.priceDisplay || `₹${Number(updates.price).toLocaleString('en-IN')}`;
      }
      if (updates.priceDisplay !== undefined) car.price_display = updates.priceDisplay;
      if (updates.negotiable !== undefined) car.negotiable = updates.negotiable;
      if (updates.description !== undefined) car.description = updates.description;
      if (updates.sellerPhone !== undefined) car.seller_phone = updates.sellerPhone;
      if (updates.sellerName !== undefined) car.seller_name = updates.sellerName;
      
      localCars[carIdx] = car;
      setLocalCarsRaw(localCars);
    }
    return;
  }
  
  const dbUpdates = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.views !== undefined) dbUpdates.views = updates.views;
  if (updates.inquiryCount !== undefined) dbUpdates.inquiry_count = updates.inquiryCount;
  if (updates.specs !== undefined) dbUpdates.specs = updates.specs;
  if (updates.gallery !== undefined) dbUpdates.gallery = updates.gallery;
  if (updates.image !== undefined) dbUpdates.image = updates.image;
  if (updates.price !== undefined) dbUpdates.price = Number(updates.price);
  if (updates.priceDisplay !== undefined) dbUpdates.price_display = updates.priceDisplay;
  if (updates.negotiable !== undefined) dbUpdates.negotiable = updates.negotiable;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.sellerPhone !== undefined) dbUpdates.seller_phone = updates.sellerPhone;
  if (updates.sellerName !== undefined) dbUpdates.seller_name = updates.sellerName;

  try {
    const { error } = await supabase
      .from('cars')
      .update(dbUpdates)
      .eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error('Supabase error in updateCar, falling back to local:', err);
    const localCars = getLocalCarsRaw();
    const carIdx = localCars.findIndex(c => c.id === id);
    if (carIdx > -1) {
      const car = localCars[carIdx];
      if (updates.status !== undefined) car.status = updates.status;
      if (updates.views !== undefined) car.views = updates.views;
      if (updates.inquiryCount !== undefined) car.inquiry_count = updates.inquiryCount;
      if (updates.specs !== undefined) car.specs = updates.specs;
      if (updates.gallery !== undefined) car.gallery = updates.gallery;
      if (updates.image !== undefined) car.image = updates.image;
      if (updates.price !== undefined) {
        car.price = Number(updates.price);
        car.price_display = updates.priceDisplay || `₹${Number(updates.price).toLocaleString('en-IN')}`;
      }
      if (updates.priceDisplay !== undefined) car.price_display = updates.priceDisplay;
      if (updates.negotiable !== undefined) car.negotiable = updates.negotiable;
      if (updates.description !== undefined) car.description = updates.description;
      if (updates.sellerPhone !== undefined) car.seller_phone = updates.sellerPhone;
      if (updates.sellerName !== undefined) car.seller_name = updates.sellerName;
      
      localCars[carIdx] = car;
      setLocalCarsRaw(localCars);
    }
  }
};

export const deleteCar = async (id) => {
  if (!isSupabaseWorking()) {
    const localCars = getLocalCarsRaw();
    const filtered = localCars.filter(c => c.id !== id);
    setLocalCarsRaw(filtered);
    return;
  }
  try {
    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error('Supabase error in deleteCar, falling back to local:', err);
    const localCars = getLocalCarsRaw();
    const filtered = localCars.filter(c => c.id !== id);
    setLocalCarsRaw(filtered);
  }
};

export const incrementViews = async (id) => {
  try {
    const car = await getCarById(id);
    if (car) {
      await updateCar(id, { views: (car.views || 0) + 1 });
    }
  } catch (err) {
    console.error('Error incrementing views:', err);
  }
};

// ─── Users API ────────────────────────────────────────────────────────────────
export const getUsers = async () => {
  if (!isSupabaseWorking()) {
    return getLocalProfiles().map(mapProfileFromDb);
  }
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('joined_at', { ascending: false });
    if (error) throw error;
    return data.map(mapProfileFromDb);
  } catch (err) {
    console.error('Supabase error in getUsers, falling back to local:', err);
    return getLocalProfiles().map(mapProfileFromDb);
  }
};

export const getUserByEmail = async (email) => {
  if (!isSupabaseWorking()) {
    const profile = getLocalProfiles().find(p => p.email === email);
    return profile ? mapProfileFromDb(profile) : null;
  }
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (error) throw error;
    return mapProfileFromDb(data);
  } catch (err) {
    console.error('Supabase error in getUserByEmail, falling back to local:', err);
    const profile = getLocalProfiles().find(p => p.email === email);
    return profile ? mapProfileFromDb(profile) : null;
  }
};

export const upsertUser = async (userData) => {
  if (!isSupabaseWorking()) {
    const profiles = getLocalProfiles();
    const existingIdx = profiles.findIndex(p => p.email === userData.email);
    const profileData = {
      email: userData.email,
      name: userData.name,
      phone: userData.phone || '',
      role: userData.role || 'user',
      avatar: userData.avatar || userData.email[0].toUpperCase(),
      banned: userData.banned ?? false,
      joined_at: profiles[existingIdx]?.joined_at || new Date().toISOString()
    };
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
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userData.email)
      .maybeSingle();

    const profileData = {
      email: userData.email,
      name: userData.name,
      phone: userData.phone,
      role: userData.role || 'user',
      avatar: userData.avatar || userData.email[0].toUpperCase(),
      banned: userData.banned ?? false
    };

    if (existing?.id) {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email === userData.email) {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            ...profileData
          });
        if (error) throw error;
      }
    }
  } catch (err) {
    console.error('Error upserting profile, falling back to local:', err);
    const profiles = getLocalProfiles();
    const existingIdx = profiles.findIndex(p => p.email === userData.email);
    const profileData = {
      email: userData.email,
      name: userData.name,
      phone: userData.phone || '',
      role: userData.role || 'user',
      avatar: userData.avatar || userData.email[0].toUpperCase(),
      banned: userData.banned ?? false,
      joined_at: profiles[existingIdx]?.joined_at || new Date().toISOString()
    };
    if (existingIdx > -1) {
      profiles[existingIdx] = { ...profiles[existingIdx], ...profileData };
    } else {
      profiles.push({
        id: userData.id || Math.random().toString(36).slice(2, 10),
        ...profileData
      });
    }
    setLocalProfiles(profiles);
  }
};

export const updateUserRole = async (email, role) => {
  if (!isSupabaseWorking()) {
    const profiles = getLocalProfiles();
    const idx = profiles.findIndex(p => p.email === email);
    if (idx > -1) {
      profiles[idx].role = role;
      setLocalProfiles(profiles);
    }
    return;
  }
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('email', email);
    if (error) throw error;
  } catch (err) {
    console.error('Supabase error in updateUserRole, falling back to local:', err);
    const profiles = getLocalProfiles();
    const idx = profiles.findIndex(p => p.email === email);
    if (idx > -1) {
      profiles[idx].role = role;
      setLocalProfiles(profiles);
    }
  }
};

export const banUser = async (email) => {
  if (!isSupabaseWorking()) {
    const profiles = getLocalProfiles();
    const idx = profiles.findIndex(p => p.email === email);
    if (idx > -1) {
      profiles[idx].banned = !profiles[idx].banned;
      setLocalProfiles(profiles);
    }
    return;
  }
  try {
    const profile = await getUserByEmail(email);
    if (profile) {
      const { error } = await supabase
        .from('profiles')
        .update({ banned: !profile.banned })
        .eq('email', email);
      if (error) throw error;
    }
  } catch (err) {
    console.error('Error banning/unbanning user, falling back to local:', err);
    const profiles = getLocalProfiles();
    const idx = profiles.findIndex(p => p.email === email);
    if (idx > -1) {
      profiles[idx].banned = !profiles[idx].banned;
      setLocalProfiles(profiles);
    }
  }
};

// ─── Inquiries API ────────────────────────────────────────────────────────────
export const getInquiries = async () => {
  if (!isSupabaseWorking()) {
    return getLocalInquiries()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(mapInquiryFromDb);
  }
  try {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(mapInquiryFromDb);
  } catch (err) {
    console.error('Supabase error in getInquiries, falling back to local:', err);
    return getLocalInquiries()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(mapInquiryFromDb);
  }
};

export const getInquiriesForSeller = async (sellerEmail) => {
  if (!isSupabaseWorking()) {
    return getLocalInquiries()
      .filter(i => i.seller_email === sellerEmail)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(mapInquiryFromDb);
  }
  try {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .eq('seller_email', sellerEmail)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(mapInquiryFromDb);
  } catch (err) {
    console.error('Supabase error in getInquiriesForSeller, falling back to local:', err);
    return getLocalInquiries()
      .filter(i => i.seller_email === sellerEmail)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(mapInquiryFromDb);
  }
};

export const getInquiriesForCar = async (carId) => {
  if (!isSupabaseWorking()) {
    return getLocalInquiries()
      .filter(i => i.car_id === carId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(mapInquiryFromDb);
  }
  try {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .eq('car_id', carId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(mapInquiryFromDb);
  } catch (err) {
    console.error('Supabase error in getInquiriesForCar, falling back to local:', err);
    return getLocalInquiries()
      .filter(i => i.car_id === carId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(mapInquiryFromDb);
  }
};

export const addInquiry = async (inqData) => {
  const mapped = mapInquiryToDb(inqData);
  
  if (!isSupabaseWorking()) {
    const inquiries = getLocalInquiries();
    const newInq = {
      id: Math.random().toString(36).slice(2, 10),
      ...mapped,
      created_at: new Date().toISOString()
    };
    inquiries.unshift(newInq);
    setLocalInquiries(inquiries);
    
    // Increment local car inquiry count
    const localCars = getLocalCarsRaw();
    const carIdx = localCars.findIndex(c => c.id === inqData.carId);
    if (carIdx > -1) {
      localCars[carIdx].inquiry_count = (localCars[carIdx].inquiry_count || 0) + 1;
      setLocalCarsRaw(localCars);
    }
    
    return mapInquiryFromDb(newInq);
  }
  
  try {
    const { data, error } = await supabase
      .from('inquiries')
      .insert([mapped])
      .select()
      .single();
    if (error) throw error;

    // Increment inquiry count on car
    try {
      const { data: car } = await supabase
        .from('cars')
        .select('inquiry_count')
        .eq('id', inqData.carId)
        .single();
      if (car) {
        await supabase
          .from('cars')
          .update({ inquiry_count: (car.inquiry_count || 0) + 1 })
          .eq('id', inqData.carId);
      }
    } catch (err) {
      console.error('Error updating inquiry count:', err);
    }

    return mapInquiryFromDb(data);
  } catch (err) {
    console.error('Supabase error in addInquiry, falling back to local:', err);
    const inquiries = getLocalInquiries();
    const newInq = {
      id: Math.random().toString(36).slice(2, 10),
      ...mapped,
      created_at: new Date().toISOString()
    };
    inquiries.unshift(newInq);
    setLocalInquiries(inquiries);
    
    // Increment local car inquiry count
    const localCars = getLocalCarsRaw();
    const carIdx = localCars.findIndex(c => c.id === inqData.carId);
    if (carIdx > -1) {
      localCars[carIdx].inquiry_count = (localCars[carIdx].inquiry_count || 0) + 1;
      setLocalCarsRaw(localCars);
    }
    
    return mapInquiryFromDb(newInq);
  }
};

export const markInquiryRead = async (id) => {
  if (!isSupabaseWorking()) {
    const inquiries = getLocalInquiries();
    const idx = inquiries.findIndex(i => i.id === id);
    if (idx > -1) {
      inquiries[idx].read = true;
      setLocalInquiries(inquiries);
    }
    return;
  }
  try {
    const { error } = await supabase
      .from('inquiries')
      .update({ read: true })
      .eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error('Supabase error in markInquiryRead, falling back to local:', err);
    const inquiries = getLocalInquiries();
    const idx = inquiries.findIndex(i => i.id === id);
    if (idx > -1) {
      inquiries[idx].read = true;
      setLocalInquiries(inquiries);
    }
  }
};

// ─── Contact Messages API ─────────────────────────────────────────────────────
export const getContacts = async () => {
  if (!isSupabaseWorking()) {
    return getLocalContacts()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(mapContactFromDb);
  }
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(mapContactFromDb);
  } catch (err) {
    console.error('Supabase error in getContacts, falling back to local:', err);
    return getLocalContacts()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(mapContactFromDb);
  }
};

export const addContact = async (contactData) => {
  const mapped = mapContactToDb(contactData);
  if (!isSupabaseWorking()) {
    const contacts = getLocalContacts();
    const newContact = {
      id: Math.random().toString(36).slice(2, 10),
      ...mapped,
      created_at: new Date().toISOString()
    };
    contacts.unshift(newContact);
    setLocalContacts(contacts);
    return mapContactFromDb(newContact);
  }
  try {
    const { data, error } = await supabase
      .from('contacts')
      .insert([mapped])
      .select()
      .single();
    if (error) throw error;
    return mapContactFromDb(data);
  } catch (err) {
    console.error('Supabase error in addContact, falling back to local:', err);
    const contacts = getLocalContacts();
    const newContact = {
      id: Math.random().toString(36).slice(2, 10),
      ...mapped,
      created_at: new Date().toISOString()
    };
    contacts.unshift(newContact);
    setLocalContacts(contacts);
    return mapContactFromDb(newContact);
  }
};

export const markContactRead = async (id) => {
  if (!isSupabaseWorking()) {
    const contacts = getLocalContacts();
    const idx = contacts.findIndex(c => c.id === id);
    if (idx > -1) {
      contacts[idx].read = true;
      setLocalContacts(contacts);
    }
    return;
  }
  try {
    const { error } = await supabase
      .from('contacts')
      .update({ read: true })
      .eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error('Supabase error in markContactRead, falling back to local:', err);
    const contacts = getLocalContacts();
    const idx = contacts.findIndex(c => c.id === id);
    if (idx > -1) {
      contacts[idx].read = true;
      setLocalContacts(contacts);
    }
  }
};

export const deleteContact = async (id) => {
  if (!isSupabaseWorking()) {
    const contacts = getLocalContacts();
    const filtered = contacts.filter(c => c.id !== id);
    setLocalContacts(filtered);
    return;
  }
  try {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error('Supabase error in deleteContact, falling back to local:', err);
    const contacts = getLocalContacts();
    const filtered = contacts.filter(c => c.id !== id);
    setLocalContacts(filtered);
  }
};

// ─── Saved Cars API ───────────────────────────────────────────────────────────
export const getSavedCars = async (userEmail) => {
  if (!isSupabaseWorking()) {
    initLocalDb();
    const saved = JSON.parse(localStorage.getItem('nbc_saved_cars') || '{}');
    return saved[userEmail] || [];
  }
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle();
    if (!profile) return [];

    const { data, error } = await supabase
      .from('saved_cars')
      .select('car_id')
      .eq('user_id', profile.id);
    if (error) throw error;
    return data.map((item) => item.car_id);
  } catch (err) {
    console.error('Supabase error in getSavedCars, falling back to local:', err);
    initLocalDb();
    const saved = JSON.parse(localStorage.getItem('nbc_saved_cars') || '{}');
    return saved[userEmail] || [];
  }
};

export const toggleSaveCar = async (userEmail, carId) => {
  if (!isSupabaseWorking()) {
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle();
    if (!profile) return [];

    const { data: existing } = await supabase
      .from('saved_cars')
      .select('id')
      .eq('user_id', profile.id)
      .eq('car_id', carId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('saved_cars')
        .delete()
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('saved_cars')
        .insert({ user_id: profile.id, car_id: carId });
      if (error) throw error;
    }

    return getSavedCars(userEmail);
  } catch (err) {
    console.error('Supabase error in toggleSaveCar, falling back to local:', err);
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
};

// ─── Settings API ─────────────────────────────────────────────────────────────
export const getSettings = async () => {
  if (!isSupabaseWorking()) {
    return mapSettingsFromDb(getLocalSettings());
  }
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 'platform')
      .maybeSingle();
    if (error || !data) throw error || new Error('No settings data');
    return mapSettingsFromDb(data);
  } catch (err) {
    console.error('Supabase error in getSettings, falling back to local:', err);
    return mapSettingsFromDb(getLocalSettings());
  }
};

export const updateSettings = async (updates) => {
  const mapped = mapSettingsToDb(updates);
  if (!isSupabaseWorking()) {
    const settings = getLocalSettings();
    const updated = { ...settings, ...mapped };
    setLocalSettings(updated);
    return;
  }
  try {
    const { error } = await supabase
      .from('settings')
      .update(mapped)
      .eq('id', 'platform');
    if (error) throw error;
  } catch (err) {
    console.error('Supabase error in updateSettings, falling back to local:', err);
    const settings = getLocalSettings();
    const updated = { ...settings, ...mapped };
    setLocalSettings(updated);
  }
};

// ─── Storage API ──────────────────────────────────────────────────────────────
export const uploadCarImage = async (file) => {
  if (!isSupabaseWorking()) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `listings/${fileName}`;

    const { error } = await supabase.storage
      .from('car-images')
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('car-images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (err) {
    console.error('Supabase error in uploadCarImage, falling back to local Base64:', err);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }
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
