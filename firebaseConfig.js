// Import Firebase functions
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC0tHbcqj2YZHf-oOpuvlpyhFGL8teaV88",
  authDomain: "rump-50570.firebaseapp.com",
  projectId: "rump-50570",
  storageBucket: "rump-50570.appspot.com",
  messagingSenderId: "130070402925",
  appId: "1:130070402925:web:24999085dfba4ab2722c64",
  measurementId: "G-BYBLBJJ0GZ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); // ✅ Corrected Firestore import

// Function to test Firestore connection
export const testFirestore = async () => {
  try {
    // Write test data
    const docRef = await addDoc(collection(db, "testCollection"), {
      name: "Test User",
      timestamp: new Date(),
    });
    console.log("🔥 Test document added with ID: ", docRef.id);

    // Read test data
    const querySnapshot = await getDocs(collection(db, "testCollection"));
    querySnapshot.forEach((doc) => {
      console.log("📄 Retrieved document:", doc.id, "=>", doc.data());
    });

    return true; // Success
  } catch (error) {
    console.error("❌ Firebase connection failed:", error);
    return false; // Failure
  }
};
