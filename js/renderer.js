import { Point } from './point.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.points = [];
        this.perceptron = null;
    }

    // Inicialização do canvas
    init() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        this.clear();
    }

    // Limpar o canvas
    clear() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Desenhar a grade de fundo
    drawGrid() {
        this.ctx.strokeStyle = '#eee';
        this.ctx.lineWidth = 1;

        // Linhas verticais
        for (let x = 0; x < this.canvas.width; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // Linhas horizontais
        for (let y = 0; y < this.canvas.height; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    // Desenhar a reta de decisão
    drawDecisionLine() {
        if (!this.perceptron) return;

        const { x1, y1, x2, y2 } = this.perceptron.getDecisionLine(this.canvas.width);
        
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.strokeStyle = '#28a745';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    // Desenhar todos os pontos
    drawPoints() {
        this.points.forEach(point => point.draw(this.ctx));
    }

    // Atualizar a visualização
    update() {
        this.clear();
        this.drawGrid();
        this.drawDecisionLine();
        this.drawPoints();
    }

    // Adicionar um novo ponto
    addPoint(x, y, label) {
        const point = new Point(x, y, label);
        this.points.push(point);
        this.update();
    }

    // Gerar pontos aleatórios
    generateRandomPoints(count) {
        this.points = Point.generateRandomPoints(count, this.canvas.width, this.canvas.height);
        this.update();
    }

    // Atualizar o perceptron
    setPerceptron(perceptron) {
        this.perceptron = perceptron;
        this.update();
    }
} 