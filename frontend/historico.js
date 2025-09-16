// Script para carregar e filtrar o histórico de pedidos
async function carregarHistorico() {
    const mesa = document.getElementById('filtro-mesa').value;
    const status = document.getElementById('filtro-status').value;
    const data = document.getElementById('filtro-data').value;

    let url = '../backend/pedidos.php?historico=1';
    if (mesa) url += `&mesa=${mesa}`;
    if (status) url += `&status=${status}`;
    if (data) url += `&data=${data}`;

    const resp = await fetch(url);
    const pedidos = await resp.json();
    const tbody = document.querySelector('#tabela-historico tbody');
    tbody.innerHTML = '';
    if (!pedidos.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Nenhum pedido encontrado.</td></tr>';
        return;
    }
    for (const p of pedidos) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.id}</td>
            <td>${p.mesa}</td>
            <td>${p.nome}</td>
            <td>${p.quantidade}</td>
            <td>${p.status}</td>
            <td>${p.data_hora}</td>
            <td>${p.personalizacao || ''}</td>
        `;
        tbody.appendChild(tr);
    }
}

window.onload = carregarHistorico;