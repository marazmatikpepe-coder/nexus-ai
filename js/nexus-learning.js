// ============ САМООБУЧЕНИЕ NEXUS ============
const NexusLearning = {
    isLearning: false,

    async startBackgroundLearning() {
        if (this.isLearning) return;
        this.isLearning = true;
        
        console.log('📚 Nexus учится...');
        
        try {
            // Учимся из Wikipedia
            const topics = ['Искусственный_интеллект', 'Нейронная_сеть', 'Машинное_обучение'];
            
            for (const topic of topics) {
                try {
                    const response = await fetch(
                        `https://ru.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${topic}&format=json&origin=*`
                    );
                    const data = await response.json();
                    const pages = data.query.pages;
                    const page = Object.values(pages)[0];
                    
                    if (page.extract) {
                        const summary = page.extract.substring(0, 300);
                        const topicKey = topic.replace(/_/g, ' ').toLowerCase();
                        
                        await db.collection('knowledge_base').doc(topicKey).set({
                            variations: [summary],
                            keywords: topicKey.split(' '),
                            source: 'wikipedia',
                            timestamp: new Date().toISOString()
                        }, { merge: true });
                        
                        console.log(`✅ Изучил: ${topicKey}`);
                    }
                    
                    await new Promise(r => setTimeout(r, 2000));
                } catch (e) {
                    console.log(`⚠️ Не удалось изучить ${topic}:`, e.message);
                }
            }
            
        } catch (error) {
            console.log('⚠️ Обучение прервано:', error.message);
        } finally {
            this.isLearning = false;
            const indicator = document.getElementById('learningIndicator');
            if (indicator) indicator.classList.remove('active');
        }
    }
};

// Запускаем обучение через 5 секунд после загрузки
setTimeout(() => {
    NexusLearning.startBackgroundLearning();
}, 5000);
