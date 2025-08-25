import { CoordinateCalculatorPort, NamingStrategy } from './ports';
import { Rectangle, ImageSize, UVCoordinate } from './domain';

export class UVCoordinateCalculatorService implements CoordinateCalculatorPort {
    calculateUVCoordinates(frames: Rectangle[], imageSize: ImageSize): UVCoordinate[] {
        return frames.map(frame => this.normalizeToUV(frame, imageSize));
    }

    private normalizeToUV(frame: Rectangle, imageSize: ImageSize): UVCoordinate {
        return new UVCoordinate(
            frame.x / imageSize.width,
            frame.y / imageSize.height,
            frame.width / imageSize.width,
            frame.height / imageSize.height
        );
    }
}

export class IndexBasedNamingStrategy implements NamingStrategy {
    generateName(index: number, pattern: string): string {
        return pattern.replace('{index}', index.toString().padStart(3, '0'));
    }
}
