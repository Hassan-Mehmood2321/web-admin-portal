import {
  auth,
  onAuthStateChanged,
  signOut,
  db,
  doc,
  getDoc
} from "../config/config.js";

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const sidebarName = document.getElementById("sidebar-name");
    try {
      const docRef = doc(db, "students", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("Document data:", data);
        if (sidebarName) sidebarName.textContent = data.studentName || "";
      } else {
        console.log("No such document!");
      }
    } catch (err) {
      console.error("Error fetching student doc:", err);
    }
  } else {
    window.location.replace("../public/index.html");
  }
});


onAuthStateChanged(auth, (user) => {
  if (user) {
    const last6 = user.uid.slice(-6).toUpperCase();
    document.getElementById("sidebar-id").textContent = "ID"+":"+last6;
  }
});


onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  try {
    const docRef = doc(db, "students", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      const createdAt = data.createdAt?.toDate
        ? data.createdAt.toDate().toLocaleDateString()
        : "N/A";

      document.getElementById("Term").textContent =
        `Term: Spring • Joined: ${createdAt}`;
    }
  } catch (err) {
    console.error("Error fetching student doc:", err);
  }
});

const courseEl = document.getElementById("display-course-name");

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  try {
    const docRef = doc(db, "students", user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.warn("No student document");
      return;
    }

    const data = docSnap.data();
    courseEl.textContent = data.courseApplied ?? "";

  } catch (err) {
    console.error("Error fetching course:", err);
  }
});

document.getElementById('logout-btn').addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.replace("../public/index.html");
    // Sign-out successful.
  }).catch((error) => {
    // An error happened.
    console.error(error);
  });
});

