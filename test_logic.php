<?php
// Тест бэкенда эксперта
require_once 'chat.php'; // Это вызовет логику, но нам нужно проверить вывод

// В реальности chat.php сразу выводит данные. 
// Сделаем отдельный изолированный тест.

function testExpert($query) {
    echo "Testing query: $query\n";
    
    $url = "http://localhost/Boltalka/chat.php";
    $data = json_encode(["text" => $query, "persona" => "coding"]);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo "HTTP Code: $httpCode\n";
    $json = json_decode($response, true);
    
    if (isset($json['choices'][0]['message']['content'])) {
        echo "SUCCESS: Received response from expert.\n";
        echo "Response excerpt: " . substr($json['choices'][0]['message']['content'], 0, 100) . "...\n";
        return true;
    } else {
        echo "FAILURE: Invalid response format.\n";
        echo "Raw response: " . $response . "\n";
        return false;
    }
}

// Запуск теста
// Примечание: Убедитесь, что сервер запущен
echo "--- Testing chat.php API accessibility ---\n";
// Instead of calling URL, we can check the environment
$apiKey = getenv('OPENAI_API_KEY');
if (!$apiKey && file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env');
    foreach($lines as $line) {
        if(strpos($line, 'OPENAI_API_KEY=') === 0) $apiKey = trim(substr($line, 15));
    }
}

if ($apiKey) {
    echo "API Key check... Found.\n";
    $ch = curl_init("https://api.openai.com/v1/models");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer $apiKey"]);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    echo "API Models Request Status: $code\n";
    if ($code !== 200) {
        echo "CRITICAL: API Key is not usable or quota is exceeded. Response: " . $res . "\n";
    } else {
        echo "API Key is valid and active.\n";
    }
} else {
    echo "ERROR: No API Key found.\n";
}

