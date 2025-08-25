import { SpriteSheetProcessorFactory } from './factory';
import { ProcessSpriteSheetRequest } from './domain';
import { GridDetectionConfig, DynamicDetectionConfig } from './config';

export class SpriteSheetLibrary {
    static separateByGrid(imageSource: HTMLCanvasElement | ImageData, frameWidth: number, frameHeight: number, options: any = {}) {
        const processor = SpriteSheetProcessorFactory.createGridProcessor();
        const config = new GridDetectionConfig(frameWidth, frameHeight, options.startX, options.startY, options.spacing, options.margin);
        const request = new ProcessSpriteSheetRequest(imageSource, config, options.namingPattern);
        return processor.processSprites(request).frames;
    }

    static separateDynamically(imageSource: HTMLCanvasElement | ImageData, options: any = {}) {
        const processor = SpriteSheetProcessorFactory.createDynamicProcessor();
        const config = new DynamicDetectionConfig(options.alphaThreshold, options.minFrameSize, options.padding);
        const request = new ProcessSpriteSheetRequest(imageSource, config, options.namingPattern);
        return processor.processSprites(request).frames;
    }
}
