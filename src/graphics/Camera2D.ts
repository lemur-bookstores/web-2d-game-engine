import { Vector2 } from '../math/Vector2';

export interface CameraFollowOptions {
    lerp?: number; // smoothing factor [0..1]
    offset?: Vector2;
}

export class Camera2D {
    public position: Vector2 = new Vector2(0, 0);
    public zoom: number = 1;
    public rotation: number = 0; // radians
    public viewport = { x: 0, y: 0, width: 800, height: 600 };
    private target: any = null;
    private followOptions: CameraFollowOptions = { lerp: 1, offset: new Vector2(0, 0) };
    private bounds: { x: number; y: number; width: number; height: number } | null = null;

    constructor(viewportWidth = 800, viewportHeight = 600) {
        this.viewport.width = viewportWidth;
        this.viewport.height = viewportHeight;
    }

    setViewport(width: number, height: number) {
        this.viewport.width = width;
        this.viewport.height = height;
    }

    worldToScreen(worldPos: Vector2): Vector2 {
        // apply camera transform: translate world by camera position and scale
        const x = (worldPos.x - this.position.x) * this.zoom + (this.viewport.width / 2);
        const y = (worldPos.y - this.position.y) * this.zoom + (this.viewport.height / 2);
        return new Vector2(x, y);
    }

    screenToWorld(screenPos: Vector2): Vector2 {
        const x = (screenPos.x - (this.viewport.width / 2)) / this.zoom + this.position.x;
        const y = (screenPos.y - (this.viewport.height / 2)) / this.zoom + this.position.y;
        return new Vector2(x, y);
    }

    follow(target: any, options?: CameraFollowOptions) {
        this.target = target;
        this.followOptions = { ...this.followOptions, ...(options ?? {}) };
    }

    setBounds(rect: { x: number; y: number; width: number; height: number } | null) {
        this.bounds = rect;
    }

    shake(_intensity: number, _duration: number) {
        // Placeholder: implement later
    }

    update(delta: number) {
        if (this.target) {
            const targetPos: Vector2 = this.target.position || this.target;
            const desired = new Vector2(
                targetPos.x + (this.followOptions.offset?.x ?? 0),
                targetPos.y + (this.followOptions.offset?.y ?? 0)
            );

            const lerp = Math.max(0, Math.min(1, this.followOptions.lerp ?? 1));
            this.position.x += (desired.x - this.position.x) * lerp * delta;
            this.position.y += (desired.y - this.position.y) * lerp * delta;

            // clamp to bounds if any
            if (this.bounds) {
                const halfW = this.viewport.width / (2 * this.zoom);
                const halfH = this.viewport.height / (2 * this.zoom);
                this.position.x = Math.max(this.bounds.x + halfW, Math.min(this.position.x, this.bounds.x + this.bounds.width - halfW));
                this.position.y = Math.max(this.bounds.y + halfH, Math.min(this.position.y, this.bounds.y + this.bounds.height - halfH));
            }
        }
    }
}
