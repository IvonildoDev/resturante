// proteção.js
// Redireciona para login se não estiver autenticado ou não tiver permissão
function checarAcesso(permitidos) {
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    if (!usuario || !permitidos.includes(usuario.funcao)) {
        window.location.href = 'login.html';
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
