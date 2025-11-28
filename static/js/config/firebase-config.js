const configFromEnv = window.FIREBASE_CONFIG_SERVER || {};
const firebaseConfig = {
    apiKey: configFromEnv.apiKey,
    authDomain: configFromEnv.authDomain,
    projectId: configFromEnv.projectId,
    storageBucket: configFromEnv.storageBucket,
    messagingSenderId: configFromEnv.messagingSenderId,
    appId: configFromEnv.appId,
    measurementId: configFromEnv.measurementId
};

if (!firebaseConfig.apiKey) {
    console.error("Error: No se encontró la configuración de Firebase. Asegúrate de configurar el archivo .env correctamente.");
}

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();