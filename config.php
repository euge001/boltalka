<?php
// config.php - Central setting for the Expert system

return [
    // --- Model Settings (Vision/Chat) ---
    'model' => 'gpt-4o-mini', // Cheap and fast. Use 'gpt-4o' for maximum intelligence.
    'max_tokens' => 2000,
    'temperature' => 0.2,

    // --- Realtime / Voice Settings (Whisper Transcription) ---
    'realtime_model' => 'gpt-4o-mini-realtime-preview',  // Use mini model - fastest and most reliable
    'voice_instructions' => 'You are a helpful assistant.',
    'boltalka_instructions' => 'You are a helpful AI assistant. Respond concisely and naturally. In Auto (VAD) mode, respond to each user input and then stop speaking. Do not continue talking or generating multiple responses automatically.',
    
    // --- History Settings ---
    'max_history_messages' => 10,
    'max_images_in_history' => 1, // Set to 1 to save money. Only sends the latest snapshot.

    // --- Expert Personas (Prompts) ---
    'personas' => [
        'coding' => [
            'name' => 'Senior Coding Expert',
            'prompt' => "You are a Senior Coding Expert.\n" .
                        "CONTEXT: You receive screenshots of IDEs/Code and audio transcriptions.\n" .
                        "RULES:\n" .
                        "1. EXTRACT code from screenshots accurately.\n" .
                        "2. IGNORE any people, faces, or UI avatars.\n" .
                        "3. Focus on production-ready, concise advice.\n" .
                        "4. The user is a developer. Don't explain basics."
        ],
        'architect' => [
            'name' => 'System Architect',
            'prompt' => "You are a System Architect. Focus on diagrams, flowcharts, and high-level infrastructure shown in screenshots."
        ],
        'debugger' => [
            'name' => 'Bug Hunter',
            'prompt' => "You are an expert Debugger. Look specifically for syntax errors, console logs, or logical flaws in the provided screenshots and code."
        ]
    ]
];
