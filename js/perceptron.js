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
        for (let i = 0; i < this.weights.length - 1; i++) {
            sum += this.weights[i] * inputs[i];
        }
        sum += this.weights[this.weights.length - 1]; // Add bias
        return this.activate(sum);
    }

    // Normalização das entradas
    normalize(point) {
        if (this.isGeoMode) {
            // Normalização para coordenadas geográficas
            const lat = point.lat / 90; // Normalize latitude to [-1, 1]
            const lon = point.lon / 180; // Normalize longitude to [-1, 1]
            return [lat, lon];
        } else {
            // Normalização para coordenadas cartesianas
            const x = point.x / 1000;
            const y = point.y / 1000;
            return [x, y];
        }
    }

    // Treinamento para uma época completa
    trainEpoch(points) {
        let errors = 0;
        let totalError = 0;

        for (const point of points) {
            const inputs = this.normalize(point);
            const prediction = this.predict(inputs);
            const error = point.label - prediction;

            if (error !== 0) {
                errors++;
                totalError += Math.abs(error);

                const learningRate = this.learningRate * (1 - Math.abs(error));
                for (let i = 0; i < inputs.length; i++) {
                    this.weights[i] += learningRate * error * inputs[i];
                }
                // Update bias
                this.weights[this.weights.length - 1] += learningRate * error;

                // Clamp weights
                this.weights = this.weights.map(w => Math.max(-1, Math.min(1, w)));
            }
        }

        const errorRate = totalError / points.length;
        const accuracy = 1 - (errors / points.length);
        this.lastError = errorRate;

        return { error: errorRate, accuracy, errors };
    }

    trainUntilConvergence(points, maxEpochs = 1000) {
        let epoch = 0;
        let lastError = Infinity;
        const errorThreshold = 0.001;

        while (epoch < maxEpochs) {
            const { error } = this.trainEpoch(points);
            if (Math.abs(error - lastError) < errorThreshold) break;
            lastError = error;
            epoch++;
        }

        return { epochs: epoch, finalError: lastError };
    }

    getDecisionLine() {
        if (this.isGeoMode) {
            const w1 = this.weights[0];
            const w2 = this.weights[1];
            const bias = this.weights[2];
            return {
                slope: -w1 / w2,
                intercept: -bias / w2
            };
        } else {
            const w1 = this.weights[0];
            const w2 = this.weights[1];
            const bias = this.weights[2];
            return {
                slope: -w1 / w2,
                intercept: -bias / w2
            };
        }
    }

    getConvergenceProgress() {
        return Math.min(1, 1 - this.lastError / this.convergenceThreshold);
    }

    setGeoMode(isGeoMode) {
        this.isGeoMode = isGeoMode;
    }

    resetWeights() {
        const size = this.weights.length;
        this.weights = new Array(size).fill(0).map(() => Math.random() * 2 - 1);
        this.lastError = 1;
    }
}
