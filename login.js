// frontend_G_RH/login.js

const loginForm = document.getElementById('login-form');
const cpfInput = document.getElementById('cpf');
const senhaInput = document.getElementById('senha');
const loginButton = document.getElementById('login-button');
const errorMessage = document.getElementById('error-message');

const modalNovaSenha = document.getElementById('modal-nova-senha');
const formCriarSenha = document.getElementById('form-criar-senha');
const cpfHiddenInput = document.getElementById('cpf-hidden');
const telefoneInput = document.getElementById('telefone-confirmacao');
const novaSenhaInput = document.getElementById('nova-senha');
const confirmarSenhaInput = document.getElementById('confirmar-senha');
const btnSalvarSenha = document.getElementById('btn-salvar-senha');
const errorModal = document.getElementById('error-message-modal');

const API_URL = 'https://backend-g-rh.onrender.com';

// 1. VERIFICAÇÃO DE SEGURANÇA (Se já estiver logado via Cookie, entra direto)
try {
    const usuarioLogado = Sessao.ler();
    if (usuarioLogado && usuarioLogado.cpf) {
        console.log("Usuário já logado, redirecionando...");
        window.location.href = 'index.html';
    }
} catch (e) {
    console.error("Erro ao ler sessão:", e);
}

// 2. LÓGICA DE LOGIN
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const cpf = cpfInput.value.trim();
    const senha = senhaInput.value.trim();

    loginButton.disabled = true;
    loginButton.textContent = 'Verificando...';
    errorMessage.textContent = '';

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cpf, senha })
        });

        const data = await response.json();

        if (response.ok && data.sucesso) {
            console.log("Login bem sucedido! Salvando sessão...");
            salvarSessaoEEentrar(data.usuario);
        } 
        else if (data.precisa_definir_senha) {
            abrirModalCriacaoSenha(cpf);
        } 
        else {
            throw new Error(data.mensagem || 'Credenciais inválidas.');
        }

    } catch (error) {
        console.error('Erro no login:', error);
        errorMessage.textContent = error.message || 'Erro ao conectar com o servidor.';
    } finally {
        // Só reativa o botão se o modal não estiver aberto
        if (!modalNovaSenha.style.display || modalNovaSenha.style.display === 'none') {
            loginButton.disabled = false;
            loginButton.textContent = 'Entrar';
        }
    }
});

// 3. LÓGICA DE CRIAÇÃO DE SENHA
formCriarSenha.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cpf = cpfHiddenInput.value;
    const telefone = telefoneInput.value.trim();
    const novaSenha = novaSenhaInput.value.trim();
    const confirmarSenha = confirmarSenhaInput.value.trim();

    if (novaSenha !== confirmarSenha) {
        errorModal.textContent = "As senhas não coincidem."; return;
    }
    if (novaSenha.length < 6) {
        errorModal.textContent = "Mínimo 6 caracteres."; return;
    }
    
    btnSalvarSenha.disabled = true;
    btnSalvarSenha.textContent = "Validando...";

    try {
        const response = await fetch(`${API_URL}/definir-senha`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cpf, novaSenha, telefoneValidacao: telefone })
        });

        const data = await response.json();

        if (response.ok && data.sucesso) {
            alert("Senha criada com sucesso! Entrando...");
            salvarSessaoEEentrar(data.usuario);
        } else {
            throw new Error(data.mensagem || 'Erro ao criar senha.');
        }
    } catch (error) {
        errorModal.textContent = error.message;
        btnSalvarSenha.disabled = false;
        btnSalvarSenha.textContent = "Confirmar e Criar";
    }
});

function abrirModalCriacaoSenha(cpf) {
    cpfHiddenInput.value = cpf;
    modalNovaSenha.style.display = 'flex';
    loginButton.textContent = 'Aguardando...';
}

function salvarSessaoEEentrar(usuario) {
    // 1. Limpeza CPF (Garante zeros à esquerda)
    let cpfLimpo = String(usuario.cpf).replace(/\D/g, '');
    while (cpfLimpo.length < 11) cpfLimpo = "0" + cpfLimpo;
    usuario.cpf = cpfLimpo;

    // 2. Salva no Cookie Seguro
    console.log("Salvando usuário no cookie:", usuario);
    Sessao.salvar(usuario);
    
    // 3. Redireciona com um pequeno delay para garantir que o cookie foi gravado
    setTimeout(() => {
        console.log("Redirecionando para index.html...");
        window.location.replace('index.html'); // .replace impede voltar para login
    }, 100);
}

// Fecha modal clicando fora
window.onclick = function(event) {
    if (event.target == modalNovaSenha) {
        // modalNovaSenha.style.display = "none"; // Opcional
    }
}