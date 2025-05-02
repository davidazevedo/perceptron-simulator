export class Point {
    constructor(x, y, label, isGeo = false) {
        if (isGeo) {
            this.latitude = x;
            this.longitude = y;
        } else {
            this.x = x;
            this.y = y;
        }
        this.label = label;
        this.isGeo = isGeo;
    }

    // Método estático para criar pontos a partir de coordenadas brutas
    static fromRaw(x, y, label, isGeo = false) {
        return new Point(x, y, label, isGeo);
    }

    // Função para gerar pontos aleatórios
    static generateRandom(width, height, isGeo = false) {
        if (isGeo) {
            const latitude = Math.random() * 180 - 90; // -90 a 90
            const longitude = Math.random() * 360 - 180; // -180 a 180
            const label = Math.random() > 0.5 ? 1 : 0;
            return new Point(latitude, longitude, label, true);
        } else {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const label = y > x ? 1 : 0; // A linha de decisão será y = x
            return new Point(x, y, label);
        }
    }

    // Função para gerar múltiplos pontos aleatórios
    static generateRandomPoints(count, width, height, isGeo = false) {
        const points = [];
        for (let i = 0; i < count; i++) {
            points.push(Point.generateRandom(width, height, isGeo));
        }
        return points;
    }

    // Função para desenhar o ponto no canvas
    draw(ctx, x = this.x, y = this.y) {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = this.label === 1 ? '#4CAF50' : '#FF5252';
        ctx.fill();
    }

    // Método para obter coordenadas em formato array
    toArray() {
        return this.isGeo ? [this.latitude, this.longitude] : [this.x, this.y];
    }
} 