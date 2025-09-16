// nav.js
// Exibe apenas os menus permitidos para cada função

document.addEventListener('DOMContentLoaded', function () {
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    if (!usuario) return;
    const funcao = (usuario.funcao || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const nav = document.querySelector('.main-nav');
    if (!nav) return;

    // Mapear permissões de menu por função
    const permissoes = {
        'administrador': ['index.html', 'cozinha.html', 'historico.html', 'admin.html', 'estoque.html', 'caixa.html'],
        'garcom': ['index.html', 'estoque.html', 'historico.html'],
        'cozinha': ['cozinha.html', 'estoque.html'],
        'auxiliar de cozinha': ['cozinha.html', 'estoque.html'],
        'churrasqueiro': ['cozinha.html', 'estoque.html'],
        'cozinheiro': ['cozinha.html', 'estoque.html'],
        'caixa': ['caixa.html', 'estoque.html', 'index.html', 'historico.html']
    };

    // Obter páginas permitidas para a função
    const permitidas = permissoes[funcao] || [];

    // Esconder links não permitidos
    nav.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');
        if (!permitidas.includes(href)) {
            link.style.display = 'none';
        }
    });
});
