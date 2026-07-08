// ============ ПАМЯТЬ NEXUS ============
class NexusMemory {
    constructor() {
        this.localDB = {};
        this.init();
    }

    init() {
        // Загружаем Firestore
        try {
            firebase.initializeApp(CONFIG.firebase);
            this.db = firebase.firestore();
            this.db.enablePersistence().catch(() => {
                console.log('💾 Работаю в оффлайн режиме');
            });
        } catch (error) {
            console.log('💾 Firebase уже инициализирован');
            this.db = firebase.firestore();
        }
        
        this.loadKnowledgeBase();
    }

    // Загрузка базы знаний
    async loadKnowledgeBase() {
        try {
            const response = await fetch('data/knowledge-base.json');
            if (response.ok) {
                const data = await response.json();
                this.localDB = data;
                document.getElementById('knowledgeCount').textContent = 
                    `📚 ${Object.keys(data).length} тем`;
            }
        } catch (error) {
            console.log('📚 База знаний загружена из Firestore');
            await this.loadFromFirestore();
        }
    }

    async loadFromFirestore() {
        try {
            const snapshot = await this.db.collection('knowledge_base').get();
            snapshot.forEach(doc => {
                this.localDB[doc.id] = doc.data();
            });
            document.getElementById('knowledgeCount').textContent = 
                `📚 ${Object.keys(this.localDB).length} тем`;
        } catch (error) {
            console.log('📚 База знаний пуста');
        }
    }

    // Поиск в локальной базе
    searchLocal(question) {
        const questionLower = question.toLowerCase();
        let bestMatch = null;
        let highestScore = 0;

        for (const [topic, data] of Object.entries(this.localDB)) {
            const score = this.calculateSimilarity(questionLower, topic.toLowerCase());
            
            if (score > highestScore && score > 0.3) {
                highestScore = score;
                
                // Выбираем случайную вариацию из 20
                if (data.variations && data.variations.length > 0) {
                    const variation = data.variations[Math.floor(Math.random() * data.variations.length)];
                    bestMatch = { text: variation, confidence: score, source: 'local' };
                }
            }
        }

        return bestMatch;
    }

    // Простой расчет схожести
    calculateSimilarity(str1, str2) {
        const words1 = new Set(str1.split(/\s+/));
        const words2 = new Set(str2.split(/\s+/));
        
        let intersection = 0;
        for (const word of words1) {
            if (words2.has(word)) intersection++;
        }
        
        const union = words1.size + words2.size - intersection;
        return union > 0 ? intersection / union : 0;
    }

    // Локальный fallback с вариациями
    getLocalFallback(question) {
        const fallbacks = [
            `🤔 Интересный вопрос! Как нейросеть, я постоянно учусь. Давай рассмотрим это с разных сторон. ${question} - это тема, которая требует глубокого анализа.`,
            
            `📊 Анализирую твой вопрос... ${question} действительно важная тема. Основываясь на моей базе знаний, могу сказать что здесь несколько ключевых аспектов.`,
            
            `🧠 Как самообучающаяся нейросеть, я вижу что ${question} связано с несколькими областями знаний. Давай разберем основные моменты.`,
            
            `💡 Отличный вопрос! ${question} - тема, которую я изучал. Позволь объяснить с точки зрения нейросети...`,
            
            `🔍 Ищу в своей нейросети... По теме "${question}" у меня есть несколько интересных наблюдений.`
        ];
        
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    // Сохранение диалога
    async saveConversation(userInput, aiResponse) {
        try {
            await this.db.collection('conversations').add({
                user: userInput,
                nexus: aiResponse,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            // Сохраняем локально если нет сети
            const localHistory = JSON.parse(localStorage.getItem('nexus_history') || '[]');
            localHistory.push({ user: userInput, nexus: aiResponse, time: new Date().toISOString() });
            localStorage.setItem('nexus_history', JSON.stringify(localHistory.slice(-100)));
        }
    }

    // Добавление знаний
    async addKnowledge(topic, data) {
        try {
            await this.db.collection('knowledge_base').doc(topic).set({
                variations: data.variations || [data.text],
                source: 'user',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.localDB[topic] = data;
            document.getElementById('knowledgeCount').textContent = 
                `📚 ${Object.keys(this.localDB).length} тем`;
            
            return true;
        } catch (error) {
            console.log('💾 Знания сохранены локально');
            return false;
        }
    }
}

const NexusMemory = new NexusMemory();
