// ============ ГОЛОСОВОЙ МОДУЛЬ NEXUS ============
const NexusVoice = {
    recognition: null,
    isListening: false,
    synthesis: window.speechSynthesis,
    isSpeaking: false,

    init() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'ru-RU';
            this.recognition.continuous = false;
            this.recognition.interimResults = false;

            this.recognition.onresult = (event) => {
                const text = event.results[0][0].transcript;
                document.getElementById('userInput').value = text;
                this.stopListening();
                sendMessage();
            };

            this.recognition.onerror = () => {
                this.stopListening();
            };
        }
    },

    startListening() {
        if (!this.recognition) return;
        if (!this.isListening) {
            this.recognition.start();
            this.isListening = true;
            const voiceBtn = document.getElementById('voiceBtn');
            if (voiceBtn) voiceBtn.classList.add('active');
        }
    },

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            const voiceBtn = document.getElementById('voiceBtn');
            if (voiceBtn) voiceBtn.classList.remove('active');
        }
    },

    speak(text) {
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ru-RU';
        utterance.rate = 1.1;
        this.synthesis.speak(utterance);
    }
};

function toggleVoice() {
    if (NexusVoice.isListening) {
        NexusVoice.stopListening();
    } else {
        NexusVoice.startListening();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    NexusVoice.init();
});
