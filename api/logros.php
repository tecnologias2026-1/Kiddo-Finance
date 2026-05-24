<?php
require_once __DIR__ . '/middleware.php';
$usuario = sesionUsuario();

$perfilId = (int)($_GET['perfil_id'] ?? 0);
if (!$perfilId) json_error('perfil_id requerido');

$stmt = $db->prepare('SELECT id FROM perfiles WHERE id = ? AND usuario_id = ?');
$stmt->execute([$perfilId, $usuario['id']]);
if (!$stmt->fetch()) json_error('Perfil no encontrado', 404);

// Metas existentes
$stmt = $db->prepare('SELECT COUNT(*) FROM metas WHERE perfil_id = ?');
$stmt->execute([$perfilId]);
$totalMetas = (int)$stmt->fetchColumn();

$stmt = $db->prepare('SELECT COUNT(*) FROM metas WHERE perfil_id = ? AND ahorrado >= monto_target');
$stmt->execute([$perfilId]);
$metasCumplidas = (int)$stmt->fetchColumn();

// Movimientos
$stmt = $db->prepare("SELECT COUNT(*) FROM movimientos WHERE perfil_id = ? AND tipo = 'ingreso'");
$stmt->execute([$perfilId]);
$totalIngresos = (int)$stmt->fetchColumn();

$stmt = $db->prepare("SELECT COUNT(*) FROM movimientos WHERE perfil_id = ? AND tipo = 'gasto'");
$stmt->execute([$perfilId]);
$totalGastos = (int)$stmt->fetchColumn();

// Balance total
$stmt = $db->prepare("SELECT
    COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END), 0) AS balance
    FROM movimientos WHERE perfil_id = ?");
$stmt->execute([$perfilId]);
$balance = (float)$stmt->fetchColumn();

$logros = [
    'primeraMeta'        => $totalMetas > 0,
    'ahorroInicial'      => $totalIngresos > 0,
    'gastadorConsciente' => $totalGastos > 0,
    'metaCumplida'       => $metasCumplidas > 0,
    'ahorradorExperto'   => $balance >= 100000,
];

$desbloqueados = count(array_filter($logros));

json_ok([
    'logros'        => $logros,
    'desbloqueados' => $desbloqueados,
    'total_logros'  => 5,
]);
