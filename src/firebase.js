// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCvnCYNQajsCVimdxQskd8rnh1kYKFS3ao",
  authDomain: "trackingappy1n6.firebaseapp.com",
  projectId: "trackingappy1n6",
  storageBucket: "trackingappy1n6.firebasestorage.app",
  messagingSenderId: "649825327241",
  appId: "1:649825327241:web:c2c46140aad8c75549ce58",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
