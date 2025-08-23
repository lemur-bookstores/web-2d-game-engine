import { RenderStrategy } from './Renderer';
import { Texture } from './Texture';
import { Vector2 } from '../math/Vector2';
import { Color } from '../math/Color';

/**
 * Diagnostic renderer that overlays visual debugging information
 */
export class DiagnosticRenderer implements RenderStrategy {
    private ctx!: CanvasRenderingContext2D;
    private diagnosticCanvas!: HTMLCanvasElement;
    private isEnabled: boolean = true;

    initialize(canvas: HTMLCanvasElement): void {
        // Create diagnostic overlay canvas
        this.diagnosticCanvas = document.createElement('canvas');
        this.diagnosticCanvas.width = canvas.width;
        this.diagnosticCanvas.height = canvas.height;
        this.diagnosticCanvas.style.position = 'absolute';
        this.diagnosticCanvas.style.top = canvas.offsetTop + 'px';
        this.diagnosticCanvas.style.left = canvas.offsetLeft + 'px';
        this.diagnosticCanvas.style.pointerEvents = 'none';
        this.diagnosticCanvas.style.zIndex = '1000';
        this.diagnosticCanvas.style.border = '2px solid red';

        // Append to the same parent as the main canvas
        if (canvas.parentElement) {
            canvas.parentElement.appendChild(this.diagnosticCanvas);
        }

        this.ctx = this.diagnosticCanvas.getContext('2d')!;
        if (!this.ctx) {
            throw new Error('Failed to get 2D context for diagnostic canvas');
        }

        console.log('[DiagnosticRenderer] Diagnostic overlay canvas created');
    }

    clear(): void {
        if (this.ctx && this.isEnabled) {
            // Clear the diagnostic canvas completely to allow main rendering to show through
            this.ctx.clearRect(0, 0, this.diagnosticCanvas.width, this.diagnosticCanvas.height);
        }
    }

    drawSprite(
        _texture: Texture,
        position: Vector2,
        size: Vector2,
        _rotation: number = 0,
        _tint: Color = new Color(255, 255, 255, 255)
    ): void {
        if (!this.ctx || !this.isEnabled) return;

        // Draw entity bounding box with thin lines so we can see the texture underneath
        this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)'; // Semi-transparent green
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(
            position.x - size.x / 2,
            position.y - size.y / 2,
            size.x,
            size.y
        );

        // Draw center point (smaller and semi-transparent)
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.7)'; // Semi-transparent red
        this.ctx.fillRect(position.x - 1, position.y - 1, 2, 2);

        // Draw texture name with background for readability
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent black background
        this.ctx.fillRect(position.x - size.x / 2, position.y - size.y / 2 - 15, 60, 12);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; // Semi-transparent white text
        this.ctx.font = '10px Arial';
        this.ctx.fillText(
            'sprite',
            position.x - size.x / 2 + 2,
            position.y - size.y / 2 - 5
        );

        // Draw size info with background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(position.x - size.x / 2, position.y + size.y / 2 + 5, 50, 12);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillText(
            `${size.x}x${size.y}`,
            position.x - size.x / 2 + 2,
            position.y + size.y / 2 + 15
        );

        console.log(`[DiagnosticRenderer] Drew sprite at (${position.x}, ${position.y}) size (${size.x}, ${size.y})`);
    } present(): void {
        // Add diagnostic info overlay
        if (this.ctx && this.isEnabled) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, 10, 200, 60);

            this.ctx.fillStyle = 'white';
            this.ctx.font = '14px Arial';
            this.ctx.fillText('DIAGNOSTIC MODE', 15, 30);
            this.ctx.font = '12px Arial';
            this.ctx.fillText('Green boxes: Entity bounds', 15, 45);
            this.ctx.fillText('Red dots: Entity centers', 15, 60);
        }
    }

    destroy(): void {
        if (this.diagnosticCanvas && this.diagnosticCanvas.parentElement) {
            this.diagnosticCanvas.parentElement.removeChild(this.diagnosticCanvas);
        }
    }

    setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
        if (this.diagnosticCanvas) {
            this.diagnosticCanvas.style.display = enabled ? 'block' : 'none';
        }
    }

    isDebugEnabled(): boolean {
        return this.isEnabled;
    }
}
