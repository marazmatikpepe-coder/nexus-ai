// ============ ЯДРО NEXUS AI (ИСПРАВЛЕННОЕ) ============
class NexusCore {
    constructor() {
        this.isProcessing = false;
        this.conversationContext = [];
        this.totalResponses = 0;
        this.useLocalFallback = true; // Начинаем с локальных ответов
        
        this.init();
    }

    async init() {
        console.log('🧠 Nexus Core инициализирован');
        
        // Пробуем загрузить статистику
        try {
            const doc = await db.collection('system').doc('stats').get();
            if (doc.exists) {
                this.totalResponses = doc.data().totalResponses || 0;
            }
        } catch (e) {
            console.log('📊 Статистика будет создана');
        }
        
        this.updateUI();
    }

    updateUI() {
        document.getElementById('messageCount').textContent = 
            `💬 ${this.totalResponses} ответов`;
    }

    async generateResponse(userInput) {
        if (this.isProcessing) return 'Подожди, я думаю...';
        
        this.isProcessing = true;
        
        try {
            let answer = '';
            
            // 1. Сначала ищем в Firestore
            answer = await this.searchInFirestore(userInput);
            if (answer) {
                return answer;
            }
            
            // 2. Если нет в базе - пробуем Hugging Face
            answer = await this.tryHuggingFace(userInput);
            if (answer && answer.length > 10) {
                return answer;
            }
            
            // 3. Запасной вариант - умный ответ
            return this.generateSmartFallback(userInput);
            
        } catch (error) {
            console.error('❌ Ошибка:', error);
            return 'Извини, произошла ошибка. Попробуй спросить иначе.';
        } finally {
            this.isProcessing = false;
            this.totalResponses++;
            this.updateUI();
        }
    }

    async searchInFirestore(question) {
        try {
            const questionLower = question.toLowerCase();
            const words = questionLower.split(/\s+/);
            
            // Ищем по ключевым словам
            for (const word of words) {
                if (word.length < 3) continue;
                
                const snapshot = await db.collection('knowledge_base')
                    .where('keywords', 'array-contains', word)
                    .limit(5)
                    .get();
                
                if (!snapshot.empty) {
                    const doc = snapshot.docs[Math.floor(Math.random() * snapshot.docs.length)];
                    const data = doc.data();
                    
                    if (data.variations && data.variations.length > 0) {
                        return data.variations[Math.floor(Math.random() * data.variations.length)];
                    }
                }
            }
            
            // Если не нашли по keywords, ищем по всем документам
            const allDocs = await db.collection('knowledge_base').limit(20).get();
            
            let bestMatch = null;
            let bestScore = 0;
            
            allDocs.forEach(doc => {
                const data = doc.data();
                const topicWords = (data.keywords || []).join(' ').toLowerCase();
                const score = this.similarity(questionLower, topicWords);
                
                if (score > bestScore && score > 0.2) {
                    bestScore = score;
                    if (data.variations && data.variations.length > 0) {
                        bestMatch = data.variations[Math.floor(Math.random() * data.variations.length)];
                    }
                }
            });
            
            return bestMatch;
            
        } catch (error) {
            console.log('💾 Поиск в Firestore не удался:', error.message);
            return null;
        }
    }

    similarity(str1, str2) {
        const words1 = str1.split(/\s+/);
        const words2 = str2.split(/\s+/);
        let matches = 0;
        
        for (const word of words1) {
            if (word.length > 2 && words2.some(w => w.includes(word) || word.includes(w))) {
                matches++;
            }
        }
        
        return matches / Math.max(words1.length, 1);
    }

    async tryHuggingFace(question) {
        try {
            const response = await fetch(
                'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${CONFIG.hf.token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        inputs: question,
                        parameters: {
                            max_length: 150,
                            temperature: 0.9,
                            top_p: 0.95,
                        }
                    })
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                if (data[0]?.generated_text) {
                    return data[0].generated_text.replace(question, '').trim();
                }
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }

    generateSmartFallback(question) {
        const questionLower = question.toLowerCase();
        
        // Умные fallback-ответы
        if (questionLower.includes('привет') || questionLower.includes('здрав')) {
            return '👋 Привет! Я Nexus AI. Рад тебя видеть! Спрашивай что угодно, я постоянно учусь новому.';
        }
        
        if (questionLower.includes('как дел') || questionLower.includes('как ты')) {
            return '🤖 У меня всё отлично! Как у нейросети, у меня нет эмоций в человеческом понимании, но я функционирую на 100% и готов помогать!';
        }
        
        if (questionLower.includes('что ты умеешь') || questionLower.includes('твои возможност')) {
            return '🧠 Я Nexus — могу отвечать на вопросы, обучаться новому, запоминать контекст диалога, искать информацию и даже шутить! Моя база знаний постоянно растет.';
        }
        
        if (questionLower.includes('кто тебя создал') || questionLower.includes('твой создатель')) {
            return '👨‍💻 Меня создал талантливый разработчик, который хотел сделать доступный ИИ. Я использую нейросети Hugging Face и Firebase для хранения знаний.';
        }
        
        // Общий ответ
        const genericResponses = [
            `🤔 Интересный вопрос про "${question}". Я как нейросеть постоянно анализирую информацию. Давай разберем это подробнее!`,
            `📊 Отличный вопрос! "${question}" - тема, которую стоит обсудить. Я использую свою нейросеть чтобы дать лучший ответ.`,
            `💡 О, "${question}"! Это напоминает мне о том, как важно постоянно учиться. Мой алгоритм сейчас анализирует эту тему.`,
            `🔍 Ищу в своих нейросетях... По теме "${question}" у меня есть несколько мыслей. Это сложный и интересный вопрос!`
        ];
        
        return genericResponses[Math.floor(Math.random() * genericResponses.length)];
    }
}

// Создаем экземпляр после загрузки Firebase
let nexus;

document.addEventListener('DOMContentLoaded', () => {
    // Ждем инициализации Firebase
    setTimeout(() => {
        nexus = new NexusCore();
        console.log('✅ Nexus готов к работе');
    }, 1000);
});
