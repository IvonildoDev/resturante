// Controlar visibilidade do cardápio com base no horário
function atualizarCardapio() {
    const horaAtual = new Date().getHours();
    const horarioSpan = document.getElementById('horario');
    const cardapioDia = document.getElementById('cardapio-dia');
    const cardapioNoite = document.getElementById('cardapio-noite');

    if (horaAtual >= 18 || horaAtual < 6) {
        horarioSpan.textContent = 'Noite (Pizzaria)';
        cardapioDia.classList.add('hidden');
        cardapioNoite.classList.remove('hidden');
    } else {
        horarioSpan.textContent = 'Dia (Cozinha Nordestina)';
        cardapioDia.classList.remove('hidden');
        cardapioNoite.classList.add('hidden');
    }
}

let pedidos = [];

// Atualizar o contador de itens no carrinho
function atualizarContador() {
    const contador = document.getElementById('cart-count');
    if (contador) {
        let total = 0;
        pedidos.forEach(p => total += p.quantidade);
        contador.textContent = total;
    }
}

// Função para verificar disponibilidade de um item pelo horário
function verificarDisponibilidadeHorario(categoria) {
    const horaAtual = new Date().getHours();
    const ehNoite = horaAtual >= 18 || horaAtual < 6;

    // Regras de disponibilidade
    if (categoria === 'nordestino' && ehNoite) {
        return false; // Itens nordestinos não disponíveis à noite
    }

    if (categoria === 'pizza' && !ehNoite) {
        return false; // Pizzas não disponíveis durante o dia
    }

    return true; // Bebidas e outros itens disponíveis em ambos os períodos
}

// Função para adicionar um pedido
function adicionarPedido(id, nome, preco, categoria) {
    // Código de depuração
    console.log("Tentando adicionar:", {
        id, nome, preco, categoria,
        hora: new Date().getHours(),
        ehNoite: (new Date().getHours() >= 18 || new Date().getHours() < 6),
        disponivel: verificarDisponibilidadeHorario(categoria)
    });

    // Verificar se o item está disponível no horário atual
    if (!verificarDisponibilidadeHorario(categoria)) {
        mostrarNotificacao(`${nome} não está disponível neste horário`, 'erro');
        return;
    }

    // Verificar se o item já está no carrinho
    const itemIndex = pedidos.findIndex(p => p.nome === nome);

    if (itemIndex >= 0) {
        // Se já existe, aumenta a quantidade
        pedidos[itemIndex].quantidade++;
    } else {
        // Se não existe, adiciona novo item
        pedidos.push({
            id: id,
            nome: nome,
            preco: parseFloat(preco),
            quantidade: 1,
            categoria: categoria // Armazenar a categoria para verificação posterior
        });
    }

    // Atualizar contador e mostrar o carrinho
    atualizarContador();
    mostrarCarrinho();
    toggleCarrinho(); // Mostra o carrinho ao adicionar um item

    // Efeito visual de confirmação
    mostrarNotificacao(`${nome} adicionado ao pedido!`);
}

// Melhorar a função de notificação para suportar diferentes tipos
function mostrarNotificacao(mensagem, tipo = 'sucesso') {
    // Verifica se já existe uma notificação
    let notificacao = document.querySelector('.notificacao');

    if (!notificacao) {
        // Cria uma nova notificação
        notificacao = document.createElement('div');
        notificacao.className = 'notificacao';
        document.body.appendChild(notificacao);
    }

    // Remover classes anteriores
    notificacao.classList.remove('notificacao-sucesso', 'notificacao-erro');
    // Adicionar classe apropriada
    notificacao.classList.add(`notificacao-${tipo}`);

    // Atualiza o conteúdo e exibe
    notificacao.textContent = mensagem;
    notificacao.classList.add('mostrar');

    // Remove após 2 segundos
    setTimeout(() => {
        notificacao.classList.remove('mostrar');
    }, 2000);
}

