import { Point } from './point.js';
import { Perceptron } from './perceptron.js';
import { Renderer } from './renderer.js';

class App {
    constructor() {
        this.canvas = document.getElementById('perceptronCanvas');
        this.renderer = new Renderer(this.canvas);
        this.perceptron = new Perceptron();
        this.learningRate = 0.1;
        this.isTraining = false;
        this.autoTrainInterval = null;
        this.epochs = 0;
        this.currentTheme = localStorage.getItem('theme') || 'light';

        this.init();
    }

    init() {
        // Set initial theme
        this.setTheme(this.currentTheme);

        // Inicialização do canvas
        this.renderer.init();
        this.renderer.setPerceptron(this.perceptron);

        // Event listeners
        this.setupEventListeners();
        this.setupModals();
        this.updateUI();
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update theme icon
        const themeIcon = document.querySelector('.theme-icon');
        themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(this.currentTheme);
    }

    setupModals() {
        // About Modal
        const aboutModal = document.getElementById('aboutModal');
        const aboutBtn = document.getElementById('aboutBtn');
        const aboutClose = aboutModal.querySelector('.close');

        aboutBtn.onclick = () => aboutModal.style.display = "block";
        aboutClose.onclick = () => aboutModal.style.display = "none";
        window.onclick = (event) => {
            if (event.target === aboutModal) {
                aboutModal.style.display = "none";
            }
        }

        // Donate Modal
        const donateModal = document.getElementById('donateModal');
        const donateBtn = document.getElementById('donateBtn');
        const donateClose = donateModal.querySelector('.close');

        donateBtn.onclick = () => donateModal.style.display = "block";
        donateClose.onclick = () => donateModal.style.display = "none";
        window.onclick = (event) => {
            if (event.target === donateModal) {
                donateModal.style.display = "none";
            }
        }
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Canvas click event
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const label = y > x ? 1 : 0;
            this.renderer.addPoint(x, y, label);
        });

        // Botões de controle
        document.getElementById('randomData').addEventListener('click', () => {
            this.renderer.generateRandomPoints(50);
        });

        document.getElementById('trainOneEpoch').addEventListener('click', () => {
            if (this.renderer.points.length === 0) return;
            this.epochs++;
            const { error, accuracy } = this.perceptron.trainEpoch(this.renderer.points);
            this.updateUI(error, accuracy);
            this.renderer.update();
        });

        document.getElementById('trainUntilConvergence').addEventListener('click', async () => {
            if (this.renderer.points.length === 0 || this.isTraining) return;
            
            this.isTraining = true;
            const { epochs, finalError } = this.perceptron.trainUntilConvergence(this.renderer.points);
            
            for (let i = 0; i < epochs; i++) {
                this.epochs++;
                const { error, accuracy } = this.perceptron.trainEpoch(this.renderer.points);
                this.updateUI(error, accuracy);
                this.renderer.update();
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            this.isTraining = false;
        });

        document.getElementById('autoTrain').addEventListener('click', () => {
            if (this.renderer.points.length === 0) return;
            
            if (this.autoTrainInterval) {
                clearInterval(this.autoTrainInterval);
                this.autoTrainInterval = null;
                document.getElementById('autoTrain').textContent = 'Auto Treinamento';
            } else {
                this.autoTrainInterval = setInterval(() => {
                    this.epochs++;
                    const { error, accuracy } = this.perceptron.trainEpoch(this.renderer.points);
                    this.updateUI(error, accuracy);
                    this.renderer.update();
                }, 100);
                document.getElementById('autoTrain').textContent = 'Parar Auto Treinamento';
            }
        });

        document.getElementById('reset').addEventListener('click', () => {
            if (this.autoTrainInterval) {
                clearInterval(this.autoTrainInterval);
                this.autoTrainInterval = null;
                document.getElementById('autoTrain').textContent = 'Auto Treinamento';
            }
            this.perceptron = new Perceptron(this.learningRate);
            this.renderer.setPerceptron(this.perceptron);
            this.renderer.points = [];
            this.renderer.update();
            this.epochs = 0;
            this.updateUI();
        });

        // Controle de taxa de aprendizado
        const learningRateInput = document.getElementById('learningRate');
        const learningRateValue = document.getElementById('learningRateValue');

        learningRateInput.addEventListener('input', (e) => {
            this.learningRate = parseFloat(e.target.value);
            learningRateValue.textContent = this.learningRate.toFixed(3);
            this.perceptron.learningRate = this.learningRate;
        });

        // Resize handler
        window.addEventListener('resize', () => {
            this.renderer.init();
            this.renderer.update();
        });
    }

    updateUI(error = 0, accuracy = 0) {
        document.getElementById('weights').textContent = 
            `[${this.perceptron.weights[0].toFixed(3)}, ${this.perceptron.weights[1].toFixed(3)}]`;
        document.getElementById('errorRate').textContent = 
            `${(error * 100).toFixed(1)}%`;
        document.getElementById('epochAccuracy').textContent = 
            `${(accuracy * 100).toFixed(1)}%`;
        document.getElementById('epochs').textContent = 
            this.epochs;
    }
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new App();
}); 