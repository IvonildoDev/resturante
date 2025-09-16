// admin.js - Painel Administrativo
const ADMIN_PASSWORD = 'admin123'; // Troque para uma senha forte depois!

function adminLogin() {
    const senha = document.getElementById('admin-password').value;
    const erro = document.getElementById('login-erro');
    if (senha === ADMIN_PASSWORD) {
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        carregarResumoAdmin();
        carregarEstoqueAdmin();
        carregarRelatorioFinanceiro();
        carregarMenuAdmin();
        carregarPedidosAdmin();
    } else {
        erro.textContent = 'Senha incorreta!';
    }
}

// Relatório financeiro: total de vendas, por período e por garçom
async function carregarRelatorioFinanceiro() {
    // Obter datas do filtro
    const inicio = document.getElementById('filtro-fin-data-inicio').value;
    const fim = document.getElementById('filtro-fin-data-fim').value;
    let url = '../backend/pedidos.php?historico=1';
    if (inicio) url += `&data_inicio=${inicio}`;
    if (fim) url += `&data_fim=${fim}`;
    const resp = await fetch(url);
    const pedidos = await resp.json();
    let total = 0;
    const porDia = {};
    pedidos.forEach(p => {
        const valor = (parseFloat(p.quantidade) * (parseFloat(p.preco) || 0)) || 0;
        total += valor;
        const dia = p.data_hora ? p.data_hora.slice(0, 10) : '';
        if (dia) {
            if (!porDia[dia]) porDia[dia] = 0;
            porDia[dia] += valor;
        }
    });
    let html = `<div class='financeiro-total'><b>Total Geral:</b> R$ ${total.toFixed(2)}</div>`;
    html += '<div class="financeiro-periodo"><b>Faturamento por Dia:</b><ul>';
    Object.entries(porDia).forEach(([dia, valor]) => {
        html += `<li>${dia.split('-').reverse().join('/')} - R$ ${valor.toFixed(2)}</li>`;
    });
    html += '</ul></div>';
    document.getElementById('relatorio-financeiro').innerHTML = html;
}

async function abrirModalItem(id) {
    document.getElementById('modal-titulo').textContent = id ? 'Editar Item' : 'Novo Item';
    document.getElementById('modal-item').style.display = 'block';
    if (id) {
        const resp = await fetch(`../backend/menu.php?id=${id}`);
        const item = await resp.json();
        document.getElementById('item-id').value = item.id;
        document.getElementById('item-nome').value = item.nome;
        document.getElementById('item-categoria').value = item.categoria;
        document.getElementById('item-preco').value = item.preco;
        document.getElementById('item-imagem').value = item.imagem;
        document.getElementById('item-descricao').value = item.descricao;
    } else {
        document.getElementById('item-id').value = '';
        document.getElementById('item-nome').value = '';
        document.getElementById('item-categoria').value = '';
        document.getElementById('item-preco').value = '';
        document.getElementById('item-imagem').value = '';
        document.getElementById('item-descricao').value = '';
    }
}


document.getElementById('form-item').onsubmit = async function (e) {
    e.preventDefault();
    const id = document.getElementById('item-id').value;
    const nome = document.getElementById('item-nome').value;
    const categoria = document.getElementById('item-categoria').value;
    const preco = document.getElementById('item-preco').value;
    const imagem = document.getElementById('item-imagem').value;
    const descricao = document.getElementById('item-descricao').value;
    const body = { nome, categoria, preco, imagem, descricao };
    let method = 'POST', url = '../backend/menu.php';
    if (id) { method = 'PUT'; url += `?id=${id}`; body.id = id; }
    await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    fecharModalItem();
    carregarMenuAdmin();
};

async function editarItem(id) { abrirModalItem(id); }

// Garante que adminLogin está disponível globalmente para o onclick do HTML
window.adminLogin = adminLogin;
async function excluirItem(id) {
    if (!confirm('Deseja excluir este item?')) return;
    await fetch(`../backend/menu.php?id=${id}`, { method: 'DELETE' });
    carregarMenuAdmin();
}

// Pedidos recentes
async function carregarPedidosAdmin() {
    const resp = await fetch('../backend/pedidos.php?historico=1');
    const pedidos = await resp.json();
    const tbody = document.querySelector('#tabela-pedidos tbody');
    tbody.innerHTML = '';
    pedidos.slice(0, 20).forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.id}</td>
            <td>${p.mesa}</td>
            <td>${p.nome}</td>
            <td>${p.quantidade}</td>
            <td>${p.status}</td>
            <td>${p.data_hora}</td>
            <td><button onclick="excluirPedido(${p.id})"><i class='fas fa-trash'></i></button></td>
        `;
        tbody.appendChild(tr);
    });
}
async function excluirPedido(id) {
    if (!confirm('Excluir este pedido?')) return;
    await fetch(`../backend/pedidos.php?id=${id}`, { method: 'DELETE' });
    carregarPedidosAdmin();
}
