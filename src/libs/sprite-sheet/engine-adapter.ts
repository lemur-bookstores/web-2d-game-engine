import { SpriteFrame } from './domain';

/**
 * Texture interface compatible with the engine's Texture class
 */
export interface TextureSource {
    width: number;
    height: number;
}

/**
 * Pixel frame format used by the engine's SpriteSheet class
 */
export interface PixelFrame {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Converts normalized UV coordinates (0-1) from the sprite-sheet library
 * to pixel coordinates used by the engine's SpriteSheet class
 */
export function convertNormalizedToPixelFrames(
    texture: TextureSource,
    spriteFrames: SpriteFrame[]
): PixelFrame[] {
    return spriteFrames.map(frame => {
        // Convert normalized coordinates to pixels
        const x = Math.round(frame.uvX * texture.width);
        const y = Math.round(frame.uvY * texture.height);
        let width = Math.round(frame.uvWidth * texture.width);
        let height = Math.round(frame.uvHeight * texture.height);

        // Clamp to texture boundaries to avoid overflow
        width = Math.min(width, texture.width - x);
        height = Math.min(height, texture.height - y);

        // Ensure minimum frame size of 1x1
        width = Math.max(1, width);
        height = Math.max(1, height);

        return { x, y, width, height };
    });
}

/**
 * Creates an ImageData-like object from a canvas element for use with the sprite-sheet library
 */
export function createImageDataFromCanvas(canvas: HTMLCanvasElement): ImageData {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Cannot get 2D context from canvas');
    }
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * Creates a canvas from an image element for processing with the sprite-sheet library
 */
export function createCanvasFromImage(image: HTMLImageElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Cannot get 2D context from canvas');
    }

    ctx.drawImage(image, 0, 0);
    return canvas;
}
