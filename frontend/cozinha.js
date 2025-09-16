// Configurações globais
const CONFIG = {
    apiUrl: '../backend/pedidos.php',
    refreshInterval: 60000, // Atualizar a cada 1 minuto
    statusInfo: {
        pendente: {
            next: 'preparando',
            action: 'Iniciar Preparo',
            btnClass: 'btn-preparando',
            icon: 'fire'
        },
        preparando: {
            next: 'pronto',
            action: 'Marcar como Pronto',
            btnClass: 'btn-pronto',
            icon: 'check-circle'
        },
        pronto: {
            next: 'entregue',
            action: 'Entregar',
            btnClass: 'btn-entregue',
            icon: 'utensils'
        }
    }
};

// Inicialização principal
document.addEventListener('DOMContentLoaded', function () {
    // Carregar pedidos iniciais
    carregarPedidos();

    // Configurar atualização automática
    let refreshInterval = setInterval(carregarPedidos, CONFIG.refreshInterval);

    // Configurar botão de atualização manual
    document.getElementById('refresh-btn').addEventListener('click', function () {
        // Limpar o intervalo existente para evitar sobreposição
        clearInterval(refreshInterval);

        // Carregar pedidos imediatamente
        carregarPedidos();

        // Reiniciar o intervalo após a atualização manual
        refreshInterval = setInterval(carregarPedidos, CONFIG.refreshInterval);
    });
});

// Função para carregar pedidos do servidor com indicador visual
async function carregarPedidos() {
    // Mostrar indicador de atualização
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Atualizando...';
        refreshBtn.disabled = true;
    }

    try {
        const response = await fetch(CONFIG.apiUrl);
        const pedidos = await response.json();

        // Limpar listas existentes
        document.getElementById('pendente-list').innerHTML = '';
        document.getElementById('preparando-list').innerHTML = '';
        document.getElementById('pronto-list').innerHTML = '';

        // Contadores para cada status
        let contagemStatus = {
            pendente: 0,
            preparando: 0,
            pronto: 0
        };

        // Se não houver pedidos, mostrar mensagens vazias
        if (pedidos.length === 0) {
            document.getElementById('pendente-list').innerHTML = '<div class="empty-message">Não há pedidos pendentes</div>';
            document.getElementById('preparando-list').innerHTML = '<div class="empty-message">Não há pedidos em preparo</div>';
            document.getElementById('pronto-list').innerHTML = '<div class="empty-message">Não há pedidos prontos</div>';
        } else {
            // Processar e mostrar os pedidos
            pedidos.forEach(pedido => {
                const statusAtual = pedido.status;

                // Incrementar contador do status
                if (contagemStatus.hasOwnProperty(statusAtual)) {
                    contagemStatus[statusAtual]++;
                }

                // Criar e adicionar o card do pedido na lista apropriada
                const pedidoCard = criarCardPedido(pedido);
                const listId = `${statusAtual}-list`;
                document.getElementById(listId).appendChild(pedidoCard);
            });
        }

        // Atualizar contadores
        document.getElementById('pendente-count').textContent = contagemStatus.pendente;
        document.getElementById('preparando-count').textContent = contagemStatus.preparando;
        document.getElementById('pronto-count').textContent = contagemStatus.pronto;

        // Atualizar a hora da última atualização
        const agora = new Date();
        const horaFormatada = agora.getHours().toString().padStart(2, '0');
        const minutosFormatados = agora.getMinutes().toString().padStart(2, '0');
        const segundosFormatados = agora.getSeconds().toString().padStart(2, '0');

        if (document.getElementById('ultima-atualizacao')) {
            document.getElementById('ultima-atualizacao').textContent =
                `${horaFormatada}:${minutosFormatados}:${segundosFormatados}`;
        }

    } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
        mostrarNotificacao('Erro ao carregar pedidos. Verifique sua conexão.', 'error');
    } finally {
        // Restaurar o botão de atualização
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Atualizar';
            refreshBtn.disabled = false;
        }

        // Reiniciar a animação de progresso
        const progressBar = document.querySelector('.refresh-progress');
        if (progressBar) {
            progressBar.style.animation = 'none';
            progressBar.offsetHeight; // Trigger reflow
            progressBar.style.animation = 'progressAnimation 60s linear infinite';
        }
    }
}

// Função para criar um card de pedido
function criarCardPedido(pedido) {
    const pedidoCard = document.createElement('div');
    pedidoCard.className = 'pedido-card';
    pedidoCard.setAttribute('data-id', pedido.id);

    // Formatar o horário
    const dataHora = new Date(pedido.data_hora);
    const horaFormatada = dataHora.getHours().toString().padStart(2, '0');
    const minutosFormatados = dataHora.getMinutes().toString().padStart(2, '0');
    const tempoFormatado = `${horaFormatada}:${minutosFormatados}`;

    // Verificar se há personalizações
    let personalizacaoHTML = '';
    if (pedido.personalizacao && pedido.personalizacao.trim() !== '') {
        personalizacaoHTML = `
            <div class="pedido-personalizacao">
                <div class="personalizacao-titulo">
                    <i class="fas fa-sliders-h"></i> Personalizações:
                </div>
                <div class="personalizacao-detalhes">
                    ${pedido.personalizacao}
                </div>
            </div>
        `;
    }

    // Obter informações do próximo status
    const statusInfo = CONFIG.statusInfo[pedido.status];

    pedidoCard.innerHTML = `
        <div class="pedido-header">
            <span class="mesa-badge">Mesa ${pedido.mesa}</span>
            <span class="tempo">${tempoFormatado}</span>
        </div>
        <div class="pedido-content">
            <div class="pedido-detalhes">
                <h3>${pedido.nome}</h3>
                <div class="pedido-quantidade">Quantidade: ${pedido.quantidade}</div>
                ${personalizacaoHTML}
            </div>
        </div>
        <div class="pedido-acoes">
            <button class="btn-status ${statusInfo.btnClass}" data-next-status="${statusInfo.next}">
                <i class="fas fa-${statusInfo.icon}"></i> ${statusInfo.action}
            </button>
        </div>
    `;

    // Adicionar event listener para o botão de alteração de status
    const btnStatus = pedidoCard.querySelector('.btn-status');
    btnStatus.addEventListener('click', () => {
        // Se for status pendente (iniciar preparo), imprime comanda antes de atualizar
        if (pedido.status === 'pendente') {
            imprimirComanda(pedido);
        }
        atualizarStatusPedido(pedido.id, btnStatus.dataset.nextStatus, pedidoCard);
    });

    return pedidoCard;
}

