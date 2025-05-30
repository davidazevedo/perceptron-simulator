export class GeoMode {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.mapImage = new Image();
        this.mapImage.src = 'assets/world-map.svg';
        this.mapImage.onerror = () => {
            console.error('Failed to load world map image');
            this.mapImage = null;
        };
        this.mapLoaded = false;
        this.mapBounds = {
            minLat: -90,
            maxLat: 90,
            minLon: -180,
            maxLon: 180
        };
        this.loadMap();
    }

    async loadMap() {
        try {
            // Usar o caminho absoluto para o SVG
            const response = await fetch('/assets/world-map.svg');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const svgText = await response.text();
            
            // Criar um blob a partir do SVG
            const blob = new Blob([svgText], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            
            this.mapImage = new Image();
            this.mapImage.onload = () => {
                this.mapLoaded = true;
                URL.revokeObjectURL(url); // Limpar o URL do blob
                this.drawMap();
                console.log('Mapa carregado com sucesso');
            };
            this.mapImage.onerror = (error) => {
                console.error('Erro ao carregar a imagem:', error);
                this.mapLoaded = false;
                this.drawCoordinateGrid();
            };
            
            this.mapImage.src = url;
        } catch (error) {
            console.error('Erro ao carregar o mapa:', error);
            this.mapLoaded = false;
            this.drawCoordinateGrid();
        }
    }

    drawMap() {
        if (!this.mapImage || !this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenhar o mapa
        this.ctx.drawImage(this.mapImage, 0, 0, this.canvas.width, this.canvas.height);
        
        // Desenhar grade
        this.drawGrid();
    }

    drawGrid() {
        if (!this.ctx) return;

        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;

        // Linhas de latitude
        for (let lat = -90; lat <= 90; lat += 30) {
            const y = this.latToY(lat);
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        // Linhas de longitude
        for (let lon = -180; lon <= 180; lon += 30) {
            const x = this.lonToX(lon);
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
    }

    drawPoint(point) {
        const x = this.lonToX(point.lon);
        const y = this.latToY(point.lat);
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = point.label === 1 ? '#4CAF50' : '#F44336';
        this.ctx.fill();
    }

    drawDecisionBoundary(weights, bias) {
        if (!weights || weights.length < 2) return;

        const w1 = weights[0];
        const w2 = weights[1];
        const epsilon = 1e-6;

        if (Math.abs(w2) < epsilon) {
            // Linha vertical
            const x = -bias / w1;
            const xCanvas = this.lonToX(x);
            this.ctx.beginPath();
            this.ctx.moveTo(xCanvas, 0);
            this.ctx.lineTo(xCanvas, this.canvas.height);
            this.ctx.strokeStyle = '#4CAF50';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            return;
        }

        // Calcular pontos para a linha de decisão
        const points = [];
        for (let lat = -90; lat <= 90; lat += 1) {
            const lon = (-w1 * lat - bias) / w2;
            if (lon >= -180 && lon <= 180) {
                const x = this.lonToX(lon);
                const y = this.latToY(lat);
                points.push({ x, y });
            }
        }

        if (points.length > 1) {
            this.ctx.beginPath();
            this.ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                this.ctx.lineTo(points[i].x, points[i].y);
            }
            this.ctx.strokeStyle = '#4CAF50';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }

    latToY(lat) {
        return this.canvas.height * (1 - (lat + 90) / 180);
    }

    lonToX(lon) {
        return this.canvas.width * (lon + 180) / 360;
    }

    yToLat(y) {
        return 90 - (y / this.canvas.height) * 180;
    }

    xToLon(x) {
        return (x / this.canvas.width) * 360 - 180;
    }

    generateRandomPoint() {
        const lat = Math.random() * (this.mapBounds.maxLat - this.mapBounds.minLat) + this.mapBounds.minLat;
        const lon = Math.random() * (this.mapBounds.maxLon - this.mapBounds.minLon) + this.mapBounds.minLon;
        return { lat, lon };
    }

    generateRandomPoints(count) {
        const points = [];
        for (let i = 0; i < count; i++) {
            const { lat, lon } = this.generateRandomPoint();
            const label = Math.random() > 0.5 ? 1 : 0;
            points.push({ lat, lon, label });
        }
        return points;
    }

    geoToCanvas(latitude, longitude) {
        if (!this.mapLoaded || !this.mapImage) {
            return { x: 0, y: 0 };
        }

        // Normalizar as coordenadas para o intervalo [0, 1]
        const normalizedX = (longitude - this.mapBounds.minLon) / (this.mapBounds.maxLon - this.mapBounds.minLon);
        const normalizedY = 1 - (latitude - this.mapBounds.minLat) / (this.mapBounds.maxLat - this.mapBounds.minLat);

        // Calcular a escala e posição do mapa
        const scale = Math.min(
            this.canvas.width / this.mapImage.width,
            this.canvas.height / this.mapImage.height
        );
        const xOffset = (this.canvas.width - this.mapImage.width * scale) / 2;
        const yOffset = (this.canvas.height - this.mapImage.height * scale) / 2;

        // Converter para coordenadas do canvas
        const x = xOffset + normalizedX * this.mapImage.width * scale;
        const y = yOffset + normalizedY * this.mapImage.height * scale;

        return { x, y };
    }

    canvasToGeo(x, y) {
        if (!this.mapLoaded || !this.mapImage) {
            return { lat: 0, lon: 0 };
        }

        // Calcular a escala e posição do mapa
        const scale = Math.min(
            this.canvas.width / this.mapImage.width,
            this.canvas.height / this.mapImage.height
        );
        const xOffset = (this.canvas.width - this.mapImage.width * scale) / 2;
        const yOffset = (this.canvas.height - this.mapImage.height * scale) / 2;

        // Converter de coordenadas do canvas para coordenadas normalizadas
        const normalizedX = (x - xOffset) / (this.mapImage.width * scale);
        const normalizedY = (y - yOffset) / (this.mapImage.height * scale);

        // Converter para coordenadas geográficas
        const longitude = this.mapBounds.minLon + normalizedX * (this.mapBounds.maxLon - this.mapBounds.minLon);
        const latitude = this.mapBounds.minLat + (1 - normalizedY) * (this.mapBounds.maxLat - this.mapBounds.minLat);

        return { lat: latitude, lon: longitude };
    }

    drawPoints(points) {
        points.forEach(point => {
            this.drawPoint(point);
        });
    }
} 