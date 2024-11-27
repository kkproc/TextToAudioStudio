class WaveformVisualizer {
    constructor() {
        this.canvas = document.getElementById('waveform');
        this.ctx = this.canvas.getContext('2d');
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.isPlaying = false;
        
        this.setupCanvas();
        window.addEventListener('resize', () => this.setupCanvas());
    }

    setupCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    async loadAudio(url) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        
        this.buffer = audioBuffer;
        this.drawWaveform();
    }

    drawWaveform() {
        if (!this.buffer) return;

        const data = this.buffer.getChannelData(0);
        const step = Math.ceil(data.length / this.canvas.width);
        const amp = this.canvas.height / 2;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.beginPath();
        this.ctx.moveTo(0, amp);

        for (let i = 0; i < this.canvas.width; i++) {
            let min = 1.0;
            let max = -1.0;
            
            for (let j = 0; j < step; j++) {
                const datum = data[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }

            this.ctx.lineTo(i, (1 + min) * amp);
            this.ctx.lineTo(i, (1 + max) * amp);
        }

        this.ctx.strokeStyle = '#00ff9d';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.draw();
    }

    stop() {
        this.isPlaying = false;
    }

    draw() {
        if (!this.isPlaying) return;

        this.analyser.getByteTimeDomainData(this.dataArray);
        
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#00ff9d';
        this.ctx.beginPath();

        const sliceWidth = this.canvas.width / this.dataArray.length;
        let x = 0;

        for (let i = 0; i < this.dataArray.length; i++) {
            const v = this.dataArray[i] / 128.0;
            const y = v * this.canvas.height / 2;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        this.ctx.lineTo(this.canvas.width, this.canvas.height / 2);
        this.ctx.stroke();

        requestAnimationFrame(() => this.draw());
    }
}
