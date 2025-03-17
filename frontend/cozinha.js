// Configurações globais
const CONFIG = {
    apiUrl: '../backend/pedidos.php',
    refreshInterval: 30000, // Atualizar a cada 30 segundos
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
    setInterval(carregarPedidos, CONFIG.refreshInterval);

    // Configurar botão de atualização manual
    document.getElementById('refresh-btn').addEventListener('click', carregarPedidos);
});

// Função para carregar pedidos do servidor
async function carregarPedidos() {
    try {
        const response = await fetch(CONFIG.apiUrl);
        const pedidos = await response.json();

        // Log para verificar os dados recebidos
        console.log("Pedidos recebidos do servidor:", pedidos);

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

    } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
        mostrarNotificacao('Erro ao carregar pedidos. Verifique sua conexão.', 'error');
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
            <span class="mesa">Mesa ${pedido.mesa}</span>
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
        atualizarStatusPedido(pedido.id, btnStatus.dataset.nextStatus, pedidoCard);
    });

    return pedidoCard;
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