<?php
/**
 * Simple Integration Test for token.php
 * This script simulates a POST request to token.php and verifies the OpenAI response.
 */

// Mock $_SERVER for internal execution
$_SERVER['REQUEST_METHOD'] = 'POST';

echo "--- Starting token.php Integration Test ---\n";

// Capture output
ob_start();
require_once __DIR__ . '/token.php';
$output = ob_get_clean();

$response = json_decode($output, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo "FAILED: Response is not valid JSON.\n";
    echo "Raw output: " . $output . "\n";
    exit(1);
}

if (isset($response['value']) && strpos($response['value'], 'ek_') === 0) {
    echo "SUCCESS: Received ephemeral token: " . substr($response['value'], 0, 15) . "...\n";
    echo "Expires at: " . ($response['expires_at'] ?? 'N/A') . "\n";
} else {
    echo "FAILED: No valid token in response.\n";
    echo "Response: " . json_encode($response, JSON_PRETTY_PRINT) . "\n";
    exit(1);
}

echo "--- Test Completed Successfully ---\n";
exit(0);