// Verificar novamente antes de enviar o pedido
async function enviarPedido() {
    if (pedidos.length === 0) {
        alert('Adicione itens ao pedido primeiro!');
        return;
    }

    // Desabilitar o botão de enviar para evitar cliques múltiplos
    const sendButton = document.querySelector('.send-order');
    if (sendButton) {
        sendButton.disabled = true;
        sendButton.textContent = 'Enviando...';
    }

    const mesa = document.getElementById('mesa').textContent;
    let todosPedidosEnviados = true;

    try {
        for (let pedido of pedidos) {
            const data = {
                mesa: parseInt(mesa),
                item_id: pedido.id,
                quantidade: pedido.quantidade
            };

            const response = await fetch('../backend/pedidos.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!result.success) {
                alert(result.error || 'Erro ao enviar pedido');
                todosPedidosEnviados = false;
                break;
            }
        }

        if (todosPedidosEnviados) {
            mostrarNotificacao('Pedido enviado com sucesso!');
            // Limpar os pedidos somente se todos foram enviados com sucesso
            pedidos = [];
            atualizarContador();
            mostrarCarrinho();

            // Se há um carrinho visível, feche-o
            const carrinhoContainer = document.getElementById('carrinho-container');
            if (carrinhoContainer && carrinhoContainer.classList.contains('mostrar')) {
                toggleCarrinho();
            }
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao comunicar com o servidor');
    } finally {
        // Reativar o botão independentemente do resultado
        if (sendButton) {
            sendButton.disabled = false;
            sendButton.textContent = 'Enviar Pedido';
        }
    }
}

// Mapeamento simples de nome para ID (deve corresponder ao banco de dados)
function mapearNomeParaId(nome) {
    const mapeamento = {
        'Baião de Dois': 1,
        'Carne de Sol com Macaxeira': 2,
        'Pizza Margherita': 3,
        'Pizza Calabresa': 4,
        'Coca-Cola': 5,
        'Suco de Caju': 6
    };
    return mapeamento[nome] || 0;
}

// Adicione esta função ao seu script.js existente
function carregarPedidosCozinha() {
    const pedidosContainer = document.getElementById('pedidos');
    if (!pedidosContainer) return;

    // Limpar conteúdo atual
    pedidosContainer.innerHTML = '';

    // Buscar pedidos do backend
    fetch('../backend/pedidos.php')
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                pedidosContainer.innerHTML = '<div class="empty-message">Não há pedidos pendentes no momento</div>';
                return;
            }

            data.forEach(pedido => {
                const card = document.createElement('div');
                card.className = 'order-card';
                card.dataset.id = pedido.id;

                // Extrair apenas a hora e minutos da data_hora
                const dataHora = new Date(pedido.data_hora);
                const hora = dataHora.getHours().toString().padStart(2, '0');
                const minutos = dataHora.getMinutes().toString().padStart(2, '0');
                const horaFormatada = `${hora}:${minutos}`;

                // Caminho da imagem, garantindo que seja relativo ou absoluto conforme necessário
                const imgSrc = pedido.imagem ? `../img/${pedido.imagem}` : '../img/placeholder.png';

                card.innerHTML = `
                    <div class="order-header">
                        <span class="mesa">Mesa ${pedido.mesa}</span>
                        <span class="time">${horaFormatada}</span>
                    </div>
                    <div class="order-body">
                        <img src="${imgSrc}" alt="${pedido.nome}" class="food-img">
                        <div class="order-details">
                            <h3>${pedido.nome}</h3>
                            <div class="quantity">Qtd: ${pedido.quantidade}</div>
                        </div>
                    </div>
                    <div class="order-footer">
                        <select class="status-select">
                            <option value="pendente" ${pedido.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                            <option value="preparando" ${pedido.status === 'preparando' ? 'selected' : ''}>Preparando</option>
                            <option value="pronto" ${pedido.status === 'pronto' ? 'selected' : ''}>Pronto</option>
                        </select>
                        <button class="update-btn">Atualizar</button>
                    </div>
                `;

                pedidosContainer.appendChild(card);

                // Adicionar evento para atualização de status
                const updateBtn = card.querySelector('.update-btn');
                updateBtn.addEventListener('click', () => {
                    const statusSelect = card.querySelector('.status-select');
                    atualizarStatusPedido(pedido.id, statusSelect.value);
                });
            });
        })
        .catch(error => {
            console.error('Erro ao carregar pedidos:', error);
            pedidosContainer.innerHTML = '<div class="error-message">Erro ao carregar pedidos. Tente novamente.</div>';
        });
}

// Função para atualizar o status de um pedido
async function atualizarStatusPedido(id, status) {
    try {
        const response = await fetch('../backend/pedidos.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, status })
        });
        const result = await response.json();

        if (result.success) {
            // Feedback visual de sucesso
            const card = document.querySelector(`.order-card[data-id="${id}"]`);
            card.classList.add('update-success');
            setTimeout(() => {
                card.classList.remove('update-success');
                // Recarregar todos os pedidos após atualizar um status
                carregarPedidosCozinha();
            }, 1000);
        } else {
            alert('Erro ao atualizar o status do pedido');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao comunicar com o servidor');
    }
}

// Função para remover item do pedido
function removerItem(index) {
    if (pedidos[index].quantidade > 1) {
        // Se houver mais de um item, apenas diminui a quantidade
        pedidos[index].quantidade--;
    } else {
        // Se só tiver um, remove o item completamente
        pedidos.splice(index, 1);
    }

    // Atualiza o contador e exibe o carrinho atualizado
    atualizarContador();
    mostrarCarrinho();

    // Notificação de item removido
    mostrarNotificacao('Item removido do pedido');
}

