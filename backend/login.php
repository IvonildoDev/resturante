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

$stmt = $pdo->prepare('SELECT * FROM usuarios WHERE nome = ? AND matricula = ? AND senha = ?');
$stmt->execute([$nome, $matricula, $senha]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user) {
    // Retorna dados do usuário e função
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
