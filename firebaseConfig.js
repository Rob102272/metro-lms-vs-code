// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC4jnZnPe49rkApgYQ3S8mA68tnI0ptMxc",
  authDomain: "metrolms-84a6e.firebaseapp.com",
  projectId: "metrolms-84a6e",
  storageBucket: "metrolms-84a6e.firebasestorage.app",
  messagingSenderId: "27947383551",
  appId: "1:27947383551:web:90a733c1b8dc7037b2eaca",
  measurementId: "G-YLGKNH0W6K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);