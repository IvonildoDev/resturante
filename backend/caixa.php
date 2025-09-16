<?php
// backend/caixa.php
header('Content-Type: application/json');
require_once '../database/config.php';



if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $mesa = $data['mesa'] ?? null;
    $valor = $data['valor'] ?? null;
    $tipo = $data['tipo'] ?? null;
    if ($mesa && $valor && $tipo) {
        $stmt = $pdo->prepare('INSERT INTO caixa (mesa, valor, tipo, data_hora) VALUES (?, ?, ?, NOW())');
        $stmt->execute([$mesa, $valor, $tipo]);
        echo json_encode(['success' => true]);
        exit;
    }
    echo json_encode(['success' => false, 'error' => 'Dados incompletos']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    parse_str($_SERVER['QUERY_STRING'], $params);
    $id = $params['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare('DELETE FROM caixa WHERE id = ?');
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
        exit;
    }
    echo json_encode(['success' => false, 'error' => 'ID não informado']);
    exit;
}

// GET: listar movimentações
$stmt = $pdo->query('SELECT * FROM caixa ORDER BY data_hora DESC');
$dados = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($dados);
