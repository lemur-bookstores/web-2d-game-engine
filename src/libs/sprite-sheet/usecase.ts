import { ProcessSpriteSheetRequest, ProcessSpriteSheetResponse, SpriteFrame, ImageSize } from './domain';
import { ImageReaderPort, FrameDetectionPort, CoordinateCalculatorPort, NamingStrategy, SpriteSheetProcessorPort } from './ports';

export class ProcessSpriteSheetUseCase implements SpriteSheetProcessorPort {
    constructor(
        private readonly imageReader: ImageReaderPort,
        private readonly frameDetector: FrameDetectionPort,
        private readonly coordinateCalculator: CoordinateCalculatorPort,
        private readonly namingStrategy: NamingStrategy
    ) { }

    processSprites(request: ProcessSpriteSheetRequest): ProcessSpriteSheetResponse {
        const imageData = this.imageReader.readImage(request.imageSource);
        const frames = this.frameDetector.detectFrames(imageData, request.detectionConfig);
        const imageSize = new ImageSize(imageData.width, imageData.height);
        const uvCoordinates = this.coordinateCalculator.calculateUVCoordinates(frames, imageSize);

        const spriteFrames = uvCoordinates.map((uv, index) =>
            new SpriteFrame(
                this.namingStrategy.generateName(index, request.namingPattern),
                uv.x,
                uv.y,
                uv.width,
                uv.height
            )
        );

        return new ProcessSpriteSheetResponse(spriteFrames);
    }
}
