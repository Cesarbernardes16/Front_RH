// frontend_G_RH/login.js

// ==========================================
// 1. SELEÇÃO DE ELEMENTOS DO DOM
// ==========================================
const loginForm = document.getElementById('login-form');
const cpfInput = document.getElementById('cpf');
const senhaInput = document.getElementById('senha');
const loginButton = document.getElementById('login-button');
const errorMessage = document.getElementById('error-message');

// Elementos do Modal de Nova Senha
const modalNovaSenha = document.getElementById('modal-nova-senha');
const formCriarSenha = document.getElementById('form-criar-senha');
const cpfHiddenInput = document.getElementById('cpf-hidden');
const telefoneInput = document.getElementById('telefone-confirmacao');
const novaSenhaInput = document.getElementById('nova-senha');
const confirmarSenhaInput = document.getElementById('confirmar-senha');
const btnSalvarSenha = document.getElementById('btn-salvar-senha');
const errorModal = document.getElementById('error-message-modal');

// URL do Backend
const API_URL = 'https://backend-g-rh.onrender.com';

// ==========================================
// 2. VERIFICAÇÃO INICIAL
// ==========================================
if (sessionStorage.getItem('usuarioLogado') === 'true') {
    window.location.href = 'index.html';
}

// ==========================================
// 3. LÓGICA DE LOGIN
// ==========================================
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
            salvarSessaoEEentrar(data.usuario);
        } 
        else if (data.precisa_definir_senha) {
            abrirModalCriacaoSenha(cpf);
        } 
        else {
            throw new Error(data.mensagem || 'Credenciais inválidas.');
        }

    } catch (error) {
        console.error('Erro:', error);
        errorMessage.textContent = error.message || 'Erro ao conectar com o servidor.';
    } finally {
        // Se o modal não estiver aberto, restaura o botão
        if (!modalNovaSenha.style.display || modalNovaSenha.style.display === 'none') {
            loginButton.disabled = false;
            loginButton.textContent = 'Entrar';
        }
    }
});

// ==========================================
// 4. LÓGICA DE CRIAÇÃO DE SENHA
// ==========================================
formCriarSenha.addEventListener('submit', async (e) => {
    e.preventDefault();

    const cpf = cpfHiddenInput.value;
    const telefone = telefoneInput.value.trim();
    const novaSenha = novaSenhaInput.value.trim();
    const confirmarSenha = confirmarSenhaInput.value.trim();

    if (novaSenha !== confirmarSenha) {
        errorModal.textContent = "As senhas não coincidem.";
        return;
    }

    if (novaSenha.length < 6) {
        errorModal.textContent = "A senha deve ter no mínimo 6 caracteres.";
        return;
    }
    
    if (telefone.length < 8) {
        errorModal.textContent = "Por favor, digite um telefone válido para confirmação.";
        return;
    }

    btnSalvarSenha.disabled = true;
    btnSalvarSenha.textContent = "Validando identidade...";
    errorModal.textContent = "";

    try {
        const response = await fetch(`${API_URL}/definir-senha`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                cpf: cpf, 
                novaSenha: novaSenha,
                telefoneValidacao: telefone 
            })
        });

        const data = await response.json();

        if (response.ok && data.sucesso) {
            alert("Identidade confirmada e senha criada com sucesso! Redirecionando...");
            if(data.usuario) {
                salvarSessaoEEentrar(data.usuario);
            } else {
                window.location.reload();
            }
        } else {
            throw new Error(data.mensagem || 'Erro ao criar senha.');
        }

    } catch (error) {
        errorModal.textContent = error.message;
        btnSalvarSenha.disabled = false;
        btnSalvarSenha.textContent = "Confirmar Identidade e Criar";
    }
});

// ==========================================
// 5. FUNÇÕES AUXILIARES
// ==========================================

function abrirModalCriacaoSenha(cpf) {
    cpfHiddenInput.value = cpf;
    modalNovaSenha.style.display = 'flex';
    loginButton.textContent = 'Aguardando Definição...';
}

function salvarSessaoEEentrar(usuario) {
    // 1. Limpeza básica do CPF para armazenamento
    let cpfLimpo = String(usuario.cpf).replace(/\D/g, '');
    while (cpfLimpo.length < 11) {
        cpfLimpo = "0" + cpfLimpo;
    }

    // 2. Armazena sessão com base no retorno do BACKEND
    // A segurança de quem é 'admin' ou 'user' agora vem do banco de dados (Supabase)
    sessionStorage.setItem('usuarioLogado', 'true');
    sessionStorage.setItem('usuarioNome', usuario.nome);
    sessionStorage.setItem('usuarioPerfil', usuario.perfil); // O backend deve retornar 'admin' ou 'user'
    sessionStorage.setItem('usuarioCPF', cpfLimpo);
    
    window.location.href = 'index.html';
}

window.onclick = function(event) {
    if (event.target == modalNovaSenha) {
        // Opção de fechar clicando fora (opcional, mantido comentado se preferir modal bloqueante)
        // modalNovaSenha.style.display = "none";
    }
}