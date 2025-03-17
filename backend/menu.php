<?php
header('Content-Type: application/json');
require 'config.php';

$horaAtual = (int)date('H');
$periodo = ($horaAtual >= 18 || $horaAtual < 6) ? 'noite' : 'dia';

$sql = "SELECT * FROM menu WHERE horario = 'ambos' OR horario = :periodo";
$stmt = $pdo->prepare($sql);
$stmt->execute(['periodo' => $periodo]);
$menu = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($menu);
