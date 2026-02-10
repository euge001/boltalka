<?php
/**
 * Comprehensive Integration Test for Boltalka Backend
 */

function test_endpoint($name, $url, $method = 'GET', $postfields = null) {
    echo "Testing $name ($url)... ";
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    if ($postfields) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postfields);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    }
    $response = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($code >= 200 && $code < 300) {
        echo "✅ OK (HTTP $code)\n";
        return json_decode($response, true);
    } else {
        echo "❌ FAILED (HTTP $code)\n";
        echo "Response: $response\n";
        return null;
    }
}

// 1. Check config_js.php
$config = test_endpoint("Config JS", "http://localhost/Boltalka/config_js.php");
if ($config) {
    if (isset($config['realtime_model']) && isset($config['boltalka_instructions'])) {
        echo "   - Config values present ✅\n";
    } else {
        echo "   - Config values missing ❌\n";
    }
}

// 2. Check token.php (POST)
$token = test_endpoint("Token API", "http://localhost/Boltalka/token.php", "POST", "{}");
if ($token) {
    if (isset($token['value']) && !empty($token['value'])) {
        echo "   - Ephemeral token received ✅\n";
    } else {
        echo "   - No token value in response ❌\n";
    }
}

// 3. Check chat.php (If exists and used)
if (file_exists(__DIR__ . '/chat.php')) {
    $chat = test_endpoint("Chat API", "http://localhost/Boltalka/chat.php", "POST", json_encode(['message' => 'test']));
    // chat.php might require auth or specific format, adjust if needed
}

echo "\n--- Backend Test Completed ---\n";
