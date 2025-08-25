import { ProcessSpriteSheetUseCase } from './usecase';
import { CanvasImageReaderAdapter, GridFrameDetectionAdapter, DynamicFrameDetectionAdapter } from './adapters';
import { UVCoordinateCalculatorService, IndexBasedNamingStrategy } from './services';

export class SpriteSheetProcessorFactory {
    static createGridProcessor() {
        return new ProcessSpriteSheetUseCase(
            new CanvasImageReaderAdapter(),
            new GridFrameDetectionAdapter(),
            new UVCoordinateCalculatorService(),
            new IndexBasedNamingStrategy()
        );
    }

    static createDynamicProcessor() {
        return new ProcessSpriteSheetUseCase(
            new CanvasImageReaderAdapter(),
            new DynamicFrameDetectionAdapter(),
            new UVCoordinateCalculatorService(),
            new IndexBasedNamingStrategy()
        );
    }

    static createCustomProcessor(imageReader: any, frameDetector: any, coordinateCalculator: any, namingStrategy: any) {
        return new ProcessSpriteSheetUseCase(imageReader, frameDetector, coordinateCalculator, namingStrategy);
    }
}
