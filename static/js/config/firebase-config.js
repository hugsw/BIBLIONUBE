const metaTag = document.getElementById('firebase-config-data');
const configFromEnv = metaTag ? JSON.parse(metaTag.getAttribute('data-config')) : {};

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
    console.error("Error Crítico: No se encontró la API KEY. Verifica que el archivo .env tenga las variables y que base.html tenga el meta tag.");
}

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();