import { deleteApp, initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signOut, updateProfile } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database";

/**
 * Create a student login without changing the parent session.
 * Uses a temporary secondary Firebase app.
 */
async function createStudentAccount(firebaseConfig, { email, password, name }) {
  const trimmedEmail = String(email || "").trim();
  const trimmedName = String(name || "").trim() || "Student";
  const pass = String(password || "");
  if (!trimmedEmail || !trimmedEmail.includes("@")) {
    throw new Error("Enter a valid email address.");
  }
  if (pass.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const appName = `create-student-${Date.now()}`;
  const app = initializeApp(firebaseConfig, appName);
  const auth = getAuth(app);
  const db = getDatabase(app);
  try {
    const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, pass);
    const uid = credential.user.uid;
    await updateProfile(credential.user, { displayName: trimmedName });
    await set(ref(db, `profiles/${uid}/name`), trimmedName);
    return { uid, email: trimmedEmail, name: trimmedName };
  } finally {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    try {
      await deleteApp(app);
    } catch {
      // ignore
    }
  }
}

export { createStudentAccount };
