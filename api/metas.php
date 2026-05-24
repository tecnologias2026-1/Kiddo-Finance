<?php
require_once __DIR__ . '/middleware.php';
$usuario = sesionUsuario();
$method = $_SERVER['REQUEST_METHOD'];

function validarPerfilMeta(PDO $db, int $usuarioId, int $perfilId): array {
    $stmt = $db->prepare('SELECT id, nombre FROM perfiles WHERE id = ? AND usuario_id = ?');
    $stmt->execute([$perfilId, $usuarioId]);
    $perfil = $stmt->fetch();
    if (!$perfil) json_error('Perfil no encontrado', 404);
    return $perfil;
}

// ── LISTAR ──
if ($method === 'GET') {
    $perfilId = (int)($_GET['perfil_id'] ?? 0);
    if (!$perfilId) json_error('perfil_id requerido');
    validarPerfilMeta($db, $usuario['id'], $perfilId);

    $stmt = $db->prepare('SELECT id, nombre, monto_target, ahorrado, fecha_limite, categoria FROM metas WHERE perfil_id = ? ORDER BY created_at ASC');
    $stmt->execute([$perfilId]);
    $metas = $stmt->fetchAll();
    $metas = array_map(fn($m) => ['id' => (int)$m['id'], 'nombre' => $m['nombre'], 'monto_target' => (float)$m['monto_target'], 'ahorrado' => (float)$m['ahorrado'], 'fecha_limite' => $m['fecha_limite'], 'categoria' => $m['categoria']], $metas);
    json_ok($metas);
}

// ── CREAR ──
if ($method === 'POST') {
    $data = jsonInput();
    $perfilId = (int)($data['perfil_id'] ?? 0);
    $nombre   = trim($data['nombre'] ?? '');
    $monto    = (float)($data['monto'] ?? 0);
    $fecha    = $data['fecha'] ?? '';
    $categoria = trim($data['categoria'] ?? '');

    if (!$perfilId) json_error('perfil_id requerido');
    validarPerfilMeta($db, $usuario['id'], $perfilId);
    if (!$nombre) json_error('Nombre de meta requerido');
    if ($monto <= 0) json_error('Monto debe ser mayor a 0');
    if (!$fecha) json_error('Fecha límite requerida');
    if ($fecha < date('Y-m-d')) json_error('La fecha no puede ser en el pasado');
    if (!$categoria) json_error('Categoría requerida');

    $stmt = $db->prepare('INSERT INTO metas (perfil_id, nombre, monto_target, fecha_limite, categoria) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$perfilId, $nombre, $monto, $fecha, $categoria]);

    json_ok(['id' => (int)$db->lastInsertId()], 201);
}

// ── ACTUALIZAR PROGRESO ──
if ($method === 'PUT') {
    $data = jsonInput();
    $id     = (int)($data['id'] ?? 0);
    $ahorrado = (float)($data['ahorrado'] ?? 0);

    if (!$id) json_error('ID requerido');

    // Verificar que la meta pertenece a un perfil del usuario
    $stmt = $db->prepare('SELECT m.id, m.monto_target, p.usuario_id FROM metas m JOIN perfiles p ON m.perfil_id = p.id WHERE m.id = ?');
    $stmt->execute([$id]);
    $meta = $stmt->fetch();
    if (!$meta || $meta['usuario_id'] !== $usuario['id']) json_error('Meta no encontrada', 404);
    if ($ahorrado < 0) json_error('Valor no puede ser negativo');

    $ahorrado = min($ahorrado, (float)$meta['monto_target']);
    $stmt = $db->prepare('UPDATE metas SET ahorrado = ? WHERE id = ?');
    $stmt->execute([$ahorrado, $id]);

    json_ok(['id' => $id, 'ahorrado' => $ahorrado]);
}

// ── ELIMINAR ──
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_error('ID requerido');

    $stmt = $db->prepare('SELECT m.id, p.usuario_id FROM metas m JOIN perfiles p ON m.perfil_id = p.id WHERE m.id = ?');
    $stmt->execute([$id]);
    $meta = $stmt->fetch();
    if (!$meta || $meta['usuario_id'] !== $usuario['id']) json_error('Meta no encontrada', 404);

    $stmt = $db->prepare('DELETE FROM metas WHERE id = ?');
    $stmt->execute([$id]);
    json_ok(['eliminado' => true]);
}

json_error('Método no permitido', 405);
