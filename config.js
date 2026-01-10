// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBTZveJffu2Ed33hhU_G025FVMedIKyg28",
  authDomain: "mindwave-binaural-beats.firebaseapp.com",
  projectId: "mindwave-binaural-beats",
  storageBucket: "mindwave-binaural-beats.firebasestorage.app",
  messagingSenderId: "281133643186",
  appId: "1:281133643186:web:f61fb74e2fcf4cc4e660ab",
  measurementId: "G-TENPZ98XDX"
};

// Make it globally available as JSON string (expected by firebase.js)
window.__firebase_config = JSON.stringify(firebaseConfig);
