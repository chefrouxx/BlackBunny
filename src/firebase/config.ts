import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD1LYJhpPEg4HJKWOnQdWbmm36aTxfO67E",
  authDomain: "blackbunny-3c936.firebaseapp.com",
  projectId: "blackbunny-3c936",
  storageBucket: "blackbunny-3c936.firebasestorage.app",
  messagingSenderId: "622884962120",
  appId: "1:622884962120:web:010bb63b937b919ce3fd7d",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);