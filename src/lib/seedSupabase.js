import { supabase } from './supabase';
import { cars as defaultCars } from '../data/cars';

const isSupabaseWorking = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('placeholder') || key.includes('placeholder') || key.startsWith('sb_publishable_val')) {
    return false;
  }
  return true;
};

export const seedSupabaseDatabase = async () => {
  if (!isSupabaseWorking()) {
    console.log('Starting local database seeding...');
    try {
      localStorage.removeItem('nbc_cars');
      localStorage.removeItem('nbc_profiles');
      localStorage.removeItem('nbc_inquiries');
      localStorage.removeItem('nbc_contacts');
      localStorage.removeItem('nbc_settings');
      localStorage.removeItem('nbc_saved_cars');

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
      localStorage.setItem('nbc_inquiries', JSON.stringify([]));
      localStorage.setItem('nbc_contacts', JSON.stringify([]));
      localStorage.setItem('nbc_settings', JSON.stringify({
        id: 'platform',
        admin_whatsapp: '919999999999',
        listing_fee: 'Free',
        ai_model: 'v2.4',
        email_notifications: true,
        moderation_enabled: true,
        site_name: 'NoBrokerCars'
      }));
      localStorage.setItem('nbc_saved_cars', JSON.stringify({}));

      console.log('LOCAL DATABASE SEEDING COMPLETED!');
      alert('Local Database successfully populated with initial cars and configurations!');
      return;
    } catch (e) {
      console.error('Error seeding local database:', e);
      alert(`Error seeding local database: ${e.message || e}`);
      return;
    }
  }

  try {
    console.log('Starting full database sync to Supabase...');

    // 1. Sync All Cars
    const mappedCars = defaultCars.map((car) => {
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
        negotiable: true
      };
    });

    const { error: carsError } = await supabase
      .from('cars')
      .upsert(mappedCars, { onConflict: 'id' });

    if (carsError) throw carsError;
    console.log(`Successfully uploaded ${mappedCars.length} cars.`);

    // 2. Sync Settings
    const settingsData = {
      id: 'platform',
      admin_whatsapp: '919999999999',
      listing_fee: 'Free',
      ai_model: 'v2.4',
      email_notifications: true,
      moderation_enabled: true,
      site_name: 'NoBrokerCars'
    };

    const { error: settingsError } = await supabase
      .from('settings')
      .upsert(settingsData, { onConflict: 'id' });

    if (settingsError) throw settingsError;
    console.log('Successfully uploaded platform settings.');

    console.log('FULL DATABASE SYNC COMPLETED!');
    alert('Supabase Database successfully populated with initial cars and configurations!');
    
  } catch (error) {
    console.error('Error seeding Supabase database:', error);
    alert(`Error seeding to Supabase: ${error.message || error}`);
  }
};
