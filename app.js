// Importe as funções necessárias do SDK do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getAuth, 
    GithubAuthProvider, 
    signInWithPopup, 
    signInWithEmailAndPassword, 
    sendPasswordResetEmail,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Configurações do Firebase (usando as credenciais corretas do projeto)
const firebaseConfig = {
    apiKey: "AIzaSyAy4aWx-DO6pVeiCq37t-PcwMvr7lhRIzw",
    authDomain: "maisto-fresh-metal.firebaseapp.com",
    projectId: "maisto-fresh-metal",
    storageBucket: "maisto-fresh-metal.firebasestorage.app",
    messagingSenderId: "237854342909",
    appId: "1:237854342909:web:0bef57068b33194ab00894",
    measurementId: "G-35FH494LSF"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const githubProvider = new GithubAuthProvider(); // Provedor do GitHub

// Seleciona os elementos do DOM
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const githubBtn = document.getElementById('github-login-btn');
const forgotPasswordLink = document.getElementById('forgot-password');
const errorMessage = document.getElementById('error-message');

// --- Função de Login com Email e Senha ---
loginForm.addEventListener('submit', (e) => {
    e.preventDefault(); 
    const email = emailInput.value;
    const password = passwordInput.value;
    
    errorMessage.textContent = ''; // Limpa erros antigos

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log('Logado com Email/Senha:', userCredential.user);
            window.location.href = '/upload.html'; // Redireciona para a página de upload
        })
        .catch((error) => {
            console.error('Erro no login:', error.code);
            errorMessage.textContent = getFriendlyErrorMessage(error.code);
        });
});

// --- Função de Login com GitHub ---
githubBtn.addEventListener('click', () => {
    errorMessage.textContent = '';

    signInWithPopup(auth, githubProvider)
        .then((result) => {
            console.log('Logado com GitHub:', result.user);
            window.location.href = '/upload.html'; // Redireciona para a página de upload
        })
        .catch((error) => {
            console.error('Erro no login com GitHub:', error);
            errorMessage.textContent = getFriendlyErrorMessage(error.code);
        });
});

// --- Função de Recuperar Senha ---
forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    const email = emailInput.value;
    
    if (!email) {
        errorMessage.textContent = 'Por favor, digite seu e-mail para recuperar a senha.';
        return;
    }

    sendPasswordResetEmail(auth, email)
        .then(() => {
            alert('E-mail de recuperação de senha enviado! Verifique sua caixa de entrada.');
            errorMessage.textContent = '';
        })
        .catch((error) => {
            console.error('Erro ao enviar e-mail de recuperação:', error);
            errorMessage.textContent = getFriendlyErrorMessage(error.code);
        });
});

// --- Observador de estado de autenticação ---
onAuthStateChanged(auth, (user) => {
    // Se o usuário já estiver logado, redireciona para a página de upload
    if (user) {
        console.log('Usuário já está logado, redirecionando...');
        // Verifica se a página atual não é a de upload para evitar loops
        if (window.location.pathname !== '/upload.html') {
            window.location.href = '/upload.html';
        }
    } else {
        console.log('Nenhum usuário logado.');
    }
});

// --- Função auxiliar para traduzir erros ---
function getFriendlyErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/user-not-found':
        case 'auth/invalid-credential':
            return 'E-mail ou senha incorretos.';
        case 'auth/wrong-password':
            return 'Senha incorreta. Tente novamente.';
        case 'auth/invalid-email':
            return 'O formato do e-mail é inválido.';
        case 'auth/too-many-requests':
            return 'Muitas tentativas de login. Tente novamente mais tarde.';
        case 'auth/account-exists-with-different-credential':
            return 'Já existe uma conta com este e-mail, mas com um método de login diferente.';
        default:
            return 'Ocorreu um erro. Tente novamente.';
    }
}
