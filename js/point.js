export class Point {
    constructor(x, y, label) {
        this.x = x;
        this.y = y;
        this.label = label;
    }

    // Função para gerar pontos aleatórios
    static generateRandom(width, height) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        // A linha de decisão será y = x, pontos acima da linha são classe 1
        const label = y > x ? 1 : 0;
        return new Point(x, y, label);
    }

    // Função para gerar múltiplos pontos aleatórios
    static generateRandomPoints(count, width, height) {
        const points = [];
        for (let i = 0; i < count; i++) {
            points.push(Point.generateRandom(width, height));
        }
        return points;
    }

    // Função para desenhar o ponto no canvas
    draw(ctx, radius = 5) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = this.label === 1 ? '#dc3545' : '#4a6bff';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
} 