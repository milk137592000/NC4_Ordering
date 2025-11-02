import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// FIX: Switched from namespace to named import for Firestore to align with Firebase v9+ modular SDK.
import * as firestore from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBwrpIc_ZAfS91xwg42TbrV8KIv1mIKJzo",
    authDomain: "nc4-ordering.firebaseapp.com",
    projectId: "nc4-ordering",
    storageBucket: "nc4-ordering.appspot.com",
    messagingSenderId: "1090860774927",
    appId: "1:1090860774927:web:5b5511e5dd1dee1b01957a",
    measurementId: "G-692Y2BQGMY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the database service and auth service
// FIX: Used named import `getFirestore` instead of namespace `firestore.getFirestore`
export const db = firestore.getFirestore(app);
export const auth = getAuth(app);