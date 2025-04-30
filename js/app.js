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

        // Usar o log container existente no HTML
        this.logContainer = document.querySelector('.log-container');

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
        // Verificar se os elementos existem antes de adicionar os event listeners
        const elements = {
            randomData: document.getElementById('randomData'),
            trainOneEpoch: document.getElementById('trainOneEpoch'),
            trainUntilConvergence: document.getElementById('trainUntilConvergence'),
            autoTrain: document.getElementById('autoTrain'),
            reset: document.getElementById('reset'),
            themeToggle: document.getElementById('themeToggle'),
            aboutBtn: document.getElementById('aboutBtn'),
            donateBtn: document.getElementById('donateBtn'),
            learningRate: document.getElementById('learningRate'),
            learningRateValue: document.getElementById('learningRateValue')
        };

        // Verificar se todos os elementos necessários existem
        for (const [id, element] of Object.entries(elements)) {
            if (!element) {
                console.error(`Elemento com ID '${id}' não encontrado`);
                return;
            }
        }

        // Canvas click event
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const label = y > x ? 1 : 0;
            this.renderer.addPoint(x, y, label);
            this.log(`Ponto adicionado: (${x.toFixed(2)}, ${y.toFixed(2)}) - Classe ${label}`);
        });

        // Random data generation
        elements.randomData.addEventListener('click', () => {
            this.renderer.generateRandomPoints(50);
            this.log('50 pontos aleatórios gerados');
        });

        // Single epoch training
        elements.trainOneEpoch.addEventListener('click', () => {
            if (this.renderer.points.length === 0) {
                this.log('Erro: Nenhum ponto para treinar', 'error');
                return;
            }
            this.epochs++;
            const { error, accuracy } = this.perceptron.trainEpoch(this.renderer.points);
            this.updateUI(error, accuracy);
            this.renderer.update();
            this.log(`Época ${this.epochs}: Erro = ${(error * 100).toFixed(2)}%, Acurácia = ${(accuracy * 100).toFixed(2)}%`);
        });

        // Train until convergence
        elements.trainUntilConvergence.addEventListener('click', async () => {
            if (this.renderer.points.length === 0) {
                this.log('Erro: Nenhum ponto para treinar', 'error');
                return;
            }
            
            this.log('Iniciando treinamento até convergência...');
            const { epochs, finalError } = this.perceptron.trainUntilConvergence(this.renderer.points);
            this.log(`Treinamento concluído após ${epochs} épocas. Erro final: ${(finalError * 100).toFixed(2)}%`);
        });

        // Auto training
        elements.autoTrain.addEventListener('click', async () => {
            if (this.renderer.points.length === 0) {
                this.log('Erro: Nenhum ponto para treinar', 'error');
                return;
            }

            if (this.autoTrainInterval) {
                clearInterval(this.autoTrainInterval);
                this.autoTrainInterval = null;
                elements.autoTrain.textContent = 'Auto Treinamento';
                elements.autoTrain.classList.remove('btn-active');
                this.log('Auto treinamento interrompido');
                return;
            }

            elements.autoTrain.textContent = 'Parar Auto Treinamento';
            elements.autoTrain.classList.add('btn-active');
            this.log('Iniciando auto treinamento...');
            
            const startTime = Date.now();
            const maxDuration = 60000; // 60 segundos em milissegundos
            
            const trainEpoch = async () => {
                if (Date.now() - startTime >= maxDuration) {
                    clearInterval(this.autoTrainInterval);
                    this.autoTrainInterval = null;
                    elements.autoTrain.textContent = 'Auto Treinamento';
                    elements.autoTrain.classList.remove('btn-active');
                    this.log('Auto treinamento concluído após 60 segundos');
                    return;
                }

                this.epochs++;
                const { error, accuracy } = this.perceptron.trainEpoch(this.renderer.points);
                this.updateUI(error, accuracy);
                this.renderer.update();
                this.log(`Época ${this.epochs}: Erro = ${(error * 100).toFixed(2)}%, Acurácia = ${(accuracy * 100).toFixed(2)}%`);
            };

            // Executa o primeiro treinamento imediatamente
            await trainEpoch();

            // Configura o intervalo para executar a cada 1 segundo
            this.autoTrainInterval = setInterval(trainEpoch, 1000);
        });

        // Reset
        elements.reset.addEventListener('click', () => {
            if (this.autoTrainInterval) {
                clearInterval(this.autoTrainInterval);
                this.autoTrainInterval = null;
                elements.autoTrain.textContent = 'Auto Treinamento';
            }
            this.perceptron = new Perceptron(this.learningRate);
            this.renderer.setPerceptron(this.perceptron);
            this.renderer.points = [];
            this.renderer.update();
            this.epochs = 0;
            this.updateUI();
            this.log('Simulador reiniciado');
        });

        // Theme toggle
        elements.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        // About modal
        elements.aboutBtn.addEventListener('click', () => {
            document.getElementById('aboutModal').style.display = 'block';
        });

        // Donate modal
        elements.donateBtn.addEventListener('click', () => {
            document.getElementById('donateModal').style.display = 'block';
        });

        // Learning rate control
        elements.learningRate.addEventListener('input', (e) => {
            this.learningRate = parseFloat(e.target.value);
            elements.learningRateValue.textContent = this.learningRate.toFixed(3);
            this.perceptron.learningRate = this.learningRate;
        });

        // Close modals
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.style.display = 'none';
                });
            });
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
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

    // Método para adicionar log
    log(message, type = 'info') {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        this.logContainer.appendChild(logEntry);
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }

    // Método para limpar logs
    clearLogs() {
        this.logContainer.innerHTML = '';
    }
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new App();
}); 