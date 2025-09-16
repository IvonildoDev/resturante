<?php
header('Content-Type: application/json');
require 'config.php';

function retornarErroEstoque($mensagem, $codigo = 400)
{
    http_response_code($codigo);
    echo json_encode(['success' => false, 'error' => $mensagem]);
    exit;
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare('SELECT * FROM estoque WHERE id = ?');
            $stmt->execute([$_GET['id']]);
            $item = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode($item);
        } else {
            $stmt = $pdo->query('SELECT * FROM estoque ORDER BY validade ASC');
            $estoque = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($estoque);
        }
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['produto'], $data['validade'], $data['quantidade'], $data['unidade'])) {
            retornarErroEstoque('Dados obrigatórios ausentes');
        }
        $stmt = $pdo->prepare('INSERT INTO estoque (produto, validade, quantidade, unidade) VALUES (?, ?, ?, ?)');
        $stmt->execute([
            $data['produto'],
            $data['validade'],
            $data['quantidade'],
            $data['unidade']
        ]);
        echo json_encode(['success' => true]);
    } elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        // Se for retirada em lote (carrinho)
        if (isset($data['retirada']) && is_array($data['retirada'])) {
            // Receber dados do usuário
            $usuario_nome = $data['usuario_nome'] ?? '';
            $usuario_matricula = $data['usuario_matricula'] ?? '';
            $produtosCupom = [];
            $pdo->beginTransaction();
            try {
                foreach ($data['retirada'] as $item) {
                    if (!isset($item['id'], $item['quantidade'])) {
                        $pdo->rollBack();
                        retornarErroEstoque('Dados de retirada inválidos', 400);
                    }
                    // Buscar dados do produto
                    $stmt = $pdo->prepare('SELECT produto, unidade, quantidade FROM estoque WHERE id = ?');
                    $stmt->execute([$item['id']]);
                    $row = $stmt->fetch(PDO::FETCH_ASSOC);
                    if (!$row) {
                        $pdo->rollBack();
                        retornarErroEstoque('Produto não encontrado', 404);
                    }
                    $novaQtd = $row['quantidade'] - $item['quantidade'];
                    if ($novaQtd < 0) {
                        $pdo->rollBack();
                        retornarErroEstoque('Quantidade insuficiente para o produto ID ' . $item['id'], 400);
                    }
                    $stmt = $pdo->prepare('UPDATE estoque SET quantidade = ? WHERE id = ?');
                    $stmt->execute([$novaQtd, $item['id']]);
                    // Adicionar ao cupom
                    $produtosCupom[] = [
                        'produto' => $row['produto'],
                        'quantidade' => $item['quantidade'],
                        'unidade' => $row['unidade']
                    ];
                }
                // Registrar retirada
                // Ajustar timezone para America/Sao_Paulo
                date_default_timezone_set('America/Sao_Paulo');
                $agora = date('Y-m-d H:i:s');
                $stmt = $pdo->prepare('INSERT INTO retiradas (usuario_nome, usuario_matricula, datahora, produtos) VALUES (?, ?, ?, ?)');
                $stmt->execute([
                    $usuario_nome,
                    $usuario_matricula,
                    $agora,
                    json_encode($produtosCupom)
                ]);
                $pdo->commit();
                echo json_encode([
                    'success' => true,
                    'cupom' => [
                        'usuario_nome' => $usuario_nome,
                        'usuario_matricula' => $usuario_matricula,
                        'datahora' => date('d/m/Y H:i'),
                        'produtos' => $produtosCupom
                    ]
                ]);
            } catch (Exception $e) {
                $pdo->rollBack();
                retornarErroEstoque('Erro ao processar retirada: ' . $e->getMessage(), 500);
            }
        } else {
            // Atualização normal de um item
            $id = $_GET['id'] ?? null;
            if (!$id) retornarErroEstoque('ID não informado', 400);
            $stmt = $pdo->prepare('UPDATE estoque SET produto=?, validade=?, quantidade=?, unidade=? WHERE id=?');
            $stmt->execute([
                $data['produto'],
                $data['validade'],
                $data['quantidade'],
                $data['unidade'],
                $id
            ]);
            echo json_encode(['success' => true]);
        }
    } elseif ($method === 'DELETE') {
        $id = $_GET['id'] ?? null;
        if (!$id) retornarErroEstoque('ID não informado', 400);
        $stmt = $pdo->prepare('DELETE FROM estoque WHERE id=?');
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    } else {
        retornarErroEstoque('Método não permitido', 405);
    }
} catch (PDOException $e) {
    retornarErroEstoque('Erro no banco de dados: ' . $e->getMessage(), 500);
}
