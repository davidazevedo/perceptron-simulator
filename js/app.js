import { Point } from './point.js';
import { Perceptron } from './perceptron.js';
import { Renderer } from './renderer.js';
import { GeoMode } from './geoMode.js';

class App {
    constructor() {
        this.canvas = document.getElementById('perceptronCanvas');
        this.geoCanvas = document.getElementById('geoCanvas');
        this.perceptron = new Perceptron(2);
        this.renderer = new Renderer(this.canvas);
        this.geoRenderer = new Renderer(this.geoCanvas);
        this.geoMode = new GeoMode(this.geoCanvas);
        this.geoRenderer.setGeoMode(this.geoMode);
        this.isGeoMode = false;
        this.learningRate = 0.1;
        this.isTraining = false;
        this.autoTrainInterval = null;
        this.epochs = 0;
        this.currentTheme = localStorage.getItem('theme') || 'light';

        // Inicialização do sistema de logs
        this.logContainer = document.getElementById('log');
        this.clearLogButton = document.getElementById('clearLog');
        
        if (this.logContainer) {
            // Criar o conteúdo do log se não existir
            if (!this.logContainer.querySelector('.log-content')) {
                const logContent = document.createElement('div');
                logContent.className = 'log-content';
                this.logContainer.appendChild(logContent);
            }
            
            if (this.clearLogButton) {
                this.clearLogButton.addEventListener('click', () => this.clearLog());
            }
        }

        this.init();
    }

    init() {
        // Set initial theme
        this.setTheme(this.currentTheme);

        // Inicialização do canvas
        this.renderer.init();
        this.renderer.setPerceptron(this.perceptron);
        this.geoRenderer.init();
        this.geoRenderer.setPerceptron(this.perceptron);

        // Event listeners
        this.setupEventListeners();
        this.setupModals();
        this.updateUI();
        this.setupModeToggle();
        this.initializeLog();
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
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.geoCanvas.addEventListener('click', (e) => this.handleCanvasClick(e));

        // Random data generation
        elements.randomData.addEventListener('click', () => {
            this.generateRandomData();
        });

        // Single epoch training
        elements.trainOneEpoch.addEventListener('click', () => {
            this.trainOneEpoch();
        });

        // Train until convergence
        elements.trainUntilConvergence.addEventListener('click', async () => {
            const currentRenderer = this.isGeoMode ? this.geoRenderer : this.renderer;
            if (currentRenderer.points.length === 0) {
                this.log('Erro: Nenhum ponto para treinar', 'error');
                return;
            }
            
            this.log('Iniciando treinamento até convergência...');
            const { epochs, finalError } = this.perceptron.trainUntilConvergence(currentRenderer.points);
            this.log(`Treinamento concluído após ${epochs} épocas. Erro final: ${(finalError * 100).toFixed(2)}%`);
        });

        // Auto training
        elements.autoTrain.addEventListener('click', () => {
            this.autoTrain();
        });

        // Reset
        elements.reset.addEventListener('click', () => {
            if (this.autoTrainInterval) {
                clearInterval(this.autoTrainInterval);
                this.autoTrainInterval = null;
                elements.autoTrain.textContent = 'Auto Treinamento';
            }
            this.resetState();
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
            this.geoRenderer.init();
            this.geoRenderer.update();
        });
    }

    updateUI(error = 0, accuracy = 0) {
        const weights = this.perceptron.weights;
        let weightsText = '[]';
        
        if (weights && weights.length > 0) {
            if (this.isGeoMode && weights.length >= 3) {
                weightsText = `[${weights[0].toFixed(3)}, ${weights[1].toFixed(3)}, ${weights[2].toFixed(3)}]`;
            } else if (!this.isGeoMode && weights.length >= 2) {
                weightsText = `[${weights[0].toFixed(3)}, ${weights[1].toFixed(3)}]`;
            }
        }
            
        document.getElementById('weights').textContent = weightsText;
        document.getElementById('errorRate').textContent = 
            `${(error * 100).toFixed(1)}%`;
        document.getElementById('epochAccuracy').textContent = 
            `${(accuracy * 100).toFixed(1)}%`;
        document.getElementById('epochs').textContent = 
            this.epochs;

        // Atualizar barra de convergência
        const progress = this.perceptron.getConvergenceProgress();
        const convergenceProgress = document.getElementById('convergenceProgress');
        convergenceProgress.style.width = `${progress * 100}%`;
    }

