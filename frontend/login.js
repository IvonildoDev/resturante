// login.js
// Ao logar, salva dados do usuário no localStorage e redireciona para a área correta

document.getElementById('login-form').onsubmit = async function (e) {
    e.preventDefault();
    const nome = document.getElementById('login-nome').value;
    const matricula = document.getElementById('login-matricula').value;
    const senha = document.getElementById('login-senha').value;
    const erro = document.getElementById('login-erro');
    erro.textContent = '';
    const resp = await fetch('../backend/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, matricula, senha })
    });
    const data = await resp.json();
    console.log('Resposta do backend:', data);
    if (data.success) {
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        // Normaliza função para evitar problemas de espaços, maiúsculas/minúsculas e acentuação
        function normalizarFuncao(str) {
            return (str || '')
                .trim()
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
        }
        const funcao = normalizarFuncao(data.usuario.funcao);
        console.log('Função recebida:', funcao);
        if (funcao === 'administrador') {
            window.location.href = 'admin.html';
        } else if (funcao === 'garcom') {
            window.location.href = 'historico.html';
        } else if (
            funcao === 'cozinha' ||
            funcao === 'auxiliar de cozinha' ||
            funcao === 'churrasqueiro' ||
            funcao === 'cozinheiro'
        ) {
            window.location.href = 'cozinha.html';
        } else if (funcao === 'caixa') {
            window.location.href = 'caixa.html';
        } else {
            erro.textContent = 'Função não reconhecida.';
        }
    } else {
        erro.textContent = data.error || 'Erro ao fazer login.';
    }
};
