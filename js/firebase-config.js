// Твои Firebase ключи
const firebaseConfig = {
    apiKey: "AIzaSyAElgXPPCKr7Xig8a1ghFeG7hNAWiTM6q4",
    authDomain: "nexus-ai-67177.firebaseapp.com",
    projectId: "nexus-ai-67177",
    storageBucket: "nexus-ai-67177.firebasestorage.app",
    messagingSenderId: "889750581067",
    appId: "1:889750581067:web:ac3e2e6f7c9ab7de6902ce",
    measurementId: "G-D5ZMDK6EE9"
};

// URL твоего Cloudflare Worker
const WORKER_URL = 'https://nexus-proxy.marazmatikpepe.workers.dev';

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();
