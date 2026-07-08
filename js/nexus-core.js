// ============ ЯДРО NEXUS AI ============
class NexusCore {
    constructor() {
        this.version = CONFIG.nexus.version;
        this.name = CONFIG.nexus.name;
        this.isProcessing = false;
        this.conversationContext = [];
        this.totalResponses = 0;
        
        this.init();
    }

    init() {
        console.log(`🧠 ${this.name} v${this.version} инициализирован`);
        this.loadStats();
    }

    async loadStats() {
        try {
            const statsRef = db.collection('system').doc('stats');
            const doc = await statsRef.get();
            if (doc.exists) {
                const stats = doc.data();
                this.totalResponses = stats.totalResponses || 0;
                this.updateStatsDisplay();
            }
        } catch (error) {
            console.log('📊 Статистика будет создана при первом ответе');
        }
    }

    async updateStats() {
        this.totalResponses++;
        try {
            await db.collection('system').doc('stats').set({
                totalResponses: this.totalResponses,
                lastActive: firebase.firestore.FieldValue.serverTimestamp(),
                version: this.version
            }, { merge: true });
        } catch (error) {
            console.log('📊 Оффлайн режим');
        }
        this.updateStatsDisplay();
    }

    updateStatsDisplay() {
        const msgCount = document.getElementById('messageCount');
        if (msgCount) {
            msgCount.textContent = `💬 ${this.totalResponses} ответов`;
        }
    }

    // Генерация ответа
    async generateResponse(userInput) {
        if (this.isProcessing) return null;
        
        this.isProcessing = true;
        NexusUI.setSendButtonState(false);
        
        try {
            // 1. Проверяем локальную базу
            let answer = await NexusMemory.searchLocal(userInput);
            
            // 2. Если нет - используем Hugging Face
            if (!answer || answer.confidence < 0.6) {
                answer = await this.callHuggingFace(userInput);
            }
            
            // 3. Если HF недоступен - используем локальные вариации
            if (!answer || !answer.text || answer.text.length < 5) {
                answer = { text: NexusMemory.getLocalFallback(userInput), source: 'local' };
            }
            
            // 4. Сохраняем в историю и память
            this.addToContext(userInput, answer.text);
            await NexusMemory.saveConversation(userInput, answer.text);
            await this.updateStats();
            
            // 5. Запускаем фоновое обучение если нужно
            this.checkAutoLearn();
            
            return answer.text;
            
        } catch (error) {
            console.error('❌ Ошибка генерации:', error);
            return 'Извини, произошла ошибка в нейросети. Попробуй переформулировать вопрос или спроси позже.';
        } finally {
            this.isProcessing = false;
            NexusUI.setSendButtonState(true);
        }
    }

    // Вызов Hugging Face API
    async callHuggingFace(question) {
        const context = this.conversationContext.slice(-3).join('\n');
        const prompt = `<|user|>\n${context}\n${question}\n<|bot|>\n`;
        
        try {
            // Пробуем основную модель
            let response = await this.queryHF(CONFIG.hf.primaryModel, prompt);
            
            // Если ошибка - пробуем запасную
            if (!response || response.error) {
                response = await this.queryHF(CONFIG.hf.backupModel, prompt);
            }
            
            if (response && response[0]?.generated_text) {
                let answer = response[0].generated_text.split('<|bot|>').pop().trim();
                // Очищаем от технических токенов
                answer = answer.replace(/<\|.*?\|>/g, '').trim();
                
                if (answer.length > 5) {
                    return { text: answer, source: 'huggingface' };
                }
            }
            
            return null;
            
        } catch (error) {
            console.log('🌐 Hugging Face недоступен:', error.message);
            return null;
        }
    }

    async queryHF(model, prompt) {
        const response = await fetch(
            `https://api-inference.huggingface.co/models/${model}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CONFIG.hf.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_new_tokens: CONFIG.hf.maxTokens,
                        temperature: CONFIG.hf.temperature,
                        top_p: 0.92,
                        do_sample: true,
                        return_full_text: false,
                    }
                })
            }
        );
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    }

    addToContext(userInput, aiResponse) {
        this.conversationContext.push(`User: ${userInput}`);
        this.conversationContext.push(`Nexus: ${aiResponse}`);
        
        // Ограничиваем контекст
        if (this.conversationContext.length > CONFIG.nexus.maxHistoryLength) {
            this.conversationContext = this.conversationContext.slice(-CONFIG.nexus.maxHistoryLength);
        }
    }

    checkAutoLearn() {
        // Каждые 50 сообщений запускаем обучение
        if (this.totalResponses % 50 === 0) {
            NexusLearning.startBackgroundLearning();
        }
    }

    // Очистка контекста
    clearContext() {
        this.conversationContext = [];
    }
}

// Глобальный экземпляр
const nexus = new NexusCore();
