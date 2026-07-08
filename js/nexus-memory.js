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
                highest
