import {
  auth,
  signInWithEmailAndPassword,
  onAuthStateChanged
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

const loginBtn = document.getElementById("loginBut");

const handleLogin = async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.replace("student/dashboard.html");
    //  Redirect handled by onAuthStateChanged
    console.log("Login successful ");

  } catch (error) {
    alert(error.message);
    console.error(error.code);
  }
};

loginBtn.addEventListener("click", handleLogin);
