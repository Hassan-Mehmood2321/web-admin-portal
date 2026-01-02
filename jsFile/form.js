import {
  auth,
  createUserWithEmailAndPassword,
  setDoc,
  doc,
  db,onAuthStateChanged
} from "../config/config.js";



onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.replace("student/dashboard.html");
    const uid = user.uid;
    // ...
  } else {
    // User is signed out
    // ...
  }
});


const form = document.getElementById("registrationForm");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const studentName = document.getElementById("studentName").value.trim();
  const courseApplied = document.getElementById("courseApplied").value;
  const fatherName = document.getElementById("fatherName").value.trim();
  const phoneNumber = document.getElementById("phoneNumber").value.trim();
  const address = document.getElementById("address").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    alert("Passwords do not match ");
    return;
  }

  try {

    //  Create user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const uid = userCredential.user.uid;

    // Save user data
    await setDoc(doc(db, "students", uid), {
      studentName,
      courseApplied,
      fatherName,
      phoneNumber,
      address,
      email,
      createdAt: new Date()
    });

    alert("Registration successful ");
    form.reset();
    window.location.replace("student/dashboard.html");
    console.log("User created:", uid);

  } catch (error) {
    console.error(error);
    // Handle common Firebase auth errors more gracefully
    if (error && error.code === 'auth/email-already-in-use') {
      alert('This email is already registered. Please log in instead or use a different email.');
    } else {
      alert(error.message || 'An error occurred during registration.');
    }
  }
});
