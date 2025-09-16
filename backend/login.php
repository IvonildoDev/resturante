<?php
header('Content-Type: application/json');
require 'config.php';

// Recebe nome e matrícula
$data = json_decode(file_get_contents('php://input'), true);
$nome = $data['nome'] ?? '';
$matricula = $data['matricula'] ?? '';
$senha = $data['senha'] ?? '';

if (!$nome || !$matricula || !$senha) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Dados obrigatórios ausentes']);
    exit;
}



$stmt = $pdo->prepare('SELECT id, nome, matricula, funcao FROM usuarios WHERE nome COLLATE utf8mb4_general_ci = ? AND matricula = ? AND senha = ?');
$stmt->execute([$nome, $matricula, $senha]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user) {
    echo json_encode([
        'success' => true,
        'usuario' => [
            'id' => $user['id'],
            'nome' => $user['nome'],
            'matricula' => $user['matricula'],
            'funcao' => $user['funcao']
        ]
    ]);
} else {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Usuário ou senha inválidos']);
}