    // Método para adicionar log
    log(message, type = 'info') {
        if (!this.logContainer) return;
        
        const logContent = this.logContainer.querySelector('.log-content');
        if (!logContent) return;
        
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = message;
        logContent.prepend(entry);
        
        // Limitar o número de entradas
        const entries = logContent.querySelectorAll('.log-entry');
        if (entries.length > 10) {
            entries[entries.length - 1].remove();
        }
    }

    updateTrainingLog(epoch, results) {
        const { error, accuracy } = results;
        this.log(`Época ${epoch}: Erro ${(error * 100).toFixed(1)}%, Acurácia ${(accuracy * 100).toFixed(1)}%`, 'training');
    }

    // Método para limpar logs
    clearLogs() {
        if (!this.logContainer) return;
        
        const logContent = this.logContainer.querySelector('.log-content');
        if (logContent) {
            logContent.innerHTML = '';
        }
    }

    setupModeToggle() {
        const modeToggle = document.getElementById('modeToggle');
        if (modeToggle) {
            modeToggle.addEventListener('click', () => this.toggleMode());
            this.updateModeToggle();
        }
    }

    toggleMode() {
        this.isGeoMode = !this.isGeoMode;
        this.updateModeToggle();
        
        // Preservar os pontos ao alternar modos
        const currentPoints = this.isGeoMode ? this.renderer.points : this.geoRenderer.points;
        
        // Resetar o estado com o número correto de pesos
        this.resetState();
        
        // Restaurar os pontos
        if (this.isGeoMode) {
            this.geoRenderer.points = currentPoints;
        } else {
            this.renderer.points = currentPoints;
        }
        
        // Atualizar a classe do container para alternar entre os modos
        const container = document.querySelector('.canvas-container');
        if (this.isGeoMode) {
            container.classList.add('geo-mode');
            this.geoCanvas.style.display = 'block';
            this.canvas.style.display = 'none';
            this.geoRenderer.init();
            this.geoRenderer.setPerceptron(this.perceptron);
            this.geoRenderer.draw();
        } else {
            container.classList.remove('geo-mode');
            this.canvas.style.display = 'block';
            this.geoCanvas.style.display = 'none';
            this.renderer.init();
            this.renderer.setPerceptron(this.perceptron);
            this.renderer.draw();
        }
        
        this.log(`Modo alterado para: ${this.isGeoMode ? 'Geográfico' : 'Cartesiano'}`, 'info');
    }

    updateModeToggle() {
        const modeToggle = document.getElementById('modeToggle');
        if (modeToggle) {
            const icon = modeToggle.querySelector('i');
            const text = modeToggle.querySelector('span');
            
            if (this.isGeoMode) {
                icon.className = 'fas fa-globe';
                text.textContent = 'Modo Geográfico';
                modeToggle.classList.add('active');
            } else {
                icon.className = 'fas fa-chart-line';
                text.textContent = 'Modo Cartesiano';
                modeToggle.classList.remove('active');
            }
        }
    }

    resetState() {
        // Reset perceptron com o número correto de pesos baseado no modo atual
        this.perceptron = new Perceptron(this.isGeoMode ? 3 : 2);
        this.epochs = 0;
        
        // Reset UI
        this.updateUI();
        this.clearLogs();
        
        // Reset autoTrain button
        const autoTrainBtn = document.getElementById('autoTrain');
        autoTrainBtn.innerHTML = '<i class="fas fa-play"></i><span class="btn-label">Auto Treinamento</span>';
        this.isTraining = false;
        if (this.autoTrainInterval) {
            clearInterval(this.autoTrainInterval);
            this.autoTrainInterval = null;
        }

        // Reset convergence bar
        const convergenceProgress = document.getElementById('convergenceProgress');
        convergenceProgress.style.width = '0%';
        
        // Redraw
        if (this.isGeoMode) {
            this.geoRenderer.draw();
        } else {
            this.renderer.draw();
        }
    }

    generateRandomData() {
        const renderer = this.isGeoMode ? this.geoRenderer : this.renderer;
        renderer.generateRandomPoints(50);
        this.log('50 pontos aleatórios gerados', 'info');
    }

    trainOneEpoch() {
        const renderer = this.isGeoMode ? this.geoRenderer : this.renderer;
        if (!renderer.points || renderer.points.length === 0) {
            this.log('Erro: Nenhum ponto para treinar', 'error');
            return;
        }

        this.epochs++;
        const results = this.perceptron.trainEpoch(renderer.points);
        this.updateUI(results.error, results.accuracy);
        renderer.draw();
        this.updateTrainingLog(this.epochs, results);
    }

