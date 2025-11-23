const firebaseConfig = {
    apiKey: "AIzaSyA19ORaIYFCH_vfPfamUjyR9iMxLGT1FVI",
    authDomain: "biblionube-328e4.firebaseapp.com",
    projectId: "biblionube-328e4",
    storageBucket: "biblionube-328e4.firebasestorage.app",
    messagingSenderId: "911996701364",
    appId: "1:911996701364:web:97ff11275b17a91b85a5e1",
    measurementId: "G-VWPDZYGQ88"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();