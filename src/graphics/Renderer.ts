import { Texture } from './Texture';
import { Vector2 } from '../math/Vector2';
import { Color } from '../math/Color';

export interface RenderStrategy {
    initialize(canvas: HTMLCanvasElement): void;
    clear(): void;
    drawSprite(
        texture: Texture,
        position: Vector2,
        size: Vector2,
        rotation: number,
        tint: Color
    ): void;
    present(): void;
    destroy(): void;
}
