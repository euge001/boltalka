<?php
// config_js.php - Helper to expose config.php values to JavaScript
header('Content-Type: application/json');
$config = require __DIR__ . '/config.php';

// Only expose safe public settings
echo json_encode([
    'realtime_model' => $config['realtime_model'] ?? 'gpt-4o-mini-realtime-preview',
    'voice_instructions' => $config['voice_instructions'] ?? 'Silent transcription',
    'boltalka_instructions' => $config['boltalka_instructions'] ?? 'You are a helpful assistant.'
]);
