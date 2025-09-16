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

document.addEventListener('DOMContentLoaded', () => {
    carregarCaixa();
    carregarComandasAbertas();
});

async function carregarComandasAbertas() {
    console.log('Executando carregarComandasAbertas...');
    const painel = document.getElementById('comandas-abertas');
    painel.innerHTML = '<h2>Comandas Abertas</h2>';
    try {
        const resp = await fetch('../backend/pedidos.php?comandas_abertas=1');
        const comandas = await resp.json();
        console.log('Comandas abertas:', comandas);
        if (!comandas || Object.keys(comandas).length === 0) {
            painel.innerHTML += '<p>Nenhuma comanda aberta no momento.</p>';
            return;
        }
        Object.entries(comandas).forEach(([mesa, pedidos]) => {
            let total = 0;
            let html = `<div class='comanda-mesa' style='background:#fffbe6;border:1px solid #e1c97a;margin-bottom:18px;padding:12px 18px;border-radius:8px;'>`;
            html += `<h3 style='margin-top:0;'>Mesa ${mesa}</h3><ul style='margin-bottom:8px;'>`;
            pedidos.forEach(p => {
                const subtotal = parseFloat(p.preco) * parseInt(p.quantidade);
                total += subtotal;
                html += `<li>${p.nome} ${p.personalizacao ? '(' + p.personalizacao + ')' : ''} - ${p.quantidade} x R$ ${parseFloat(p.preco).toFixed(2)} = <b>R$ ${subtotal.toFixed(2)}</b></li>`;
            });
            html += `</ul><div class='comanda-total'>Total: <b>R$ ${total.toFixed(2)}</b></div>`;
            html += `<button class='btn-finalizar' onclick='finalizarComanda(${mesa})'>Finalizar Conta</button></div>`;
            painel.innerHTML += html;
        });
    } catch (e) {
        console.error('Erro ao carregar comandas abertas:', e);
        painel.innerHTML += '<p style="color:red">Erro ao buscar comandas abertas.</p>';
    }
}


// Variável global para armazenar dados da última comanda finalizada
let ultimaComanda = null;

async function finalizarComanda(mesa) {
    // Buscar dados da comanda para preencher o recibo
    const resp = await fetch('../backend/pedidos.php?comandas_abertas=1');
    const comandas = await resp.json();
    const pedidos = comandas[mesa];
    if (!pedidos) return;
    let total = 0;
    let recibo = `Recibo - Mesa ${mesa}\n-----------------------------\n`;
    pedidos.forEach(p => {
        const subtotal = parseFloat(p.preco) * parseInt(p.quantidade);
        total += subtotal;
        recibo += `${p.nome} ${p.personalizacao ? '(' + p.personalizacao + ')' : ''} - ${p.quantidade} x R$ ${parseFloat(p.preco).toFixed(2)} = R$ ${subtotal.toFixed(2)}\n`;
    });
    recibo += `-----------------------------\nTotal: R$ ${total.toFixed(2)}\n`;
    // Preencher campos do formulário
    document.getElementById('caixa-mesa').value = mesa;
    document.getElementById('caixa-valor').value = total.toFixed(2);
    // Salvar para impressão posterior
    ultimaComanda = { mesa, total, recibo, pedidos };
    // Mostrar botão de registrar pagamento e imprimir recibo
    mostrarBotaoPagamento();
}

function mostrarBotaoPagamento() {
    let btn = document.getElementById('btn-registrar-pagamento');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'btn-registrar-pagamento';
        btn.className = 'btn-add';
        btn.innerHTML = "<i class='fas fa-cash-register'></i> Registrar Pagamento e Imprimir Recibo";
        btn.type = 'button';
        btn.onclick = registrarPagamentoEImprimir;
        document.getElementById('form-caixa').appendChild(btn);
    }
    btn.style.display = 'inline-block';
}

async function registrarPagamentoEImprimir() {
    const mesa = document.getElementById('caixa-mesa').value;
    const valor = document.getElementById('caixa-valor').value;
    const tipo = document.getElementById('caixa-tipo').value;
    if (!mesa || !valor || !tipo) {
        alert('Preencha todos os campos para registrar o pagamento!');
        return;
    }
    // Registrar pagamento no backend caixa.php
    await fetch('../backend/caixa.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesa, valor, tipo })
    });
    // Marcar pedidos como pagos
    await fetch('../backend/pedidos.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagar_mesa: mesa })
    });
    // Imprimir recibo
    imprimirRecibo(tipo);
    // Limpar campos e atualizar listas
    document.getElementById('form-caixa').reset();
    document.getElementById('btn-registrar-pagamento').style.display = 'none';
    carregarComandasAbertas();
    carregarCaixa();
}

function imprimirRecibo(tipoPagamento) {
    try {
        if (!ultimaComanda || !ultimaComanda.pedidos) return;
        let itens = '';
        ultimaComanda.pedidos.forEach(p => {
            const subtotal = parseFloat(p.preco) * parseInt(p.quantidade);
            itens += `<tr><td style='padding:4px 0;'>${p.nome} ${p.personalizacao ? '(' + p.personalizacao + ')' : ''}</td><td style='text-align:center;'>${p.quantidade}</td><td style='text-align:right;'>R$ ${parseFloat(p.preco).toFixed(2)}</td><td style='text-align:right;'>R$ ${subtotal.toFixed(2)}</td></tr>`;
        });
        const total = ultimaComanda.total.toFixed(2);
        const forma = tipoPagamentoLabel(tipoPagamento);
        const avistaOuParcelado = tipoPagamento === 'credito' ? 'Parcelado' : 'À vista';
        const data = new Date();
        const dataStr = data.toLocaleDateString() + ' ' + data.toLocaleTimeString();
        const html = `
        <div style='font-family:monospace;max-width:340px;margin:0 auto;padding:18px;'>
            <div style='text-align:center;font-size:1.25em;font-weight:bold;margin-bottom:8px;'>Restaurante</div>
            <div style='text-align:center;font-size:1em;margin-bottom:8px;'>Recibo de Consumo</div>
            <div style='font-size:0.98em;margin-bottom:8px;'>Mesa: <b>${ultimaComanda.mesa}</b><br>Data: ${dataStr}</div>
            <table style='width:100%;border-collapse:collapse;font-size:0.98em;margin-bottom:10px;'>
                <thead><tr><th style='text-align:left;'>Item</th><th>Qtd</th><th>Unit.</th><th>Total</th></tr></thead>
                <tbody>${itens}</tbody>
            </table>
            <div style='border-top:1px dashed #888;margin:10px 0;'></div>
            <div style='font-size:1.1em;text-align:right;margin-bottom:6px;'><b>Total: R$ ${total}</b></div>
            <div style='font-size:1em;margin-bottom:4px;'>Forma de Pagamento: <b>${forma}</b></div>
            <div style='font-size:1em;margin-bottom:10px;'>Pagamento: <b>${avistaOuParcelado}</b></div>
            <div style='text-align:center;font-size:0.95em;color:#888;margin-top:12px;'>Obrigado pela preferência!</div>
        </div>
        <style>@media print { body { background: #fff; } }</style>
        `;
        const win = window.open('', '', 'width=400,height=600');
        win.document.write(html);
        win.print();
        setTimeout(() => win.close(), 1000);
    } catch (e) {
        alert('Erro ao gerar recibo: ' + e.message);
        console.error('Erro ao imprimir recibo:', e);
    }
}
