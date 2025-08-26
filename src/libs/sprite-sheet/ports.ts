import { ImageSize, UVCoordinate, Rectangle, ProcessSpriteSheetRequest, ProcessSpriteSheetResponse } from './domain';

export interface SpriteSheetProcessorPort {
    processSprites(request: ProcessSpriteSheetRequest): ProcessSpriteSheetResponse;
}

export interface ImageReaderPort {
    readImage(source: any): ImageData;
}

export interface FrameDetectionPort {
    detectFrames(imageData: ImageData, config: any): Rectangle[];
}

export interface CoordinateCalculatorPort {
    calculateUVCoordinates(frames: Rectangle[], imageSize: ImageSize): UVCoordinate[];
}

export interface NamingStrategy {
    generateName(index: number, pattern: string): string;
}
