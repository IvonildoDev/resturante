<?php
header('Content-Type: application/json');
require 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $mesa = $data['mesa'];
    $item_id = $data['item_id'];
    $quantidade = $data['quantidade'];

    // Remover a verificação de horário do backend
    // assumindo que o frontend já fez essa verificação

    $stmt = $pdo->prepare("INSERT INTO pedidos (mesa, item_id, quantidade) VALUES (?, ?, ?)");
    $stmt->execute([$mesa, $item_id, $quantidade]);
    echo json_encode(['success' => true]);
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query("SELECT p.id, p.mesa, m.nome, m.imagem, p.quantidade, p.status, p.data_hora 
                         FROM pedidos p JOIN menu m ON p.item_id = m.id 
                         WHERE p.status != 'entregue'");
    $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($pedidos);
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'];
    $status = $data['status'];

    $stmt = $pdo->prepare("UPDATE pedidos SET status = ? WHERE id = ?");
    $stmt->execute([$status, $id]);
    echo json_encode(['success' => true]);
}
