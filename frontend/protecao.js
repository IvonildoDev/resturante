// proteção.js
// Redireciona para login se não estiver autenticado ou não tiver permissão
function normalizarFuncao(str) {
    return (str || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function checarAcesso(permitidos) {
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    if (!usuario) {
        window.location.href = 'login.html';
        return;
    }
    const funcao = normalizarFuncao(usuario.funcao);
    // Permitir todas as funções de cozinha
    const funcoesCozinha = ['cozinha', 'auxiliar de cozinha', 'churrasqueiro', 'cozinheiro'];
    const permitido = permitidos.some(p => funcao === normalizarFuncao(p)) || funcoesCozinha.includes(funcao);
    if (!permitido) {
        window.location.href = 'login.html';
        return;
    }
    // Exibe nome e função no topo, se desejar
    const userBar = document.getElementById('user-bar');
    if (userBar) {
        userBar.innerHTML = `<i class='fas fa-user'></i> ${usuario.nome} (${usuario.funcao}) <button onclick="logout()" title="Sair"><i class='fas fa-sign-out-alt'></i></button>`;
    }
}
function logout() {
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
}
