// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyChIHpGrXn_MhgTkeSMZzbJE-5AFyYVBQg",
    authDomain: "nobrokeragecars.firebaseapp.com",
    projectId: "nobrokeragecars",
    storageBucket: "nobrokeragecars.firebasestorage.app",
    messagingSenderId: "690523692082",
    appId: "1:690523692082:web:5ec8f47aaa9a87cf12b02b",
    measurementId: "G-V5V46JMV65"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);