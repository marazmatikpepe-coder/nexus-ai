// ============ КОНФИГУРАЦИЯ NEXUS AI ============
const CONFIG = {
    // Firebase конфигурация
    firebase: {
        apiKey: "AIzaSyBcNoAmrieOGp5YZ9J2GNvR-sdB_4EmYe0",
        authDomain: "nexus-ai-ca451.firebaseapp.com",
        projectId: "nexus-ai-ca451",
        storageBucket: "nexus-ai-ca451.firebasestorage.app",
        messagingSenderId: "1056967699954",
        appId: "1:1056967699954:web:90c934ef1042f8778e0f6b"
    },
    
    // Hugging Face API
    hf: {
        token: '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',
        primaryModel: 'ai-forever/ruGPT-3.5-13B',
        backupModel: 'sberbank-ai/rugpt3large_based_on_gpt2',
        maxTokens: 250,
        temperature: 0.8
    },
    
    // Настройки Nexus
    nexus: {
        name: 'Nexus',
        gender: 'male',
        version: '2.0.0',
        autoLearnInterval: 6 * 60 * 60 * 1000, // каждые 6 часов
        maxHistoryLength: 50,
        learningSources: [
            'https://ru.wikipedia.org/w/api.php',
            'https://habr.com/ru/rss/all/all/',
            'https://news.yandex.ru/index.rss'
        ]
    }
};

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
