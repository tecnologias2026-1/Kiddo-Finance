<?php
// Silenciar warnings de sesión si ya se inició
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax']);
    session_start();
}

// Local (XAMPP):  host=127.0.0.1, user=root, password=''
// Producción:     copiar datos de InfinityFree → MySQL Database
// ──────────────────────────────────────────────────────────
// ── INFINITYFREE ──────────────────────────────────────────
$db = new PDO(
    'mysql:host=sql304.infinityfree.com;dbname=if0_42010499_kiddo;charset=utf8mb4',
    'if0_42010499',
    'gnnYMYAjfVW6F',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
);
// ── LOCAL (XAMPP) ─────────────────────────────────────────
// $db = new PDO(
//     'mysql:host=127.0.0.1;dbname=kiddo_finance;charset=utf8mb4',
//     'root',
//     '',
//     [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
// );

function json($data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function json_ok($data = null): void       { json(['ok' => true,  'data' => $data]); }
function json_error(string $msg, int $status = 400): void { json(['ok' => false, 'error' => $msg], $status); }
