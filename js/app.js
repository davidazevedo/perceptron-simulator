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

        this.init();
    }

    init() {
        // Inicialização do canvas
        this.renderer.init();
        this.renderer.setPerceptron(this.perceptron);

        // Event listeners
        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        // Canvas click event
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const label = y > x ? 1 : 0; // Mesma lógica de classificação dos pontos aleatórios
            this.renderer.addPoint(x, y, label);
        });

        // Botões de controle
        document.getElementById('randomData').addEventListener('click', () => {
            this.renderer.generateRandomPoints(50);
        });

        document.getElementById('trainOneEpoch').addEventListener('click', () => {
            if (this.renderer.points.length === 0) return;
            const { error, accuracy } = this.perceptron.trainEpoch(this.renderer.points);
            this.updateUI(error, accuracy);
            this.renderer.update();
        });

        document.getElementById('trainUntilConvergence').addEventListener('click', async () => {
            if (this.renderer.points.length === 0 || this.isTraining) return;
            
            this.isTraining = true;
            const { epochs, finalError } = this.perceptron.trainUntilConvergence(this.renderer.points);
            
            // Atualização visual durante o treinamento
            for (let i = 0; i < epochs; i++) {
                const { error, accuracy } = this.perceptron.trainEpoch(this.renderer.points);
                this.updateUI(error, accuracy);
                this.renderer.update();
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            this.isTraining = false;
        });

        document.getElementById('reset').addEventListener('click', () => {
            this.perceptron = new Perceptron(this.learningRate);
            this.renderer.setPerceptron(this.perceptron);
            this.renderer.points = [];
            this.renderer.update();
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
    }
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new App();
}); 