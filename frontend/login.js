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
    if (data.success) {
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        // Redireciona conforme função
        if (data.usuario.funcao === 'administrador') {
            window.location.href = 'admin.html';
        } else if (data.usuario.funcao === 'garcom') {
            window.location.href = 'historico.html';
        } else if (data.usuario.funcao === 'cozinha') {
            window.location.href = 'cozinha.html';
        } else {
            erro.textContent = 'Função não reconhecida.';
        }
    } else {
        erro.textContent = data.error || 'Erro ao fazer login.';
    }
};
