<?php
// token.php — POST only
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  header('Content-Type: text/plain; charset=utf-8');
  echo "POST only";
  exit;
}

// 1) Положи API key в переменную окружения, если можешь (лучше).
// Если у тебя только shared hosting без env — временно можно вставить сюда, но это хуже.
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            putenv(trim($parts[0]) . "=" . trim($parts[1]));
        }
    }
}
$apiKey = getenv('OPENAI_API_KEY');
if (!$apiKey) {
  http_response_code(500);
  header('Content-Type: text/plain; charset=utf-8');
  echo "Missing OPENAI_API_KEY env";
  exit;
}

// Используем /realtime/sessions для GA (Generaly Available) версии API
$config = require __DIR__ . '/config.php';
$payload = [
  "model" => $config['realtime_model'] ?? "gpt-4o-mini-realtime-preview",
  "modalities" => ["audio", "text"],
  "instructions" => $config['boltalka_instructions'] ?? "You are a helpful assistant."
];

$ch = curl_init("https://api.openai.com/v1/realtime/sessions");
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer " . trim($apiKey),
    "Content-Type: application/json"
  ],
  CURLOPT_POSTFIELDS => json_encode($payload),
  CURLOPT_TIMEOUT => 15
]);

$res = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err  = curl_error($ch);
curl_close($ch);

if ($res === false) {
  http_response_code(502);
  header('Content-Type: text/plain; charset=utf-8');
  echo "Curl error: ".$err;
  exit;
}
if ($code < 200 || $code >= 300) {
  http_response_code(502);
  header('Content-Type: text/plain; charset=utf-8');
  echo "OpenAI error (HTTP $code): ".$res;
  exit;
}

// Возвращаем браузеру { value, expires_at }
$data = json_decode($res, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(502);
    echo "Invalid JSON from OpenAI: " . $res;
    exit;
}

// Пытаемся найти ключ в разных местах (OpenAI иногда меняет структуру или она зависит от endpoint)
$tokenValue = null;
$expiresAt = null;

if (isset($data["client_secret"]["value"])) {
    $tokenValue = $data["client_secret"]["value"];
    $expiresAt  = $data["client_secret"]["expires_at"] ?? null;
} elseif (isset($data["value"])) {
    // В некоторых случаях (или версиях API) может быть сразу в корне
    $tokenValue = $data["value"];
    $expiresAt  = $data["expires_at"] ?? null;
}

if (!$tokenValue) {
    http_response_code(502);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(["error" => "No token value in OpenAI response", "raw" => $data]);
    exit;
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode([
  "value" => $tokenValue,
  "expires_at" => $expiresAt
]);
