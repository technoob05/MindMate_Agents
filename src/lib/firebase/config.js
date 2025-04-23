import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCQ_1xKCXvJs9IYgFog49Id7M6cMMtzEdE",
  authDomain: "gdc-apac.firebaseapp.com",
  projectId: "gdc-apac",
  storageBucket: "gdc-apac.firebasestorage.app",
  messagingSenderId: "422155594611",
  appId: "1:422155594611:web:6b2ecac863f2d20808f306",
  measurementId: "G-KEW87DJM4B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app };