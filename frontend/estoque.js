// Função para imprimir apenas o cupom
function imprimirCupom() {
    const conteudo = document.getElementById('cupom-relatorio').textContent;
    const win = window.open('', '', 'width=500,height=600');
    win.document.write('<pre style="font-family:Courier New,monospace;font-size:1.1em;padding:24px;">' + conteudo.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>');
    win.document.close();
    win.focus();
    win.print();
    win.close();
}
// estoque.js - Controle de Estoque
let carrinho = [];

async function carregarEstoque() {
    const resp = await fetch('../backend/estoque.php');
    const produtos = await resp.json();
    const tbody = document.querySelector('#tabela-estoque tbody');
    tbody.innerHTML = '';
    produtos.forEach(prod => {
        // Formatar validade para dd/mm/yyyy
        let validadeFormatada = '';
        if (prod.validade) {
            const d = new Date(prod.validade);
            validadeFormatada = d.toLocaleDateString('pt-BR');
        }
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${prod.id}</td>
            <td>${prod.produto}</td>
            <td>${validadeFormatada}</td>
            <td>${parseInt(prod.quantidade)}</td>
            <td>${prod.unidade}</td>
            <td>
                <button onclick="editarEstoque(${prod.id})"><i class='fas fa-edit'></i></button>
                <button onclick="excluirEstoque(${prod.id})"><i class='fas fa-trash'></i></button>
            </td>
            <td>
                <button onclick="adicionarAoCarrinho(${prod.id}, '${prod.produto.replace(/'/g, "\'")}', '${prod.unidade}', ${parseInt(prod.quantidade)})" class="btn-add" style="padding:4px 10px;font-size:0.95em;"><i class='fas fa-cart-plus'></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function abrirModalEstoque(id) {
    document.getElementById('modal-estoque').style.display = 'flex';
    document.getElementById('form-estoque').reset();
    document.getElementById('modal-titulo-estoque').textContent = id ? 'Editar Produto' : 'Novo Produto';
    if (id) preencherModalEstoque(id);
    else document.getElementById('estoque-id').value = '';
}

function fecharModalEstoque() {
    document.getElementById('modal-estoque').style.display = 'none';
}

async function preencherModalEstoque(id) {
    const resp = await fetch(`../backend/estoque.php?id=${id}`);
    const prod = await resp.json();
    document.getElementById('estoque-id').value = prod.id;
    document.getElementById('estoque-produto').value = prod.produto;
    document.getElementById('estoque-validade').value = prod.validade;
    document.getElementById('estoque-quantidade').value = prod.quantidade;
    document.getElementById('estoque-unidade').value = prod.unidade;
}

document.getElementById('form-estoque').onsubmit = async function (e) {
    e.preventDefault();
    const id = document.getElementById('estoque-id').value;
    const produto = document.getElementById('estoque-produto').value;
    const validade = document.getElementById('estoque-validade').value;
    const quantidade = document.getElementById('estoque-quantidade').value;
    const unidade = document.getElementById('estoque-unidade').value;
    const body = { produto, validade, quantidade, unidade };
    let method = 'POST', url = '../backend/estoque.php';
    if (id) { method = 'PUT'; url += `?id=${id}`; body.id = id; }
    await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    fecharModalEstoque();
    carregarEstoque();
};

async function editarEstoque(id) { abrirModalEstoque(id); }
async function excluirEstoque(id) {
    if (!confirm('Deseja excluir este produto?')) return;
    await fetch(`../backend/estoque.php?id=${id}`, { method: 'DELETE' });
    carregarEstoque();
}

function renderizarCarrinho() {
    const lista = document.getElementById('carrinho-lista');
    lista.innerHTML = '';
    carrinho.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${item.produto} (${item.unidade})</span>
            <input type="number" min="1" step="1" max="${item.max}" value="${parseInt(item.quantidade)}" onchange="atualizarQtdCarrinho(${item.id}, this.value)">
            <button onclick="removerDoCarrinho(${item.id})" style="background:none;border:none;color:#e74c3c;font-size:1.1em;cursor:pointer;"><i class='fas fa-times'></i></button>
        `;
        lista.appendChild(li);
    });
    document.getElementById('finalizar-carrinho').style.display = carrinho.length ? '' : 'none';
}

function adicionarAoCarrinho(id, produto, unidade, max) {
    let item = carrinho.find(i => i.id === id);
    if (!item) {
        carrinho.push({ id, produto, unidade, quantidade: 1, max });
    }
    renderizarCarrinho();
}

function atualizarQtdCarrinho(id, qtd) {
    const item = carrinho.find(i => i.id === id);
    if (item) {
        item.quantidade = parseInt(qtd);
    }
}

function removerDoCarrinho(id) {
    carrinho = carrinho.filter(i => i.id !== id);
    renderizarCarrinho();
}



document.getElementById('finalizar-carrinho').onclick = async function () {
    if (!carrinho.length) return;
    // Pega dados do usuário logado
    let usuario = localStorage.getItem('usuario');
    if (!usuario) {
        alert('Usuário não identificado. Faça login novamente.');
        return;
    }
    usuario = JSON.parse(usuario);
    // Agrupar por produto para mostrar total de cada um
    const resumo = {};
    carrinho.forEach(item => {
        if (!resumo[item.produto]) {
            resumo[item.produto] = { quantidade: 0, unidade: item.unidade };
        }
        resumo[item.produto].quantidade += item.quantidade;
    });
    let listaResumo = '';
    Object.entries(resumo).forEach(([produto, info]) => {
        listaResumo += `- ${produto}: ${info.quantidade} ${info.unidade}\n`;
    });
    if (!confirm(`Confirma a retirada dos produtos abaixo?\n\n${listaResumo}`)) return;
    const resp = await fetch('../backend/estoque.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retirada: carrinho, usuario_nome: usuario.nome, usuario_matricula: usuario.matricula })
    });
    const data = await resp.json();
    if (data.success && data.cupom) {
        // Exibir cupom/relatório estilizado
        let relatorio = '*** CUPOM DE RETIRADA ***\n';
        relatorio += `Funcionário: ${data.cupom.usuario_nome} (Matrícula: ${data.cupom.usuario_matricula})\n`;
        relatorio += `Data/Hora: ${data.cupom.datahora}\n`;
        relatorio += 'Produtos retirados:\n';
        data.cupom.produtos.forEach(p => {
            relatorio += `- ${p.produto}: ${p.quantidade} ${p.unidade}\n`;
        });
        relatorio += '\nObrigado!\n';
        document.getElementById('cupom-relatorio').textContent = relatorio;
        document.getElementById('painel-cupom').style.display = 'flex';
        document.getElementById('carrinho-msg').textContent = 'Retirada realizada com sucesso!';
        carrinho = [];
        renderizarCarrinho();
        carregarEstoque();
    } else {
        document.getElementById('carrinho-msg').textContent = data.error || 'Erro ao retirar.';
    }
    setTimeout(() => { document.getElementById('carrinho-msg').textContent = ''; }, 3000);
};

window.onload = carregarEstoque;
