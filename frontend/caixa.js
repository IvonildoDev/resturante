// caixa.js - Controle de Caixa

document.getElementById('form-caixa').onsubmit = async function (e) {
    e.preventDefault();
    const mesa = document.getElementById('caixa-mesa').value;
    const valor = document.getElementById('caixa-valor').value;
    const tipo = document.getElementById('caixa-tipo').value;
    await fetch('../backend/caixa.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesa, valor, tipo })
    });
    document.getElementById('form-caixa').reset();
    carregarCaixa();
};

async function carregarCaixa() {
    const resp = await fetch('../backend/caixa.php');
    const dados = await resp.json();
    const tbody = document.querySelector('#tabela-caixa tbody');
    tbody.innerHTML = '';
    dados.forEach(item => {
        // Formatar data/hora para dd/mm/aaaa hh:mm:ss
        let dataFormatada = '';
        if (item.data_hora) {
            const [data, hora] = item.data_hora.split(' ');
            if (data) {
                const [ano, mes, dia] = data.split('-');
                dataFormatada = `${dia}/${mes}/${ano}`;
                if (hora) dataFormatada += ' ' + hora;
            } else {
                dataFormatada = item.data_hora;
            }
        }
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${dataFormatada}</td>
            <td>${item.mesa}</td>
            <td>R$ ${parseFloat(item.valor).toFixed(2)}</td>
            <td>${tipoPagamentoLabel(item.tipo)}</td>
            <td><button onclick="excluirCaixa(${item.id})"><i class='fas fa-trash'></i></button></td>
        `;
        tbody.appendChild(tr);
    });
}

function tipoPagamentoLabel(tipo) {
    switch (tipo) {
        case 'dinheiro': return 'Dinheiro';
        case 'pix': return 'Pix';
        case 'debito': return 'Cartão de Débito';
        case 'credito': return 'Cartão de Crédito';
        default: return tipo;
    }
}

async function excluirCaixa(id) {
    if (!confirm('Excluir este registro do caixa?')) return;
    await fetch(`../backend/caixa.php?id=${id}`, { method: 'DELETE' });
    carregarCaixa();
}

document.addEventListener('DOMContentLoaded', carregarCaixa);
