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

    // Função para gerar pontos aleatórios
    static generateRandom(width, height) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        // A linha de decisão será y = x, pontos acima da linha são classe 1
        const label = y > x ? 1 : 0;
        return new Point(x, y, label);
    }

    // Função para gerar múltiplos pontos aleatórios
    static generateRandomPoints(count, width, height, isGeo = false) {
        const points = [];
        for (let i = 0; i < count; i++) {
            if (isGeo) {
                // Gerar pontos aleatórios em coordenadas geográficas
                const latitude = Math.random() * 180 - 90; // -90 a 90
                const longitude = Math.random() * 360 - 180; // -180 a 180
                const label = Math.random() > 0.5 ? 1 : 0;
                points.push(new Point(latitude, longitude, label, true));
            } else {
                // Gerar pontos aleatórios em coordenadas cartesianas
                const x = Math.random() * width;
                const y = Math.random() * height;
                const label = Math.random() > 0.5 ? 1 : 0;
                points.push(new Point(x, y, label));
            }
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
} 