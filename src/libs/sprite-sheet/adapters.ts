import { ImageReaderPort, FrameDetectionPort } from './ports';
import { Rectangle } from './domain';
import { DynamicDetectionConfig, GridDetectionConfig } from './config';
import { ConnectedComponentsAlgorithm } from './algorithms';

export class CanvasImageReaderAdapter implements ImageReaderPort {
    readImage(source: HTMLCanvasElement | ImageData): ImageData {
        // Accept plain ImageData-like objects (useful in Node test env)
        if (source && typeof source === 'object' && 'data' in source && 'width' in source && 'height' in source) {
            return source as ImageData;
        }

        // Otherwise expect a canvas-like element with getContext
        const maybeCanvas = source as any;
        if (maybeCanvas && typeof maybeCanvas.getContext === 'function') {
            const ctx = maybeCanvas.getContext('2d');
            if (!ctx) throw new Error('Cannot get 2D context from canvas');
            return ctx.getImageData(0, 0, maybeCanvas.width, maybeCanvas.height);
        }

        throw new Error('Unsupported image source for CanvasImageReaderAdapter');
    }
}

export class GridFrameDetectionAdapter implements FrameDetectionPort {
    detectFrames(imageData: ImageData, config: any): Rectangle[] {
        if (config.type !== 'grid') throw new Error(`Expected grid config, got ${config.type}`);
        return this.gridSeparation(imageData, config);
    }

    private gridSeparation(imageData: ImageData, config: GridDetectionConfig): Rectangle[] {
        const frames: Rectangle[] = [];
        const { width, height } = imageData;
        const { frameWidth, frameHeight, startX, startY, spacing, margin } = config;

        for (let y = startY + margin; y < height - margin; y += frameHeight + spacing) {
            for (let x = startX + margin; x < width - margin; x += frameWidth + spacing) {
                const actualWidth = Math.min(frameWidth, width - x - margin);
                const actualHeight = Math.min(frameHeight, height - y - margin);
                if (actualWidth > 0 && actualHeight > 0) frames.push(new Rectangle(x, y, actualWidth, actualHeight));
            }
        }
        return frames;
    }
}

export class DynamicFrameDetectionAdapter implements FrameDetectionPort {
    private connectedComponentsAlgorithm = new ConnectedComponentsAlgorithm();

    detectFrames(imageData: ImageData, config: any): Rectangle[] {
        if (config.type !== 'dynamic') throw new Error(`Expected dynamic config, got ${config.type}`);
        return this.dynamicSeparation(imageData, config);
    }

    private dynamicSeparation(imageData: ImageData, config: DynamicDetectionConfig): Rectangle[] {
        const nonTransparentPixels = this.detectNonTransparentPixels(imageData, config.alphaThreshold);
        const components = this.connectedComponentsAlgorithm.findComponents(nonTransparentPixels, imageData.width);

        return components
            .map(component => this.calculateBoundingBox(component, imageData.width))
            .filter(rect => rect.width >= config.minFrameSize && rect.height >= config.minFrameSize)
            .map(rect => this.addPadding(rect, config.padding, imageData.width, imageData.height));
    }

    private detectNonTransparentPixels(imageData: ImageData, threshold: number): Set<number> {
        const pixels = new Set<number>();
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3];
            if (alpha >= threshold) pixels.add(i / 4);
        }
        return pixels;
    }

    private calculateBoundingBox(component: number[], imageWidth: number): Rectangle {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const pixel of component) {
            const x = pixel % imageWidth;
            const y = Math.floor(pixel / imageWidth);
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }
        return new Rectangle(minX, minY, maxX - minX + 1, maxY - minY + 1);
    }

    private addPadding(rect: Rectangle, padding: number, imageWidth: number, imageHeight: number): Rectangle {
        return new Rectangle(
            Math.max(0, rect.x - padding),
            Math.max(0, rect.y - padding),
            Math.min(imageWidth - Math.max(0, rect.x - padding), rect.width + 2 * padding),
            Math.min(imageHeight - Math.max(0, rect.y - padding), rect.height + 2 * padding)
        );
    }
}