    autoTrain() {
        const autoTrainBtn = document.getElementById('autoTrain');
        
        if (this.isTraining) {
            // Se já está treinando, pausa
            clearInterval(this.autoTrainInterval);
            this.isTraining = false;
            autoTrainBtn.innerHTML = '<i class="fas fa-play"></i><span class="btn-label">Continuar</span>';
            this.log('Treinamento pausado', 'info');
        } else {
            // Se não está treinando, inicia
            this.isTraining = true;
            autoTrainBtn.innerHTML = '<i class="fas fa-pause"></i><span class="btn-label">Pausar</span>';
            this.log('Iniciando treinamento automático...', 'info');
            
            this.autoTrainInterval = setInterval(() => {
                this.trainOneEpoch();
            }, 1000);
        }
    }

    handleCanvasClick(e) {
        const canvas = this.isGeoMode ? this.geoCanvas : this.canvas;
        const renderer = this.isGeoMode ? this.geoRenderer : this.renderer;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.isGeoMode) {
            const { lat, lon } = this.geoMode.canvasToGeo(x, y);
            const label = Math.random() > 0.5 ? 1 : 0;
            if (!renderer.points) renderer.points = [];
            renderer.points.push({ lat, lon, label });
            renderer.draw();
            this.log(`Ponto adicionado: (${lat.toFixed(1)}°, ${lon.toFixed(1)}°)`, 'info');
        } else {
            const label = y > x ? 1 : 0;
            if (!renderer.points) renderer.points = [];
            renderer.points.push({ x, y, label });
            renderer.draw();
            this.log(`Ponto adicionado: (${x.toFixed(1)}, ${y.toFixed(1)})`, 'info');
        }
    }

    initializeLog() {
        this.logContainer.innerHTML = '';
        this.addLogEntry('info', 'Sistema inicializado', 'O sistema foi iniciado com sucesso.');
    }

    addLogEntry(type, title, content, stats = null) {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        
        const header = document.createElement('div');
        header.className = 'log-header';
        
        const icon = document.createElement('span');
        icon.className = 'log-icon';
        icon.innerHTML = this.getLogIcon(type);
        
        const titleElement = document.createElement('span');
        titleElement.className = 'log-title';
        titleElement.textContent = title;
        
        const time = document.createElement('span');
        time.className = 'log-time';
        time.textContent = new Date().toLocaleTimeString();
        
        header.appendChild(icon);
        header.appendChild(titleElement);
        header.appendChild(time);
        
        const contentElement = document.createElement('div');
        contentElement.className = 'log-content';
        contentElement.textContent = content;
        
        entry.appendChild(header);
        entry.appendChild(contentElement);
        
        if (stats) {
            const statsElement = document.createElement('div');
            statsElement.className = 'training-stats';
            
            Object.entries(stats).forEach(([key, value]) => {
                const stat = document.createElement('div');
                stat.className = 'stat';
                stat.innerHTML = `<strong>${key}:</strong> ${value}`;
                statsElement.appendChild(stat);
            });
            
            entry.appendChild(statsElement);
        }
        
        this.logContainer.insertBefore(entry, this.logContainer.firstChild);
    }

    getLogIcon(type) {
        const icons = {
            'info': 'ℹ️',
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'training': '🎯'
        };
        return icons[type] || icons['info'];
    }

    clearLog() {
        if (!this.logContainer) return;
        
        const logContent = this.logContainer.querySelector('.log-content');
        if (logContent) {
            logContent.innerHTML = '';
        }
    }
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new App();
});

class LogSystem {
    constructor() {
        this.logContainer = document.querySelector('.log-content');
        this.clearButton = document.querySelector('.clear-log');
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.clearButton.addEventListener('click', () => this.clear());
    }

    addEntry(message, type = 'info') {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        
        const timestamp = new Date().toLocaleTimeString();
        const icon = this.getIconForType(type);
        
        entry.innerHTML = `
            <div class="log-icon">${icon}</div>
            <div class="log-message">
                <div class="log-title">${message}</div>
                <div class="log-timestamp">${timestamp}</div>
            </div>
        `;
        
        this.logContainer.appendChild(entry);
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }

    getIconForType(type) {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            error: '❌',
            warning: '⚠️',
            training: '🧠'
        };
        return icons[type] || icons.info;
    }

    clear() {
        this.logContainer.innerHTML = '';
        this.addEntry('Log cleared', 'info');
    }

    info(message) {
        this.addEntry(message, 'info');
    }

    success(message) {
        this.addEntry(message, 'success');
    }

    error(message) {
        this.addEntry(message, 'error');
    }

    warning(message) {
        this.addEntry(message, 'warning');
    }

    training(message) {
        this.addEntry(message, 'training');
    }
}

// Initialize log system
const logSystem = new LogSystem(); 