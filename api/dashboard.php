<?php
require_once __DIR__ . '/middleware.php';
$usuario = sesionUsuario();

$perfilId = (int)($_GET['perfil_id'] ?? 0);
if (!$perfilId) json_error('perfil_id requerido');

// Verificar que el perfil pertenece al usuario
$stmt = $db->prepare('SELECT id FROM perfiles WHERE id = ? AND usuario_id = ?');
$stmt->execute([$perfilId, $usuario['id']]);
if (!$stmt->fetch()) json_error('Perfil no encontrado', 404);

// Balance
$stmt = $db->prepare("SELECT
    COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END), 0) AS balance
    FROM movimientos WHERE perfil_id = ?");
$stmt->execute([$perfilId]);
$balance = (float)$stmt->fetchColumn();

// Últimos 5 movimientos
$stmt = $db->prepare('SELECT id, tipo, monto, descripcion, categoria, fecha FROM movimientos WHERE perfil_id = ? ORDER BY fecha DESC LIMIT 5');
$stmt->execute([$perfilId]);
$movimientos = $stmt->fetchAll();
$movimientos = array_map(fn($m) => ['id' => (int)$m['id'], 'tipo' => $m['tipo'], 'monto' => (float)$m['monto'], 'descripcion' => $m['descripcion'], 'categoria' => $m['categoria'], 'fecha' => $m['fecha']], $movimientos);

// Resumen metas (primeras 3)
$stmt = $db->prepare('SELECT id, nombre, monto_target, ahorrado, fecha_limite, categoria FROM metas WHERE perfil_id = ? ORDER BY created_at ASC LIMIT 3');
$stmt->execute([$perfilId]);
$metas = $stmt->fetchAll();
$metas = array_map(fn($m) => ['id' => (int)$m['id'], 'nombre' => $m['nombre'], 'monto_target' => (float)$m['monto_target'], 'ahorrado' => (float)$m['ahorrado'], 'fecha_limite' => $m['fecha_limite'], 'categoria' => $m['categoria']], $metas);

// Progreso global de metas
$stmt = $db->prepare('SELECT COALESCE(SUM(monto_target), 0) AS total_target, COALESCE(SUM(ahorrado), 0) AS total_ahorrado FROM metas WHERE perfil_id = ?');
$stmt->execute([$perfilId]);
$row = $stmt->fetch();
$totalMeta = (float)$row['total_target'];
$totalAhorrado = (float)$row['total_ahorrado'];
$progresoGlobal = $totalMeta > 0 ? round(($totalAhorrado / $totalMeta) * 100, 1) : 0;

json_ok([
    'balance'        => $balance,
    'movimientos'    => $movimientos,
    'metas'          => $metas,
    'progreso_global' => $progresoGlobal,
    'total_meta'     => $totalMeta,
    'total_ahorrado' => $totalAhorrado,
]);
