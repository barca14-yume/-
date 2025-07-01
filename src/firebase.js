// Firebase初期化用
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDxIbH2AlzKEXqr7V1H2AbABle4yttl2Os",
  authDomain: "baseballdata-635cf.firebaseapp.com",
  projectId: "baseballdata-635cf",
  storageBucket: "baseballdata-635cf.firebasestorage.app",
  messagingSenderId: "729555071148",
  appId: "1:729555071148:web:471149a1e4fee9e276ef09",
  measurementId: "G-EHKY8DXJDN"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
