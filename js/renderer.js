import { Point } from './point.js';
import { GeoMode } from './geoMode.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.points = [];
        this.perceptron = null;
        this.tooltip = null;
        this.geoMode = null;
        this.isGeoMode = false;
        this.convergenceBar = {
            width: 200,
            height: 20,
            progress: 0
        };
        this.infoPanel = {
            x: this.canvas.width - 250,
            y: 20,
            width: 230,
            height: 200
        };
        this.animationState = {
            fadeIn: 0,
            fadeOut: 0,
            epochProgress: 0
        };
        this.init();
    }

    // Inicialização do canvas
    init() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        this.points = []; // Garantir que points seja inicializado
        this.clear();

        // Criar tooltip para a reta de decisão
        this.createTooltip();
        
        this.resizeCanvas();
        this.draw();
    }

    // Limpar o canvas
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Desenhar a grade de fundo
    drawGrid(showLabels = true) {
        const gridSize = 50;
        this.ctx.strokeStyle = '#eee';
        this.ctx.lineWidth = 1;

        // Linhas verticais
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // Linhas horizontais
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        if (showLabels) {
            this.ctx.fillStyle = '#333';
            this.ctx.font = '10px Arial';
            
            // Rótulos do eixo X
            for (let x = 0; x < this.canvas.width; x += gridSize) {
                this.ctx.fillText(x.toString(), x + 5, this.canvas.height - 5);
            }
            
            // Rótulos do eixo Y
            for (let y = 0; y < this.canvas.height; y += gridSize) {
                this.ctx.fillText(y.toString(), 5, y - 5);
            }
        }
    }

    // Desenhar a reta de decisão
    drawDecisionLine() {
        if (!this.perceptron) return;

        const { slope, intercept } = this.perceptron.getDecisionLine();
        const weights = this.perceptron.weights;
        const bias = weights[weights.length - 1];
        
        // Calcular pontos para desenhar a linha
        const x1 = 0;
        const y1 = slope * x1 + intercept;
        const x2 = this.canvas.width;
        const y2 = slope * x2 + intercept;
        
        // Desenhar a linha de decisão
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Desenhar o ponto de interceptação (bias)
        this.drawBiasPoint(0, intercept);

        // Adicionar tooltip para a reta de decisão
        this.updateDecisionLineTooltip(slope, intercept, weights, bias);
    }

    drawBiasPoint(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 5, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#FF5722';
        this.ctx.fill();
        this.ctx.strokeStyle = '#333';
        this.ctx.stroke();
    }

    updateDecisionLineTooltip(slope, intercept, weights, bias) {
        if (!this.perceptron || !weights || weights.length < 2) {
            // Se não houver perceptron ou pesos válidos, mostrar valores padrão
            document.getElementById('lineEquation').textContent = 'y = ax + b';
            document.getElementById('weightsInfo').textContent = 'Pesos: [0, 0]';
            document.getElementById('biasInfo').textContent = 'Bias: 0';
            document.getElementById('angleInfo').textContent = 'Ângulo: 0°';
            document.getElementById('distanceInfo').textContent = 'Distância da origem: 0';
            return;
        }

        // Calcular ângulo da reta em graus
        const angle = Math.atan2(weights[1], weights[0]) * (180 / Math.PI);
        
        // Calcular distância da origem
        const distanceFromOrigin = Math.abs(bias) / Math.sqrt(weights[0] * weights[0] + weights[1] * weights[1]);

        // Atualizar conteúdo do tooltip
        if (!isFinite(slope)) {
            document.getElementById('lineEquation').textContent = 'x = constante (reta vertical)';
        } else {
            document.getElementById('lineEquation').textContent = `y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`;
        }
        
        document.getElementById('weightsInfo').textContent = `Pesos: [${weights[0].toFixed(3)}, ${weights[1].toFixed(3)}]`;
        document.getElementById('biasInfo').textContent = `Bias: ${bias.toFixed(3)}`;
        document.getElementById('angleInfo').textContent = `Ângulo: ${angle.toFixed(1)}°`;
        document.getElementById('distanceInfo').textContent = `Distância da origem: ${distanceFromOrigin.toFixed(2)}`;
    }

    createTooltip() {
        this.tooltip = document.getElementById('decisionTooltip');
        this.tooltipContent = this.tooltip.querySelector('.tooltip-content');
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const distance = this.calculateDistanceToLine(x, y);
            if (distance < 15) { // Reduzido para melhor precisão
                this.showTooltip(x, y);
            } else {
                this.hideTooltip();
            }
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });
    }

    showTooltip(x, y) {
        const rect = this.canvas.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();
        
        let tooltipX = x + rect.left + 15; // Offset para não cobrir o cursor
        let tooltipY = y + rect.top + 15;
        
        // Ajustar posição para não sair da tela
        if (tooltipX + tooltipRect.width > window.innerWidth) {
            tooltipX = x + rect.left - tooltipRect.width - 15;
        }
        if (tooltipY + tooltipRect.height > window.innerHeight) {
            tooltipY = y + rect.top - tooltipRect.height - 15;
        }
        
        this.tooltip.style.left = `${tooltipX}px`;
        this.tooltip.style.top = `${tooltipY}px`;
        this.tooltip.style.display = 'block';
    }

    hideTooltip() {
        this.tooltip.style.display = 'none';
    }

    calculateDistanceToLine(x, y) {
        if (!this.perceptron || !this.perceptron.weights) return Infinity;
        
        const w0 = this.perceptron.weights[0];
        const w1 = this.perceptron.weights[1];
        const bias = this.perceptron.bias;
        
        // Convertendo coordenadas do canvas para o espaço normalizado (-1 a 1)
        const normalizedX = (x - this.canvas.width/2) / (this.canvas.width/2);
        const normalizedY = (y - this.canvas.height/2) / (this.canvas.height/2);
        
        // Calculando a distância do ponto à reta
        const distance = Math.abs(w0 * normalizedX + w1 * normalizedY + bias) / 
                        Math.sqrt(w0 * w0 + w1 * w1);
        
        return distance * (this.canvas.width/2); // Convertendo de volta para pixels
    }

    // Desenhar todos os pontos
    drawPoints() {
        if (!this.points) {
            this.points = [];
            return;
        }
        
        this.points.forEach(point => {
            if (this.isGeoMode && this.geoMode) {
                const { x, y } = this.geoMode.geoToCanvas(point.lat, point.lon);
                this.drawPoint(x, y, point.label);
            } else {
                this.drawPoint(point.x, point.y, point.label);
            }
        });
    }

    // Atualizar a visualização
    update() {
        this.draw();
    }

    // Adicionar um novo ponto
    addPoint(x, y, label, isGeo = false) {
        const point = new Point(x, y, label, isGeo);
        this.points.push(point);
        this.draw();
    }

    // Gerar pontos aleatórios
    generateRandomPoints(count) {
        if (!this.points) {
            this.points = [];
        }
        
        for (let i = 0; i < count; i++) {
            if (this.isGeoMode && this.geoMode) {
                const { lat, lon } = this.geoMode.generateRandomPoint();
                const label = Math.random() > 0.5 ? 1 : 0;
                this.points.push(Point.fromRaw(lat, lon, label, true));
            } else {
                const x = Math.random() * this.canvas.width;
                const y = Math.random() * this.canvas.height;
                const label = y > x ? 1 : 0;
                this.points.push(Point.fromRaw(x, y, label));
            }
        }
        this.draw();
    }

    // Atualizar o perceptron
    setPerceptron(perceptron) {
        this.perceptron = perceptron;
        this.draw();
    }

    calculateAccuracy() {
        if (this.points.length === 0) return 0;
        
        let correct = 0;
        for (const point of this.points) {
            const guess = this.perceptron.predict([point.x, point.y]);
            if (guess === point.label) correct++;
        }
        
        return correct / this.points.length;
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        this.clear();
    }

    setMode(isGeoMode) {
        this.isGeoMode = isGeoMode;
        this.clear();
        this.draw();
    }

    setGeoMode(geoMode) {
        this.geoMode = geoMode;
        this.isGeoMode = true;
    }

    draw() {
        // Limpar o canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenhar fundo (grade ou mapa)
        if (this.isGeoMode && this.geoMode) {
            this.geoMode.draw();
        } else {
            this.drawGrid(false);
        }
        
        // Desenhar a linha de decisão primeiro (para ficar atrás dos pontos)
        this.drawDecisionBoundary();
        
        // Desenhar os pontos
        this.drawPoints();
        
        // Desenhar elementos de UI
        this.drawConvergenceBar();
        this.drawInfoPanel();
        this.drawEpochAnimation();
        
        // Atualizar estado da animação
        this.updateAnimationState();
    }

    drawDecisionBoundary() {
        if (!this.perceptron || !this.perceptron.weights || this.perceptron.weights.length < 2) {
            console.warn("Perceptron não inicializado ou com poucos pesos.");
            return;
        }
    
        const weights = this.perceptron.weights;
        const bias = weights[weights.length - 1];
    
        // Garantir que w2 != 0 antes de calcular slope/intercept
        const epsilon = 1e-6;
        const w1 = weights[0];
        const w2 = Math.abs(weights[1]) < epsilon ? epsilon : weights[1];
        const slope = -w1 / w2;
        const intercept = -bias / w2;
    
        // Calcular pontos da linha de decisão
        const x1 = 0;
        const y1 = slope * x1 + intercept;
        const x2 = this.canvas.width;
        const y2 = slope * x2 + intercept;
    
        // Garantir que os pontos estejam dentro do canvas
        const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
        const y1Clamped = clamp(y1, 0, this.canvas.height);
        const y2Clamped = clamp(y2, 0, this.canvas.height);
    
        // Desenhar a linha
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1Clamped);
        this.ctx.lineTo(x2, y2Clamped);
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    
        // Desenhar ponto de interceptação no eixo Y
        this.drawBiasPoint(0, y1Clamped);
    
        // Atualizar tooltip
        this.updateDecisionLineTooltip(slope, intercept, weights, bias);
    }
    
    
    drawInfoPanel() {
        if (!this.perceptron) return;

        const weights = this.perceptron.weights;
        const bias = weights[weights.length - 1];
        const error = this.perceptron.lastError || 0;

        // Desenhar fundo do painel
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(
            this.infoPanel.x,
            this.infoPanel.y,
            this.infoPanel.width,
            this.infoPanel.height
        );

        // Desenhar borda
        this.ctx.strokeStyle = '#333';
        this.ctx.strokeRect(
            this.infoPanel.x,
            this.infoPanel.y,
            this.infoPanel.width,
            this.infoPanel.height
        );

        // Configurar fonte
        this.ctx.fillStyle = '#333';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';

        // Desenhar informações
        let y = this.infoPanel.y + 20;
        const lineHeight = 20;

        // Título do painel
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText('Status do Modelo', this.infoPanel.x + 10, y);
        y += lineHeight;

        // Resetar fonte
        this.ctx.font = '12px Arial';

        // Fórmula atual
        const formula = this.isGeoMode
            ? `w1*lat + w2*lon + b = 0`
            : `w1*x + w2*y + b = 0`;
        this.ctx.fillText(`Fórmula: ${formula}`, this.infoPanel.x + 10, y);
        y += lineHeight;

        // Pesos e Bias
        this.ctx.fillText(`Pesos: [${weights[0].toFixed(3)}, ${weights[1].toFixed(3)}]`, 
            this.infoPanel.x + 10, y);
        y += lineHeight;
        this.ctx.fillText(`Bias: ${bias.toFixed(3)}`, this.infoPanel.x + 10, y);
        y += lineHeight;

        // Métricas de desempenho
        this.ctx.fillText(`Taxa de Erro: ${(error * 100).toFixed(2)}%`, 
            this.infoPanel.x + 10, y);
        y += lineHeight;

        // Barra de progresso da convergência
        const progress = this.perceptron.getConvergenceProgress();
        const progressWidth = this.infoPanel.width - 20;
        const progressHeight = 8;
        
        // Fundo da barra
        this.ctx.fillStyle = '#eee';
        this.ctx.fillRect(
            this.infoPanel.x + 10,
            y,
            progressWidth,
            progressHeight
        );
        
        // Progresso
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(
            this.infoPanel.x + 10,
            y,
            progressWidth * progress,
            progressHeight
        );
        
        // Texto de convergência
        y += lineHeight;
        this.ctx.fillStyle = '#333';
        this.ctx.fillText(`Convergência: ${Math.round(progress * 100)}%`, 
            this.infoPanel.x + 10, y);
    }

    drawEpochAnimation() {
        if (this.animationState.epochProgress > 0) {
            this.ctx.fillStyle = `rgba(76, 175, 80, ${this.animationState.epochProgress})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    updateAnimationState() {
        // Atualizar estado da animação
        if (this.animationState.epochProgress > 0) {
            this.animationState.epochProgress -= 0.05;
        }
    }

    drawPoint(x, y, label) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 5, 0, 2 * Math.PI);
        this.ctx.fillStyle = label === 1 ? 'red' : 'blue';
        this.ctx.fill();
        this.ctx.stroke();
    }

    drawConvergenceBar() {
        if (!this.perceptron) return;

        const progress = this.perceptron.getConvergenceProgress();
        this.convergenceBar.progress = progress;

        // Calcular posição centralizada
        const x = (this.canvas.width - this.convergenceBar.width) / 2;
        const y = 20; // 20px do topo

        // Desenhar fundo da barra
        this.ctx.fillStyle = '#eee';
        this.ctx.fillRect(
            x,
            y,
            this.convergenceBar.width,
            this.convergenceBar.height
        );

        // Desenhar progresso
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(
            x,
            y,
            this.convergenceBar.width * progress,
            this.convergenceBar.height
        );

        // Desenhar borda
        this.ctx.strokeStyle = '#333';
        this.ctx.strokeRect(
            x,
            y,
            this.convergenceBar.width,
            this.convergenceBar.height
        );

        // Desenhar texto centralizado
        this.ctx.fillStyle = '#333';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            `Convergência: ${Math.round(progress * 100)}%`,
            this.canvas.width / 2,
            y + 15
        );
        this.ctx.textAlign = 'left'; // Resetar alinhamento
    }
} 