<?php
require_once __DIR__ . '/middleware.php';
$usuario = sesionUsuario();
$method = $_SERVER['REQUEST_METHOD'];

function validarPerfil(PDO $db, int $usuarioId, int $perfilId): array {
    $stmt = $db->prepare('SELECT id, nombre, edad FROM perfiles WHERE id = ? AND usuario_id = ?');
    $stmt->execute([$perfilId, $usuarioId]);
    $perfil = $stmt->fetch();
    if (!$perfil) json_error('Perfil no encontrado', 404);
    return $perfil;
}

// ── LISTAR ──
if ($method === 'GET') {
    $perfilId = (int)($_GET['perfil_id'] ?? 0);
    if (!$perfilId) json_error('perfil_id requerido');
    validarPerfil($db, $usuario['id'], $perfilId);

    $stmt = $db->prepare('SELECT id, tipo, monto, descripcion, categoria, fecha FROM movimientos WHERE perfil_id = ? ORDER BY fecha DESC');
    $stmt->execute([$perfilId]);
    $movs = $stmt->fetchAll();
    $movs = array_map(fn($m) => ['id' => (int)$m['id'], 'tipo' => $m['tipo'], 'monto' => (float)$m['monto'], 'descripcion' => $m['descripcion'], 'categoria' => $m['categoria'], 'fecha' => $m['fecha']], $movs);
    json_ok($movs);
}

// ── CREAR ──
if ($method === 'POST') {
    $data = jsonInput();
    $perfilId    = (int)($data['perfil_id'] ?? 0);
    $tipo        = $data['tipo'] ?? '';
    $monto       = $data['monto'] ?? '';
    $descripcion = trim($data['descripcion'] ?? '');
    $categoria   = trim($data['categoria'] ?? '');

    if (!$perfilId) json_error('perfil_id requerido');
    validarPerfil($db, $usuario['id'], $perfilId);
    if (!in_array($tipo, ['ingreso','gasto'])) json_error('Tipo debe ser ingreso o gasto');
    $montoNum = (float)$monto;
    if ($montoNum <= 0) json_error('Monto debe ser mayor a 0');
    if (!$descripcion) json_error('Descripción requerida');
    if (!$categoria) json_error('Categoría requerida');

    $stmt = $db->prepare('INSERT INTO movimientos (perfil_id, tipo, monto, descripcion, categoria) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$perfilId, $tipo, $montoNum, $descripcion, $categoria]);

    json_ok(['id' => (int)$db->lastInsertId()], 201);
}

json_error('Método no permitido', 405);
