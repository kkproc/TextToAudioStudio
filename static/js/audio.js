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

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Conversion failed');
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('audio/mpeg')) {
                throw new Error('Invalid response format from server');
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            this.audioPlayer.src = audioUrl;
            this.downloadBtn.disabled = false;
            this.waveformVisualizer.loadAudio(audioUrl);
        } catch (error) {
            console.error('Error:', error);
            const errorMessage = error.message || 'Failed to convert text to speech';
            this.showError(errorMessage);
        } finally {
            this.loading.style.display = 'none';
            this.convertBtn.disabled = false;
        }
    }

    showError(message) {
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        const alert = document.createElement('div');
        alert.className = 'alert alert-danger alert-dismissible fade show mt-3';
        alert.role = 'alert';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        this.convertBtn.parentElement.insertAdjacentElement('afterend', alert);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 150);
        }, 5000);
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
