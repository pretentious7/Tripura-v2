
//Firebase App (the core Firebase SDK) is always required and must be listed first
import * as firebase from "firebase/app";

// If you enabled Analytics in your project, add the Firebase SDK for Analytics
import "firebase/analytics";

// Add the Firebase products that you want to use
import "firebase/auth";
import "firebase/firestore";
import "firebase/functions";
import "firebase/storage";

const firebaseConfig = {
	    apiKey: "AIzaSyD9sclHZ_WKIs_xnAg5TESMDa9N_y0gMgc",
	    authDomain: "eminent-kit-249500.firebaseapp.com",
	    databaseURL: "https://eminent-kit-249500.firebaseio.com",
	    projectId: "eminent-kit-249500",
	    storageBucket: "eminent-kit-249500.appspot.com",
	    messagingSenderId: "908527183481",
	    appId: "1:908527183481:web:022d61e01cdd176399d6a8",
	    measurementId: "G-GP2S1480K2"
}

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const functions = firebase.functions();
const storage = firebase.storage();
const auth = firebase.auth();

export { db, functions, storage, auth };

