// static/js/registro.js

// --- PASO 1: PEGA TU CÓDIGO DE FIREBASE CONFIG AQUÍ ---
const firebaseConfig = {
  apiKey: "AIzaSyA19ORaIYFCH_vfPfamUjyR9iMxLGT1FVI",
  authDomain: "biblionube-328e4.firebaseapp.com",
  projectId: "biblionube-328e4",
  storageBucket: "biblionube-328e4.firebasestorage.app",
  messagingSenderId: "911996701364",
  appId: "1:911996701364:web:97ff11275b17a91b85a5e1",
  measurementId: "G-VWPDZYGQ88"
};

// --- PASO 2: INICIALIZA FIREBASE ---
// No necesitas importar nada, los scripts en el HTML lo hacen
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();


// --- PASO 3: LÓGICA DEL FORMULARIO DE REGISTRO ---

// Espera a que el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    
    const registerForm = document.getElementById('register-form');
    const passwordError = document.getElementById('passwordError');

    // Lógica para mostrar/ocultar el campo de número de documento
    // (Esta es la misma lógica que tenías en tu auth.js)
    const docTypeSelect = document.getElementById('tipo_documento');
    const docNumGroup = document.getElementById('document-number-group');
    if (docTypeSelect) {
        docTypeSelect.addEventListener('change', () => {
            if (docTypeSelect.value) {
                docNumGroup.style.display = 'block';
            } else {
                docNumGroup.style.display = 'none';
            }
        });
    }

    // Lógica para mostrar/ocultar contraseña
    const togglePass = document.getElementById('toggleAllPasswords');
    if (togglePass) {
        togglePass.addEventListener('click', () => {
            const passInput = document.getElementById('password');
            const confirmPassInput = document.getElementById('confirmPassword');
            const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passInput.setAttribute('type', type);
            confirmPassInput.setAttribute('type', type);
            togglePass.classList.toggle('fa-eye-slash');
        });
    }


    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // ¡Evita que el formulario se envíe!
            passwordError.textContent = ''; // Limpia errores

            // 1. Obtiene los datos del formulario (IDs del HTML actualizado)
            const nombre = registerForm.nombre.value;
            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const confirmPassword = registerForm.confirmPassword.value;
            const tipo_documento = registerForm.tipo_documento.value;
            const numero_documento = registerForm.numero_documento.value;
            const fecha_nacimiento = registerForm.fecha_nacimiento.value;

            // 2. Valida la contraseña
            if (password !== confirmPassword) {
                passwordError.textContent = 'Las contraseñas no coinciden.';
                return;
            }
            if (password.length < 6) {
                 passwordError.textContent = 'La contraseña debe tener al menos 6 caracteres.';
                 return;
            }

            try {
                // 3. CREA EL USUARIO EN FIREBASE
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // 4. AÑADE EL NOMBRE Y ENVÍA VERIFICACIÓN
                await user.updateProfile({
                    displayName: nombre
                });
                
                // ¡AQUÍ ESTÁ LA MAGIA! Envía el correo de verificación
                await user.sendEmailVerification();

                // 5. LLAMA A TU BACKEND PARA GUARDAR DATOS EXTRA
                const token = await user.getIdToken(); // Obtiene el token de Firebase

                const response = await fetch('/api/crear-perfil', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nombre: nombre,
                        email: email,
                        tipo_documento: tipo_documento,
                        numero_documento: numero_documento,
                        fecha_nacimiento: fecha_nacimiento
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    // Si falla el backend, borramos el usuario de Firebase para que reintente
                    await user.delete(); 
                    throw new Error(errorData.error || 'Error al guardar el perfil en el backend.');
                }

                // 6. ¡ÉXITO!
                alert('¡Registro exitoso! Revisa tu correo electrónico para verificar tu cuenta.');
                // Redirige al login o al index
                window.location.href = '/'; // O a tu página de login

            } catch (error) {
                // Maneja errores de Firebase (ej. email-already-in-use)
                console.error("Error en el registro:", error);
                if (error.code === 'auth/email-already-in-use') {
                    passwordError.textContent = 'Este correo electrónico ya está registrado.';
                } else {
                    passwordError.textContent = `Error: ${error.message}`;
                }
            }
        });
    }
});