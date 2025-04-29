export class Perceptron {
    constructor(learningRate = 0.1) {
        this.weights = [Math.random() * 2 - 1, Math.random() * 2 - 1];
        this.bias = Math.random() * 2 - 1;
        this.learningRate = learningRate;
    }

    // Função de ativação (step function)
    activate(sum) {
        return sum >= 0 ? 1 : 0;
    }

    // Predição para um ponto
    predict(point) {
        const sum = point.x * this.weights[0] + point.y * this.weights[1] + this.bias;
        return this.activate(sum);
    }

    // Treinamento para um único ponto
    train(point) {
        const prediction = this.predict(point);
        const error = point.label - prediction;

        // Atualização dos pesos
        this.weights[0] += this.learningRate * error * point.x;
        this.weights[1] += this.learningRate * error * point.y;
        this.bias += this.learningRate * error;

        return error;
    }

    // Treinamento para uma época completa
    trainEpoch(points) {
        let totalError = 0;
        let correctPredictions = 0;

        for (const point of points) {
            const error = this.train(point);
            totalError += Math.abs(error);
            if (error === 0) {
                correctPredictions++;
            }
        }

        return {
            error: totalError / points.length,
            accuracy: correctPredictions / points.length
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
    getDecisionLine(canvasWidth) {
        const x1 = 0;
        const y1 = (-this.weights[0] * x1 - this.bias) / this.weights[1];
        const x2 = canvasWidth;
        const y2 = (-this.weights[0] * x2 - this.bias) / this.weights[1];
        return { x1, y1, x2, y2 };
    }
} 