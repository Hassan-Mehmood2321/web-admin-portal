// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword ,onAuthStateChanged, signInWithEmailAndPassword , signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { setDoc, doc, getFirestore, getDoc, collection, getDocs, getCountFromServer, updateDoc, writeBatch } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAT3SeS5P0CwN_C9Eg7nYX0eIJV-Z6w6dc",
  authDomain: "aplex-punch.firebaseapp.com",
  projectId: "aplex-punch",
  storageBucket: "aplex-punch.firebasestorage.app",
  messagingSenderId: "343986278498",
  appId: "1:343986278498:web:3da8ce90b9bb11c067013b",
  measurementId: "G-P4ZBD4KN3W"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export {
  auth,
  createUserWithEmailAndPassword,
  setDoc,
  doc,
  db,
  getDoc,
  getDocs,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  collection,
  getCountFromServer,
  updateDoc,
  writeBatch
}