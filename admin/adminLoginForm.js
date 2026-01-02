import { auth, db } from "../config/config.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const form = document.getElementById("admin-login-form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("admin-email").value.trim();
  const password = document.getElementById("admin-password").value;

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    // 🔎 Verify admin role
    const adminRef = doc(db, "admins", uid);
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists()) {
      await auth.signOut();
      alert("Access denied. Admin only.");
      return;
    }

    const adminData = adminSnap.data();

    if (!adminData.active) {
      await auth.signOut();
      alert("Admin account disabled.");
      return;
    }

    // ✅ Authorized admin
    window.location.replace("./admin/dashboard.html");

  } catch (error) {
    console.error(error);
    alert("Invalid credentials");
  }
});
