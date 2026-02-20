// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
    getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, onSnapshot, query, orderBy, limit, where
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCpiCnHrWGGDmkoKTCN0srK-bzPC4vKDq0",
    authDomain: "prabuto-gaming-cafe.firebaseapp.com",
    projectId: "prabuto-gaming-cafe",
    storageBucket: "prabuto-gaming-cafe.firebasestorage.app",
    messagingSenderId: "510063822148",
    appId: "1:510063822148:web:f26f7598f63fb380ee0311",
    measurementId: "G-DGJ4DV4XN8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export {
    app, analytics, db, auth,
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, onSnapshot, query, orderBy, limit, where
};
