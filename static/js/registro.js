const firebaseConfig = {
    apiKey: "AIzaSyA19ORaIYFCH_vfPfamUjyR9iMxLGT1FVI",
    authDomain: "biblionube-328e4.firebaseapp.com",
    projectId: "biblionube-328e4",
    storageBucket: "biblionube-328e4.firebasestorage.app",
    messagingSenderId: "911996701364",
    appId: "1:911996701364:web:97ff11275b17a91b85a5e1",
    measurementId: "G-VWPDZYGQ88"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', () => {

    const registerForm = document.getElementById('register-form');
    const passwordError = document.getElementById('passwordError');

    const docTypeSelect = document.getElementById('tipo_documento');
    const docNumGroup = document.getElementById('document-number-group');
    const docNumInput = document.getElementById('numero_documento');

    if (docTypeSelect && docNumGroup && docNumInput) {
        docTypeSelect.addEventListener('change', () => {
            const selectedType = docTypeSelect.value;

            docNumInput.value = '';

            if (selectedType) {
                docNumGroup.style.display = 'block';

                if (selectedType === 'dni') {
                    docNumInput.placeholder = 'Ingrese 8 dígitos';
                    docNumInput.maxLength = 8;
                    docNumInput.inputMode = 'numeric';
                } else if (selectedType === 'ce') {
                    docNumInput.placeholder = 'Ingrese 12 caracteres';
                    docNumInput.maxLength = 12;
                    docNumInput.inputMode = 'text';
                } else if (selectedType === 'passport') {
                    docNumInput.placeholder = 'Ingrese N° de Pasaporte';
                    docNumInput.maxLength = 20;
                    docNumInput.inputMode = 'text';
                }

            } else {
                docNumGroup.style.display = 'none';
            }
        });
    }

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

    if (docNumInput) {
        docNumInput.addEventListener('input', () => {
            const selectedType = docTypeSelect.value;

            if (selectedType === 'dni') {
                docNumInput.value = docNumInput.value.replace(/[^0-9]/g, '');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            passwordError.textContent = '';
            const nombre = registerForm.nombre.value;
            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const confirmPassword = registerForm.confirmPassword.value;
            const tipo_documento = registerForm.tipo_documento.value;
            const numero_documento = registerForm.numero_documento.value;
            const fecha_nacimiento = registerForm.fecha_nacimiento.value;

            if (tipo_documento === 'dni' && numero_documento.length !== 8) {
                passwordError.textContent = 'El DNI debe tener 8 dígitos.';
                return;
            }
            if (tipo_documento === 'ce' && numero_documento.length !== 12) {
                passwordError.textContent = 'El Carné de Extranjería debe tener 12 caracteres.';
                return;
            }
            if (password !== confirmPassword) {
                passwordError.textContent = 'Las contraseñas no coinciden.';
                return;
            }
            if (password.length < 6) {
                passwordError.textContent = 'La contraseña debe tener al menos 6 caracteres.';
                return;
            }

            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                await user.updateProfile({
                    displayName: nombre
                });
                await user.sendEmailVerification();

                const token = await user.getIdToken();

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
                    await user.delete();
                    throw new Error(errorData.error || 'Error al guardar el perfil en el backend.');
                }

                alert('¡Registro exitoso! Revisa tu correo electrónico para verificar tu cuenta.');
                window.location.href = '/';

            } catch (error) {
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