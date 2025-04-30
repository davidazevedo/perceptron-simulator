export class GeoMode {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.mapImage = null;
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
            const response = await fetch('assets/world-map.svg');
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
                this.draw();
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

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.mapLoaded && this.mapImage && this.mapImage.complete) {
            const scale = Math.min(
                this.canvas.width / this.mapImage.width,
                this.canvas.height / this.mapImage.height
            );
            const x = (this.canvas.width - this.mapImage.width * scale) / 2;
            const y = (this.canvas.height - this.mapImage.height * scale) / 2;
            
            this.ctx.drawImage(
                this.mapImage,
                x, y,
                this.mapImage.width * scale,
                this.mapImage.height * scale
            );
        }

        this.drawCoordinateGrid();
    }

    drawCoordinateGrid() {
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = 'black';

        // Linhas de latitude
        for (let lat = -90; lat <= 90; lat += 15) {
            const y = this.latitudeToY(lat);
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();

            this.ctx.fillText(`${lat}°`, 5, y - 5);
        }

        // Linhas de longitude
        for (let lon = -180; lon <= 180; lon += 15) {
            const x = this.longitudeToX(lon);
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();

            this.ctx.fillText(`${lon}°`, x + 5, 15);
        }
    }

    latitudeToY(lat) {
        return this.canvas.height * (1 - (lat + 90) / 180);
    }

    longitudeToX(lon) {
        return this.canvas.width * (lon + 180) / 360;
    }

    yToLatitude(y) {
        return 90 - (y / this.canvas.height) * 180;
    }

    xToLongitude(x) {
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

    drawPoint(lat, lon, label) {
        const { x, y } = this.geoToCanvas(lat, lon);
        this.ctx.beginPath();
        this.ctx.arc(x, y, 5, 0, 2 * Math.PI);
        this.ctx.fillStyle = label === 1 ? 'red' : 'blue';
        this.ctx.fill();
        this.ctx.stroke();
    }

    drawPoints(points) {
        points.forEach(point => {
            this.drawPoint(point.lat, point.lon, point.label);
        });
    }
} 