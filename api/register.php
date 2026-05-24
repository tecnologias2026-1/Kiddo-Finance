<?php
require_once __DIR__ . '/middleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Método no permitido', 405);

$data = jsonInput();
$username = trim($data['username'] ?? '');
$email    = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (strlen($username) < 3)    json_error('El usuario debe tener al menos 3 caracteres');
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_error('Email inválido');
if (strlen($password) < 4)    json_error('La contraseña debe tener al menos 4 caracteres');

$stmt = $db->prepare('SELECT id FROM usuarios WHERE username = ? OR email = ?');
$stmt->execute([$username, $email]);
if ($stmt->fetch()) json_error('El usuario o email ya existe');

$hash = password_hash($password, PASSWORD_BCRYPT);
$stmt = $db->prepare('INSERT INTO usuarios (username, email, password) VALUES (?, ?, ?)');
$stmt->execute([$username, $email, $hash]);

$_SESSION['usuario_id'] = (int)$db->lastInsertId();

json_ok(['usuario_id' => $_SESSION['usuario_id'], 'username' => $username]);