// Função para mostrar o carrinho/pedido atual
function mostrarCarrinho() {
    const carrinhoDiv = document.getElementById('carrinho-itens');
    if (!carrinhoDiv) return;

    carrinhoDiv.innerHTML = '';

    if (pedidos.length === 0) {
        carrinhoDiv.innerHTML = '<p class="carrinho-vazio">Seu pedido está vazio</p>';
        return;
    }

    let total = 0;

    // Cria uma lista com os itens do pedido
    pedidos.forEach((item, index) => {
        const itemTotal = item.preco * item.quantidade;
        total += itemTotal;

        const itemElement = document.createElement('div');
        itemElement.className = 'carrinho-item';
        itemElement.innerHTML = `
            <div class="item-info">
                <span class="item-nome">${item.nome}</span>
                <span class="item-qtd">x${item.quantidade}</span>
                <span class="item-preco">R$ ${itemTotal.toFixed(2)}</span>
            </div>
            <div class="item-acoes">
                <button class="btn-remover" onclick="removerItem(${index})">
                    <i class="fas fa-minus"></i>
                </button>
            </div>
        `;

        carrinhoDiv.appendChild(itemElement);
    });

    // Adiciona o total
    const totalElement = document.createElement('div');
    totalElement.className = 'carrinho-total';
    totalElement.innerHTML = `
        <span>Total:</span>
        <span>R$ ${total.toFixed(2)}</span>
    `;

    carrinhoDiv.appendChild(totalElement);

    // Adicione este trecho para debug
    console.log("Itens no carrinho:", pedidos);
}

// Função para alternar a visibilidade do carrinho
function toggleCarrinho() {
    const carrinhoContainer = document.getElementById('carrinho-container');
    if (carrinhoContainer) {
        carrinhoContainer.classList.toggle('mostrar');
        if (carrinhoContainer.classList.contains('mostrar')) {
            mostrarCarrinho();
        }
    }
}

// Verificar se estamos na página da cozinha e carregar pedidos
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('pedidos')) {
        carregarPedidosCozinha();

        // Configurar atualização automática a cada 30 segundos
        setInterval(carregarPedidosCozinha, 30000);

        // Configurar botão de atualização manual
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', carregarPedidosCozinha);
        }
    }
});

// Inicializar o cardápio
atualizarCardapio();

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function () {
    // Atualizar cardápio baseado no horário
    atualizarCardapio();

    // Adicionar event listeners para botões de pedido
    document.querySelectorAll('.order-btn').forEach(button => {
        button.addEventListener('click', function () {
            const id = parseInt(this.dataset.id);
            const nome = this.dataset.name;
            const preco = this.dataset.price;
            const categoria = this.dataset.categoria; // Obter a categoria do botão
            adicionarPedido(id, nome, preco, categoria);
        });
    });

    // Inicializar contador
    atualizarContador();

    // Inicializar carrinho
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.addEventListener('click', toggleCarrinho);
    }
});

// Dentro do seu event listener DOMContentLoaded no final do arquivo:
document.querySelectorAll('.order-btn').forEach(button => {
    button.addEventListener('click', function () {
        const id = parseInt(this.dataset.id);
        const nome = this.dataset.name;
        const preco = this.dataset.price;
        const categoria = this.dataset.categoria || "bebida"; // Valor padrão caso não esteja definido

        console.log("Clicou no botão:", { id, nome, preco, categoria });
        adicionarPedido(id, nome, preco, categoria);
    });
});

document.addEventListener('DOMContentLoaded', function () {
    // Limpar quaisquer event listeners antigos
    const sendOrderButton = document.querySelector('.send-order');
    if (sendOrderButton) {
        // Clonar e substituir o botão para remover todos os event listeners
        const newButton = sendOrderButton.cloneNode(true);
        sendOrderButton.parentNode.replaceChild(newButton, sendOrderButton);

        // Adicionar o novo event listener
        newButton.addEventListener('click', enviarPedido);
    }

    // O mesmo para botões de adicionar ao pedido
    document.querySelectorAll('.order-btn').forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        newButton.addEventListener('click', function () {
            const id = parseInt(this.dataset.id);
            const nome = this.dataset.name;
            const preco = this.dataset.price;
            const categoria = this.dataset.categoria;
            adicionarPedido(id, nome, preco, categoria);
        });
    });

    // Resto do código de inicialização
    atualizarCardapio();
    atualizarContador();
});

document.addEventListener('DOMContentLoaded', inicializarAplicacao);

function inicializarAplicacao() {
    // Todo código de inicialização aqui
}

try {
    // código...
} catch (error) {
    mostrarNotificacao('Não foi possível completar a operação', 'erro');
    console.error(error); // só para debug
}

let menuCache = {};

async function carregarMenu() {
    if (Object.keys(menuCache).length === 0) {
        const response = await fetch('../backend/menu.php');
        menuCache = await response.json();
    }
    return menuCache;
}