import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectDatabaseEmulator, getDatabase } from "firebase/database";

const useEmulators = import.meta.env.VITE_USE_EMULATORS === "true";

const firebaseConfig = useEmulators
  ? {
      apiKey: "demo",
      authDomain: "demo-sophia.firebaseapp.com",
      databaseURL: "https://demo-sophia-default-rtdb.firebaseio.com",
      projectId: "demo-sophia",
      appId: "demo",
    }
  : {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
      authDomain: "sophia-138fe.firebaseapp.com",
      databaseURL: "https://sophia-138fe-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "sophia-138fe",
      appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

if (useEmulators) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectDatabaseEmulator(db, "127.0.0.1", 9000);
}

export { auth, db, useEmulators, firebaseConfig };
