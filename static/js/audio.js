class AudioController {
    constructor() {
        this.textInput = document.getElementById('textInput');
        this.convertBtn = document.getElementById('convertBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.audioPlayer = document.getElementById('audioPlayer');
        this.loading = document.querySelector('.loading');
        this.charCounter = document.querySelector('.char-counter');
        
        this.waveformVisualizer = new WaveformVisualizer();
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.convertBtn.addEventListener('click', () => this.convertText());
        this.textInput.addEventListener('input', () => this.updateCharCount());
        this.downloadBtn.addEventListener('click', () => this.downloadAudio());
        this.audioPlayer.addEventListener('play', () => this.waveformVisualizer.start());
        this.audioPlayer.addEventListener('pause', () => this.waveformVisualizer.stop());
    }

    updateCharCount() {
        const count = this.textInput.value.length;
        this.charCounter.textContent = `${count}/5000 characters`;
    }

    async convertText() {
        const text = this.textInput.value.trim();
        if (!text) return;

        this.loading.style.display = 'flex';
        this.convertBtn.disabled = true;

        try {
            const response = await fetch('/convert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text })
            });

            if (!response.ok) throw new Error('Conversion failed');

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            this.audioPlayer.src = audioUrl;
            this.downloadBtn.disabled = false;
            this.waveformVisualizer.loadAudio(audioUrl);
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to convert text to speech');
        } finally {
            this.loading.style.display = 'none';
            this.convertBtn.disabled = false;
        }
    }

    downloadAudio() {
        if (!this.audioPlayer.src) return;
        
        const link = document.createElement('a');
        link.href = this.audioPlayer.src;
        link.download = 'tts-audio.mp3';
        link.click();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AudioController();
});
