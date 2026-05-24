<?php
require_once __DIR__ . '/config.php';

function sesionUsuario(): array {
    global $db;

    if (empty($_SESSION['usuario_id'])) {
        json_error('No has iniciado sesión', 401);
    }

    $stmt = $db->prepare('SELECT id, username, email FROM usuarios WHERE id = ?');
    $stmt->execute([$_SESSION['usuario_id']]);
    $usuario = $stmt->fetch();

    if (!$usuario) {
        session_destroy();
        json_error('Sesión inválida', 401);
    }

    return $usuario;
}

function jsonInput(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
        json_error('JSON inválido');
    }
    return $data ?? [];
}
