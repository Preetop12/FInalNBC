// IMPORTANT: This script is prepared for you to run ONCE after you have installed Firebase.
// DO NOT UNCOMMENT THIS FILE until you have successfully run `npm install firebase` 
// and added your keys to src/lib/firebase.js

import { collection, doc, setDoc } from 'firebase/firestore';
import { db as firebaseDb } from './firebase';
import { getCars, getUsers, getSettings, getInquiries, getContacts } from './db';

export const seedDatabase = async () => {
  try {
    console.log('Starting full database sync to Firestore...');

    // 1. Sync All Cars
    const cars = getCars();
    for (const car of cars) {
      const carRef = doc(collection(firebaseDb, 'cars'), car.id);
      await setDoc(carRef, car);
    }
    console.log(`Successfully uploaded ${cars.length} cars.`);

    // 2. Sync All Users & Admins
    const users = getUsers();
    for (const user of users) {
      // Use email as doc ID safely (Firestore IDs cannot contain slashes)
      const safeEmailId = user.email.replace(/[@.]/g, '_');
      const userRef = doc(collection(firebaseDb, 'users'), safeEmailId);
      await setDoc(userRef, user);
    }
    console.log(`Successfully uploaded ${users.length} users and admins.`);

    // 3. Sync Settings
    const settings = getSettings();
    const settingsRef = doc(collection(firebaseDb, 'settings'), 'platform');
    await setDoc(settingsRef, settings);
    console.log('Successfully uploaded platform settings.');

    // 4. Sync Inquiries & Messages
    const inquiries = getInquiries();
    for (const inq of inquiries) {
      const inqRef = doc(collection(firebaseDb, 'inquiries'), inq.id);
      await setDoc(inqRef, inq);
    }

    const contacts = getContacts();
    for (const contact of contacts) {
      const contactRef = doc(collection(firebaseDb, 'contacts'), contact.id);
      await setDoc(contactRef, contact);
    }
    console.log(`Successfully uploaded ${inquiries.length} inquiries and ${contacts.length} contact messages.`);

    console.log('FULL DATABASE SYNC COMPLETED!');
    alert('Firebase Database successfully populated with ALL your users, admins, cars, and messages! Check your Firebase Console.');
    
  } catch (error) {
    console.error('Error syncing database:', error);
    alert('Error syncing to Firebase. Check console for details.');
  }
};
