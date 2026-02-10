<?php
// chat.php — Expert Proxy with External Config
header('Content-Type: application/json');

$config = require __DIR__ . '/config.php';
$input = json_decode(file_get_contents('php://input'), true);
$history = $input['history'] ?? [];
$personaKey = $input['persona'] ?? 'coding';

if (empty($history)) {
    echo json_encode(['error' => 'No history provided']);
    exit;
}

// Log history for debugging (optional, can be disabled)
// file_put_contents('debug_chat.log', print_r($input, true), FILE_APPEND);

// Load .env
$apiKey = null;
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2 && trim($parts[0]) === 'OPENAI_API_KEY') {
            $apiKey = trim($parts[1]);
            break;
        }
    }
}

// System Prompt from Config
$systemPrompt = $config['personas'][$personaKey]['prompt'] ?? $config['personas']['coding']['prompt'];

$messages = [
    ["role" => "system", "content" => $systemPrompt]
];

// Reconstruct messages (Cheap logic: keep only latest images)
$imageCount = 0;
$revHistory = array_reverse($history);
$processed = [];

foreach ($revHistory as $msg) {
    if (count($processed) >= $config['max_history_messages']) break;
    
    $role = $msg['role'];
    $text = $msg['text'] ?? '';
    $image = $msg['image'] ?? null;

    if ($role === 'assistant') {
        $processed[] = ["role" => "assistant", "content" => $text];
    } else {
        $msgContent = [];
        if ($text) $msgContent[] = ["type" => "text", "text" => $text];
        if ($image && $imageCount < $config['max_images_in_history']) {
            $msgContent[] = ["type" => "image_url", "image_url" => ["url" => $image]];
            $imageCount++;
        }
        $processed[] = ["role" => "user", "content" => $msgContent];
    }
}

$messages = array_merge($messages, array_reverse($processed));

$ch = curl_init('https://api.openai.com/v1/chat/completions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "model" => $config['model'],
    "messages" => $messages,
    "max_tokens" => $config['max_tokens'],
    "temperature" => $config['temperature']
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apiKey
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;
