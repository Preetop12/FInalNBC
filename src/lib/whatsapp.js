// NoBrokerCars — WhatsApp API Integration
// Uses the wa.me Click-to-Chat API (no server key needed for direct chat links).
// For business API notifications, integrate with cloud API (optional server-side).

import { getSettings } from './db.js';

/**
 * Opens WhatsApp chat with the given phone number and message.
 * @param {string} phone - E.164 format without '+', e.g. "919876543210"
 * @param {string} message - Pre-filled message text
 */
export const openWhatsApp = (phone, message = '') => {
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${phone}?text=${encoded}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Generate a WhatsApp link
 */
export const whatsAppLink = (phone, message = '') => {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};

/**
 * Contact a car seller via WhatsApp
 */
export const contactSellerWhatsApp = (car) => {
  const msg =
    `Hi! I'm interested in your ${car.year} ${car.make} ${car.model} listed on NoBrokerCars for ${car.priceDisplay || '₹' + Number(car.price).toLocaleString('en-IN')}.\n\nCould you please share more details?`;
  openWhatsApp(car.sellerPhone || getSettings().adminWhatsApp, msg);
};

/**
 * Notify admin via WhatsApp about a new car listing
 */
export const notifyAdminNewListing = (car) => {
  const settings = getSettings();
  const msg =
    `🚗 New listing submitted on NoBrokerCars!\n\nCar: ${car.year} ${car.make} ${car.model}\nPrice: ₹${Number(car.price).toLocaleString('en-IN')}\nSeller: ${car.sellerName || 'Unknown'}\nEmail: ${car.sellerEmail || 'N/A'}\n\nPlease review in the admin panel.`;
  openWhatsApp(settings.adminWhatsApp, msg);
};

/**
 * Notify admin via WhatsApp about a new contact inquiry
 */
export const notifyAdminContact = (contact) => {
  const settings = getSettings();
  const msg =
    `📩 New contact inquiry on NoBrokerCars!\n\nFrom: ${contact.name}\nPhone: ${contact.phone}\nEmail: ${contact.email}\nMessage: ${contact.message}`;
  openWhatsApp(settings.adminWhatsApp, msg);
};

/**
 * Send a car inquiry to seller via WhatsApp
 */
export const sendCarInquiryWhatsApp = (car, buyerName, buyerPhone, message) => {
  const msg =
    `Hi! I found your car on NoBrokerCars.\n\nCar: ${car.year} ${car.make} ${car.model}\nPrice: ₹${Number(car.price).toLocaleString('en-IN')}\n\nMy name is ${buyerName} (${buyerPhone}).\n\n${message}`;
  openWhatsApp(car.sellerPhone || getSettings().adminWhatsApp, msg);
};
