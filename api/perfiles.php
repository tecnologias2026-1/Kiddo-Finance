<?php
require_once __DIR__ . '/middleware.php';
$usuario = sesionUsuario();
$method = $_SERVER['REQUEST_METHOD'];

// ── LISTAR ──
if ($method === 'GET') {
    $stmt = $db->prepare('SELECT id, nombre, edad FROM perfiles WHERE usuario_id = ? ORDER BY created_at ASC');
    $stmt->execute([$usuario['id']]);
    $perfiles = $stmt->fetchAll();
    $perfiles = array_map(fn($p) => ['id' => (int)$p['id'], 'nombre' => $p['nombre'], 'edad' => (int)$p['edad']], $perfiles);
    json_ok($perfiles);
}

// ── CREAR ──
if ($method === 'POST') {
    $data = jsonInput();
    $nombre = trim($data['nombre'] ?? '');
    $edad   = (int)($data['edad'] ?? 0);

    if (!$nombre) json_error('Escribe el nombre del niño/a');
    if ($edad < 1 || $edad > 17) json_error('Edad debe estar entre 1 y 17');

    $stmt = $db->prepare('INSERT INTO perfiles (usuario_id, nombre, edad) VALUES (?, ?, ?)');
    $stmt->execute([$usuario['id'], $nombre, $edad]);

    json_ok(['id' => (int)$db->lastInsertId(), 'nombre' => $nombre, 'edad' => $edad], 201);
}

// ── EDITAR ──
if ($method === 'PUT') {
    $data = jsonInput();
    $id = (int)($data['id'] ?? 0);
    $nombre = trim($data['nombre'] ?? '');
    $edad   = (int)($data['edad'] ?? 0);

    if (!$id) json_error('ID requerido');
    if (!$nombre) json_error('Escribe el nombre del niño/a');
    if ($edad < 1 || $edad > 17) json_error('Edad debe estar entre 1 y 17');

    $stmt = $db->prepare('UPDATE perfiles SET nombre = ?, edad = ? WHERE id = ? AND usuario_id = ?');
    $stmt->execute([$nombre, $edad, $id, $usuario['id']]);
    if ($stmt->rowCount() === 0) json_error('Perfil no encontrado', 404);

    json_ok(['id' => $id, 'nombre' => $nombre, 'edad' => $edad]);
}

// ── ELIMINAR ──
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_error('ID requerido');

    $stmt = $db->prepare('DELETE FROM perfiles WHERE id = ? AND usuario_id = ?');
    $stmt->execute([$id, $usuario['id']]);
    if ($stmt->rowCount() === 0) json_error('Perfil no encontrado', 404);

    json_ok(['eliminado' => true]);
}

json_error('Método no permitido', 405);