// Função para imprimir a comanda do pedido
function imprimirComanda(pedido) {
    const dataHora = new Date(pedido.data_hora);
    const dataFormatada = dataHora.toLocaleDateString();
    const horaFormatada = dataHora.toLocaleTimeString();
    const win = window.open('', '', 'width=400,height=600');
    win.document.write(`
        <html>
        <head>
            <title>Comanda do Pedido</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 24px; }
                h2 { text-align: center; margin-bottom: 18px; }
                .comanda-info { margin-bottom: 10px; font-size: 1.1em; }
                .comanda-label { font-weight: bold; }
                .comanda-personalizacao { margin-top: 10px; }
                .comanda-footer { margin-top: 30px; text-align: center; font-size: 0.95em; color: #888; }
            </style>
        </head>
        <body>
            <h2>Comanda de Pedido</h2>
            <div class="comanda-info"><span class="comanda-label">Mesa:</span> ${pedido.mesa}</div>
            <div class="comanda-info"><span class="comanda-label">Item:</span> ${pedido.nome}</div>
            <div class="comanda-info"><span class="comanda-label">Quantidade:</span> ${pedido.quantidade}</div>
            <div class="comanda-info"><span class="comanda-label">Status:</span> ${pedido.status}</div>
            <div class="comanda-info"><span class="comanda-label">Data/Hora:</span> ${dataFormatada} ${horaFormatada}</div>
            ${pedido.personalizacao && pedido.personalizacao.trim() !== '' ? `<div class="comanda-personalizacao"><span class="comanda-label">Personalização:</span> ${pedido.personalizacao}</div>` : ''}
            <div class="comanda-footer">Restaurante - ${new Date().getFullYear()}</div>
        </body>
        </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    setTimeout(() => win.close(), 1000);
}

// Função para atualizar o status de um pedido
async function atualizarStatusPedido(id, novoStatus, element) {
    try {
        // Desabilitar o botão para evitar cliques duplicados
        const button = element.querySelector('.btn-status');
        button.disabled = true;
        button.style.opacity = '0.7';
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Atualizando...';

        // Enviar requisição para atualizar o status
        const response = await fetch(CONFIG.apiUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, status: novoStatus })
        });

        const result = await response.json();

        if (result.success) {
            // Notificar sucesso
            mostrarNotificacao(`Pedido atualizado para: ${novoStatus}`);

            // Adicionar efeito visual de sucesso
            element.classList.add('update-success');

            // Remover o card após breve animação
            setTimeout(() => {
                element.style.opacity = '0';
                element.style.transform = 'translateX(50px)';
                element.style.height = '0';

                setTimeout(() => {
                    if (element.parentNode) {
                        element.parentNode.removeChild(element);
                    }

                    // Recarregar todos os pedidos
                    carregarPedidos();
                }, 300);
            }, 500);
        } else {
            // Se falhou, mostrar erro e reabilitar o botão
            mostrarNotificacao('Erro ao atualizar status. Tente novamente.', 'error');
            button.disabled = false;
            button.style.opacity = '1';

            // Restaurar o botão para o estado original
            const statusInfo = CONFIG.statusInfo[novoStatus === 'entregue' ? 'pronto' : novoStatus];
            button.innerHTML = `<i class="fas fa-${statusInfo.icon}"></i> ${statusInfo.action}`;
        }
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        mostrarNotificacao('Falha na comunicação com o servidor.', 'error');

        // Reabilitar o botão em caso de erro
        const button = element.querySelector('.btn-status');
        button.disabled = false;
        button.style.opacity = '1';

        // Determinar qual era o status anterior
        const currentStatus = button.dataset.nextStatus === 'preparando' ? 'pendente' :
            (button.dataset.nextStatus === 'pronto' ? 'preparando' : 'pronto');
        const statusInfo = CONFIG.statusInfo[currentStatus];
        button.innerHTML = `<i class="fas fa-${statusInfo.icon}"></i> ${statusInfo.action}`;
    }
}

// Função para mostrar notificações
function mostrarNotificacao(mensagem, tipo = 'success') {
    const notificacaoArea = document.getElementById('notification-area');

    const notificacao = document.createElement('div');
    notificacao.className = `kitchen-notification ${tipo}`;
    notificacao.textContent = mensagem;

    notificacaoArea.appendChild(notificacao);

    // Remover a notificação após 3 segundos
    setTimeout(() => {
        notificacao.style.opacity = '0';
        setTimeout(() => {
            if (notificacao.parentNode) {
                notificacao.parentNode.removeChild(notificacao);
            }
        }, 300);
    }, 3000);
}