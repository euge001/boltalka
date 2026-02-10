<?php
// test_backend.php — Simple test runner for Boltalka backend

function test_token() {
    echo "Testing token.php... ";
    $_SERVER['REQUEST_METHOD'] = 'POST';
    ob_start();
    include 'token.php';
    $res = ob_get_clean();
    $data = json_decode($res, true);
    
    if (isset($data['value'])) {
        echo "PASS (Token received)\n";
    } else {
        echo "FAIL (No token)\n";
        var_dump($data);
    }
}

function test_chat() {
    echo "Testing chat.php... ";
    $testData = json_encode(['text' => 'Test ping', 'persona' => 'coding']);
    
    $ch = curl_init("http://localhost/Boltalka/chat.php");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $testData);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    $data = json_decode($res, true);
    if ($code === 200 && isset($data['choices'][0]['message']['content'])) {
        echo "PASS (Expert responded)\n";
    } else {
        echo "FAIL (Code $code)\n";
        echo $res;
    }
}

echo "=== Backend Tests ===\n";
test_token();
test_chat();
echo "=====================\n";
