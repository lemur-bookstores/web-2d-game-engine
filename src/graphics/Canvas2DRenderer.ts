import { RenderStrategy } from './Renderer';
import { Texture } from './Texture';
import { Vector2 } from '../math/Vector2';
import { Color } from '../math/Color';

export class Canvas2DRenderer implements RenderStrategy {
    private ctx!: CanvasRenderingContext2D;
    private imageCache = new Map<string, HTMLImageElement>();

    initialize(canvas: HTMLCanvasElement): void {
        this.ctx = canvas.getContext('2d')!;
        if (!this.ctx) {
            throw new Error('Canvas 2D not supported');
        }

        // Optimize canvas rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    clear(): void {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    drawSprite(
        texture: Texture,
        position: Vector2,
        size: Vector2,
        rotation: number = 0,
        tint: Color = new Color(255, 255, 255, 255)
    ): void {
        this.ctx.save();

        // Apply transformations
        this.ctx.translate(position.x, position.y);

        if (rotation !== 0) {
            this.ctx.rotate(rotation);
        }

        // Apply tint if not white
        if (tint.r !== 255 || tint.g !== 255 || tint.b !== 255 || tint.a !== 255) {
            this.ctx.globalAlpha = tint.a / 255;
            this.ctx.globalCompositeOperation = 'multiply';
            this.ctx.fillStyle = `rgb(${tint.r}, ${tint.g}, ${tint.b})`;
        }

        // Draw the sprite
        const image = texture.getImage();
        this.ctx.drawImage(
            image,
            -size.x / 2,
            -size.y / 2,
            size.x,
            size.y
        );

        this.ctx.restore();
    }

    drawSpriteUV(
        texture: Texture,
        position: Vector2,
        size: Vector2,
        uvX: number = 0,
        uvY: number = 0,
        uvWidth: number = texture.width,
        uvHeight: number = texture.height,
        rotation: number = 0,
        flipX: boolean = false,
        flipY: boolean = false,
        tint: Color = new Color(255, 255, 255, 255)
    ): void {
        this.ctx.save();

        // Apply transformations
        this.ctx.translate(position.x, position.y);

        if (rotation !== 0) {
            this.ctx.rotate(rotation);
        }

        // Apply flipping
        let scaleX = 1;
        let scaleY = 1;

        if (flipX) scaleX = -1;
        if (flipY) scaleY = -1;

        if (scaleX !== 1 || scaleY !== 1) {
            this.ctx.scale(scaleX, scaleY);
        }

        // Apply tint if not white
        if (tint.r !== 255 || tint.g !== 255 || tint.b !== 255 || tint.a !== 255) {
            this.ctx.globalAlpha = tint.a / 255;

            // For colored tints, we need to use a more complex approach
            if (tint.r !== 255 || tint.g !== 255 || tint.b !== 255) {
                this.ctx.globalCompositeOperation = 'multiply';
                this.ctx.fillStyle = `rgb(${tint.r}, ${tint.g}, ${tint.b})`;
            }
        }

        // Draw the sprite with UV coordinates (source rectangle)
        const image = texture.getImage();
        this.ctx.drawImage(
            image,
            uvX, uvY, uvWidth, uvHeight,  // Source rectangle
            -size.x / 2, -size.y / 2, size.x, size.y  // Destination rectangle
        );

        this.ctx.restore();
    }

    setBackgroundColor(color: Color): void {
        this.ctx.fillStyle = color.toString();
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    drawRectangle(
        position: Vector2,
        size: Vector2,
        color: Color,
        filled: boolean = true
    ): void {
        this.ctx.save();

        if (filled) {
            this.ctx.fillStyle = color.toString();
            this.ctx.fillRect(
                position.x - size.x / 2,
                position.y - size.y / 2,
                size.x,
                size.y
            );
        } else {
            this.ctx.strokeStyle = color.toString();
            this.ctx.strokeRect(
                position.x - size.x / 2,
                position.y - size.y / 2,
                size.x,
                size.y
            );
        }

        this.ctx.restore();
    }

    drawCircle(
        position: Vector2,
        radius: number,
        color: Color,
        filled: boolean = true
    ): void {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI);

        if (filled) {
            this.ctx.fillStyle = color.toString();
            this.ctx.fill();
        } else {
            this.ctx.strokeStyle = color.toString();
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    drawLine(
        start: Vector2,
        end: Vector2,
        color: Color,
        lineWidth: number = 1
    ): void {
        this.ctx.save();
        this.ctx.strokeStyle = color.toString();
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.stroke();
        this.ctx.restore();
    }

    present(): void {
        // Canvas2D no requiere presentación explícita
        // Pero podríamos hacer flush si fuera necesario
    }

    destroy(): void {
        // Limpiar cache de imágenes
        this.imageCache.clear();
    }

    // Utility methods
    getContext(): CanvasRenderingContext2D {
        return this.ctx;
    }

    setGlobalAlpha(alpha: number): void {
        this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    }

    resetGlobalAlpha(): void {
        this.ctx.globalAlpha = 1;
    }
}
