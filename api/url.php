<?php
// ── CAMBIAR AL DESPLEGAR ──────────────────────────────────
// Local (XAMPP):  '/kiddo-finance/api'
// Producción:     '/api'
// ──────────────────────────────────────────────────────────
// ── INFINITYFREE ──────────────────────────────────────────
$api_base = '/api';
// ── LOCAL (XAMPP) ─────────────────────────────────────────
// $api_base = '/kiddo-finance/api';

header('Content-Type: application/json');
echo json_encode(['api_base' => $api_base], JSON_UNESCAPED_SLASHES);
