// ============ ИНТЕРФЕЙС NEXUS ============
const NexusUI = {
    messagesContainer: null,
    userInput: null,
    sendBtn: null,

    init() {
        this.messagesContainer = document.getElementById('messagesContainer');
        this.userInput = document.getElementById('userInput');
        this.sendBtn = document.getElementById('sendBtn');
        
        // Enter для отправки
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        this.createNeuralBackground();
    },

    createNeuralBackground() {
        const bg = document.getElementById('neuralBg');
        if (!bg) return;
        
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'neural-particle';
            particle.style.cssText = `
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                width: ${Math.random() * 4 + 2}px;
                height: ${Math.random() * 4 + 2}px;
                animation-delay: ${Math.random() * 6}s;
                animation-duration: ${Math.random() * 5 + 4}s;
            `;
            bg.appendChild(particle);
        }
    },

    addMessage(text, type = 'nexus') {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${type}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = type === 'user' ? '👤' : '🧠';

        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = `
            ${text.replace(/\n/g, '<br>')}
            <span class="message-time">${new Date().toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'})}</span>
        `;

        wrapper.appendChild(avatar);
        wrapper.appendChild(content);

        const welcome = this.messagesContainer.querySelector('.welcome-message');
        if (welcome) welcome.remove();

        this.messagesContainer.appendChild(wrapper);
        this.scrollToBottom();
    },

    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    },

    setSendButtonState(enabled) {
        this.sendBtn.disabled = !enabled;
        this.sendBtn.innerHTML = enabled ? 
            '<span class="send-icon">➤</span><span class="send-text">Отправить</span>' : 
            '<span class="send-icon">⏳</span>';
    },

    showLearningIndicator() {
        const indicator = document.getElementById('learningIndicator');
        if (indicator) {
            indicator.classList.add('active');
            setTimeout(() => indicator.classList.remove('active'), 5000);
        }
    }
};

// Глобальные функции
async function sendMessage() {
    const input = document.getElementById('userInput');
    const message = input.value.trim();
    
    if (!message || !nexus || nexus.isProcessing) return;
    
    input.value = '';
    
    NexusUI.addMessage(message, 'user');
    NexusUI.setSendButtonState(false);
    
    const response = await nexus.generateResponse(message);
    
    NexusUI.setSendButtonState(true);
    if (response) {
        NexusUI.addMessage(response, 'nexus');
    }
}

function askQuickQuestion(question) {
    document.getElementById('userInput').value = question;
    sendMessage();
}

function addKnowledge() {
    const text = prompt('Введи знания для Nexus:');
    if (text && text.trim()) {
        db.collection('knowledge_base').doc(text.substring(0, 30).toLowerCase()).set({
            variations: [text],
            keywords: text.toLowerCase().split(/\s+/).filter(w => w.length > 2),
            source: 'user',
            timestamp: new Date().toISOString()
        });
        NexusUI.addMessage('✅ Знания добавлены!', 'nexus');
    }
}

function exportChat() {
    const messages = document.querySelectorAll('.message-content');
    let text = '=== Nexus Chat ===\n\n';
    messages.forEach(m => text += m.textContent + '\n---\n');
    
    const blob = new Blob([text], {type: 'text/plain'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'nexus-chat.txt';
    a.click();
}

function clearChat() {
    document.getElementById('messagesContainer').innerHTML = '';
    if (nexus) nexus.conversationContext = [];
}

document.addEventListener('DOMContentLoaded', () => {
    NexusUI.init();
});
