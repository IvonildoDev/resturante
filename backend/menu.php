<?php
header('Content-Type: application/json');
require 'config.php';

// Função para erro
function retornarErroMenu($mensagem, $codigo = 400)
{
    http_response_code($codigo);
    echo json_encode(['success' => false, 'error' => $mensagem]);
    exit;
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare('SELECT * FROM menu WHERE id = ?');
            $stmt->execute([$_GET['id']]);
            $item = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode($item);
        } else {
            // Se for para o cardápio do cliente, filtra por horário
            if (isset($_GET['all'])) {
                $stmt = $pdo->query('SELECT * FROM menu');
                $menu = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode($menu);
            } else {
                $horaAtual = (int)date('H');
                $periodo = ($horaAtual >= 18 || $horaAtual < 6) ? 'noite' : 'dia';
                $sql = "SELECT * FROM menu WHERE horario = 'ambos' OR horario = :periodo";
                $stmt = $pdo->prepare($sql);
                $stmt->execute(['periodo' => $periodo]);
                $menu = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode($menu);
            }
        }
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['nome'], $data['categoria'], $data['preco'])) {
            retornarErroMenu('Dados obrigatórios ausentes');
        }
        $stmt = $pdo->prepare('INSERT INTO menu (nome, categoria, preco, imagem, descricao) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([
            $data['nome'],
            $data['categoria'],
            $data['preco'],
            $data['imagem'] ?? '',
            $data['descricao'] ?? ''
        ]);
        echo json_encode(['success' => true]);
    } elseif ($method === 'PUT') {
        $id = $_GET['id'] ?? null;
        if (!$id) retornarErroMenu('ID não informado', 400);
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare('UPDATE menu SET nome=?, categoria=?, preco=?, imagem=?, descricao=? WHERE id=?');
        $stmt->execute([
            $data['nome'],
            $data['categoria'],
            $data['preco'],
            $data['imagem'] ?? '',
            $data['descricao'] ?? '',
            $id
        ]);
        echo json_encode(['success' => true]);
    } elseif ($method === 'DELETE') {
        $id = $_GET['id'] ?? null;
        if (!$id) retornarErroMenu('ID não informado', 400);
        $stmt = $pdo->prepare('DELETE FROM menu WHERE id=?');
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    } else {
        retornarErroMenu('Método não permitido', 405);
    }
} catch (PDOException $e) {
    retornarErroMenu('Erro no banco de dados: ' . $e->getMessage(), 500);
}
