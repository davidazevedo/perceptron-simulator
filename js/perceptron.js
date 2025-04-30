export class Perceptron {
    constructor(inputSize) {
        this.weights = new Array(inputSize + 1).fill(0).map(() => Math.random() * 2 - 1);
        this.learningRate = 0.1;
        this.lastError = 1;
        this.convergenceThreshold = 0.01;
        this.isGeoMode = false;
    }

    // Função de ativação (step function)
    activate(sum) {
        return sum >= 0 ? 1 : 0;
    }

    // Predição para um ponto
    predict(inputs) {
        let sum = 0;
        for (let i = 0; i < this.weights.length; i++) {
            sum += this.weights[i] * inputs[i];
        }
        return this.activate(sum);
    }

    // Treinamento para um único ponto
    train(point) {
        const prediction = this.predict(point);
        const error = point.label - prediction;

        // Atualização dos pesos
        this.weights[0] += this.learningRate * error * point.x;
        this.weights[1] += this.learningRate * error * point.y;
        this.weights[2] += this.learningRate * error;

        return error;
    }

    // Treinamento para uma época completa
    trainEpoch(points) {
        let errors = 0;
        let totalError = 0;

        for (const point of points) {
            // Normalizar as entradas para evitar overflow
            const normalizedX = point.x / 1000;  // Usando um valor fixo para normalização
            const normalizedY = point.y / 1000;
            
            const prediction = this.predict([normalizedX, normalizedY]);
            const error = point.label - prediction;
            
            if (error !== 0) {
                errors++;
                totalError += Math.abs(error);
                
                // Atualizar pesos com taxa de aprendizado adaptativa
                const learningRate = this.learningRate * (1 - Math.abs(error));
                
                // Atualizar pesos com momentum
                this.weights[0] += learningRate * error * normalizedX;
                this.weights[1] += learningRate * error * normalizedY;
                this.weights[2] += learningRate * error;
                
                // Limitar os pesos para evitar overflow
                this.weights = this.weights.map(w => Math.max(-1, Math.min(1, w)));
            }
        }

        // Calcular métricas
        const errorRate = totalError / points.length;
        const accuracy = 1 - (errors / points.length);
        
        // Atualizar último erro
        this.lastError = errorRate;

        return {
            error: errorRate,
            accuracy: accuracy,
            errors: errors
        };
    }

    // Treinamento até convergência
    trainUntilConvergence(points, maxEpochs = 1000) {
        let epoch = 0;
        let lastError = Infinity;
        const errorThreshold = 0.001;

        while (epoch < maxEpochs) {
            const { error, accuracy } = this.trainEpoch(points);
            
            if (Math.abs(error - lastError) < errorThreshold) {
                break;
            }

            lastError = error;
            epoch++;
        }

        return {
            epochs: epoch,
            finalError: lastError
        };
    }

    // Obter a equação da reta de decisão
    getDecisionLine() {
        if (this.isGeoMode) {
            // Para modo geográfico, retornamos os pesos diretamente
            return {
                lat: this.weights[0],
                lon: this.weights[1],
                bias: this.weights[2]
            };
        } else {
            // Para modo cartesiano, calculamos a linha de decisão
            const w1 = this.weights[0];
            const w2 = this.weights[1];
            const bias = this.weights[2];
            
            // A linha de decisão é w1*x + w2*y + bias = 0
            // Podemos reescrever como y = (-w1/w2)*x - (bias/w2)
            return {
                slope: -w1/w2,
                intercept: -bias/w2
            };
        }
    }

    getConvergenceProgress() {
        return Math.min(1, 1 - this.lastError / this.convergenceThreshold);
    }

    setGeoMode(isGeoMode) {
        this.isGeoMode = isGeoMode;
    }
} 