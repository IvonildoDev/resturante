<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');
require 'config.php';

// Função para retornar erro em formato JSON
function retornarErro($mensagem, $codigo = 400)
{
    http_response_code($codigo);
    echo json_encode(['success' => false, 'error' => $mensagem]);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);

        // Validar dados recebidos
        if (!isset($data['mesa']) || !isset($data['item_id']) || !isset($data['quantidade'])) {
            retornarErro('Dados incompletos para o pedido');
        }

        $mesa = (int)$data['mesa'];
        $item_id = (int)$data['item_id'];
        $quantidade = (int)$data['quantidade'];

        // Validações básicas
        if ($mesa <= 0 || $item_id <= 0 || $quantidade <= 0) {
            retornarErro('Valores inválidos para o pedido');
        }

        // Adicionar personalização (se fornecida)
        $personalizacao = isset($data['personalizacao']) ? $data['personalizacao'] : '';

        // Verificar se o item existe no menu
        $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM menu WHERE id = ?");
        $checkStmt->execute([$item_id]);
        if ($checkStmt->fetchColumn() == 0) {
            retornarErro('Item não encontrado no menu');
        }

        $stmt = $pdo->prepare("INSERT INTO pedidos (mesa, item_id, quantidade, personalizacao) VALUES (?, ?, ?, ?)");
        $success = $stmt->execute([$mesa, $item_id, $quantidade, $personalizacao]);

        if ($success) {
            echo json_encode(['success' => true, 'message' => 'Pedido registrado com sucesso']);
        } else {
            retornarErro('Falha ao registrar o pedido', 500);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Comandas abertas para o caixa: ?comandas_abertas=1
        if (isset($_GET['comandas_abertas'])) {
            $sql = "SELECT p.mesa, m.nome, m.preco, p.quantidade, p.personalizacao, p.data_hora, p.id
                    FROM pedidos p
                    JOIN menu m ON p.item_id = m.id
                    WHERE p.status = 'entregue' AND p.pago = 0
                    ORDER BY p.mesa, p.data_hora, p.id";
            $stmt = $pdo->query($sql);
            $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            // Agrupar por mesa
            $comandas = [];
            foreach ($pedidos as $pedido) {
                $mesa = $pedido['mesa'];
                if (!isset($comandas[$mesa])) $comandas[$mesa] = [];
                $comandas[$mesa][] = $pedido;
            }
            echo json_encode($comandas);
            exit;
        }
        // Histórico completo se passado ?historico=1
        if (isset($_GET['historico'])) {
            $where = [];
            $params = [];
            if (!empty($_GET['mesa'])) {
                $where[] = 'p.mesa = ?';
                $params[] = (int)$_GET['mesa'];
            }
            if (!empty($_GET['status'])) {
                $where[] = 'p.status = ?';
                $params[] = $_GET['status'];
            }
            if (!empty($_GET['data'])) {
                $where[] = 'DATE(p.data_hora) = ?';
                $params[] = $_GET['data'];
            }
            $sql = "SELECT p.id, p.mesa, m.nome, m.imagem, p.quantidade, p.status, p.data_hora, p.personalizacao  FROM pedidos p JOIN menu m ON p.item_id = m.id";
            if ($where) {
                $sql .= ' WHERE ' . implode(' AND ', $where);
            }
            $sql .= ' ORDER BY p.data_hora DESC';
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
        } else {
            // Padrão: só pedidos não entregues
            $stmt = $pdo->query("SELECT p.id, p.mesa, m.nome, m.imagem, p.quantidade, p.status, p.data_hora, p.personalizacao  FROM pedidos p JOIN menu m ON p.item_id = m.id WHERE p.status != 'entregue' ORDER BY p.data_hora DESC");
        }
        if ($stmt === false) {
            retornarErro('Erro ao buscar pedidos', 500);
        }
        $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($pedidos);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);

        // Marcar todos os pedidos de uma mesa como pagos
        if (isset($data['pagar_mesa'])) {
            $mesa = (int)$data['pagar_mesa'];
            $stmt = $pdo->prepare("UPDATE pedidos SET pago = 1 WHERE mesa = ? AND status = 'entregue' AND pago = 0");
            $stmt->execute([$mesa]);
            echo json_encode(['success' => true, 'message' => 'Comanda da mesa finalizada']);
            exit;
        }

        if (!isset($data['id']) || !isset($data['status'])) {
            retornarErro('Dados incompletos para atualização');
        }

        $id = (int)$data['id'];
        $status = $data['status'];

        // Validar status permitidos
        $statusPermitidos = ['pendente', 'preparando', 'pronto', 'entregue'];
        if (!in_array($status, $statusPermitidos)) {
            retornarErro('Status inválido');
        }

        $stmt = $pdo->prepare("UPDATE pedidos SET status = ? WHERE id = ?");
        $success = $stmt->execute([$status, $id]);

        if ($success && $stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Status atualizado com sucesso']);
        } elseif ($success) {
            retornarErro('Pedido não encontrado', 404);
        } else {
            retornarErro('Falha ao atualizar status', 500);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        // Excluir pedido por id
        if (!isset($_GET['id'])) {
            retornarErro('ID do pedido não informado', 400);
        }
        $id = (int)$_GET['id'];
        $stmt = $pdo->prepare('DELETE FROM pedidos WHERE id = ?');
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    } else {
        // Método não suportado
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Método não permitido']);
    }
} catch (PDOException $e) {
    // Log do erro (em ambiente de produção, não expor detalhes do erro)
    error_log('Database error: ' . $e->getMessage());
    retornarErro('Erro no banco de dados', 500);
} catch (Exception $e) {
    error_log('Server error: ' . $e->getMessage());
    retornarErro('Erro no servidor', 500);
}
