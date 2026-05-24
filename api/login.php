<?php
require_once __DIR__ . '/middleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Método no permitido', 405);

$data = jsonInput();
$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';

if (!$username || !$password) json_error('Completa todos los campos');

$stmt = $db->prepare('SELECT id, username, email, password FROM usuarios WHERE username = ? OR email = ?');
$stmt->execute([$username, $username]);
$usuario = $stmt->fetch();

if (!$usuario || !password_verify($password, $usuario['password'])) {
    json_error('Usuario o contraseña incorrectos', 401);
}

$_SESSION['usuario_id'] = (int)$usuario['id'];

json_ok(['usuario_id' => $usuario['id'], 'username' => $usuario['username']]);
