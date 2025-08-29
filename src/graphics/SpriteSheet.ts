import { Texture } from './Texture';
import { v4 as uuidv4 } from 'uuid';

// Atlas JSON types used by fromAtlas / toAtlas helpers
export interface AtlasFrameEntry {
    id?: string;
    frame: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
}

export interface AtlasAnimationEntry {
    frames: Array<number | string>;
    duration?: number;
    loop?: boolean;
    pingPong?: boolean;
}

export interface AtlasData {
    frames: AtlasFrameEntry[];
    animations?: Record<string, AtlasAnimationEntry>;
}

export interface AtlasExport {
    frames: Array<{ id?: string; frame: { x: number; y: number; w: number; h: number } }>;
    animations?: Record<string, { frames: string[]; duration: number; loop: boolean; pingPong: boolean }>;
}

export interface SpriteFrame {
    id?: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Animation {
    name: string;
    frames: number[];
    duration: number;
    loop: boolean;
    pingPong: boolean;
}

export interface SpriteFrameUV {
    size: {
        width: number,
        height: number,
    }
    uv: {
        uvX: number,
        uvY: number,
        uvWidth: number,
        uvHeight: number,
    }
}

export class SpriteSheet {
    private texture: Texture;
    private frames: SpriteFrame[] = [];
    private animations: Map<string, Animation> = new Map();

    constructor(texture: Texture, frameWidth: number, frameHeight: number) {
        this.texture = texture;
        this.generateFrames(frameWidth, frameHeight);
    }

    private generateFrames(frameWidth: number, frameHeight: number): void {
        const cols = Math.floor(this.texture.width / frameWidth);
        const rows = Math.floor(this.texture.height / frameHeight);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                this.frames.push({
                    id: uuidv4(),
                    x: col * frameWidth,
                    y: row * frameHeight,
                    width: frameWidth,
                    height: frameHeight,
                });
            }
        }
    }

    addAnimation(name: string, animation: Animation): void {
        this.animations.set(name, animation);
    }

    getAnimation(name: string): Animation | undefined {
        return this.animations.get(name);
    }

    getFrame(index: number): SpriteFrame | undefined {
        return this.frames[index];
    }

    getFrameCount(): number {
        return this.frames.length;
    }

    getTexture(): Texture {
        return this.texture;
    }

    /**
     * Return a shallow copy of frames array for listing.
     */
    listFrames(): SpriteFrame[] {
        return this.frames.slice();
    }

    /**
     * Add a new frame to the sprite sheet and return its index.
     */
    addFrame(frame: SpriteFrame): number {
        this.frames.push({
            id: frame.id || uuidv4(),
            x: frame.x,
            y: frame.y,
            width: frame.width,
            height: frame.height,
        });
        return this.frames.length - 1;
    }

    /**
     * Update an existing frame. Returns true if updated, false if index invalid.
     */
    updateFrame(index: number, frame: SpriteFrame): boolean {
        if (index < 0 || index >= this.frames.length) return false;
        const existingId = this.frames[index]?.id;
        this.frames[index] = {
            id: existingId || frame.id || uuidv4(),
            x: frame.x,
            y: frame.y,
            width: frame.width,
            height: frame.height,
        };
        return true;
    }

    /**
     * Update only the rectangle values (convenience) for an existing frame.
     */
    updateFrameRect(index: number, x: number, y: number, width: number, height: number): boolean {
        if (index < 0 || index >= this.frames.length) return false;
        const f = this.frames[index];
        f.x = x;
        f.y = y;
        f.width = width;
        f.height = height;
        return true;
    }

    /**
     * Remove a frame by index. Returns true if removed.
     */
    removeFrame(index: number): boolean {
        if (index < 0 || index >= this.frames.length) return false;
        this.frames.splice(index, 1);
        return true;
    }

    static fromAtlas(texture: Texture, atlasData: AtlasData): SpriteSheet {
        // Creamos un SpriteSheet con dimensiones mínimas para inicializar
        const spriteSheet = new SpriteSheet(texture, 1, 1);
        spriteSheet.frames = []; // Limpiamos los frames generados por el constructor

        // Cargamos los frames desde el atlas JSON
        atlasData.frames.forEach((frameData: any) => {
            // Preserve frame id if provided by the atlas, otherwise generate one
            spriteSheet.frames.push({
                id: frameData.id || uuidv4(),
                x: frameData.frame.x,
                y: frameData.frame.y,
                width: frameData.frame.w,
                height: frameData.frame.h,
            });
        });

        // Cargamos las animaciones si existen
        if (atlasData.animations) {
            const animations = atlasData.animations;
            Object.keys(animations).forEach((animName) => {
                const animData = animations[animName];
                // Animations in atlas may reference frames by index or by id (string).
                // Normalize to indices: if a frame reference is a string, look up its index by id.
                const frames: number[] = (animData.frames || []).map((f: any) => {
                    if (typeof f === 'string') {
                        const idx = spriteSheet.frames.findIndex(fr => fr.id === f);
                        return idx >= 0 ? idx : -1;
                    }
                    return typeof f === 'number' ? f : -1;
                }).filter((n: number) => n >= 0);

                spriteSheet.addAnimation(animName, {
                    name: animName,
                    frames,
                    duration: animData.duration || 0.1,
                    loop: animData.loop !== false,
                    pingPong: animData.pingPong || false,
                });
            });
        }

        return spriteSheet;
    }

    static fromFrames(texture: Texture, frames: SpriteFrame[]): SpriteSheet {
        // Create a SpriteSheet with minimal dimensions for initialization
        const spriteSheet = new SpriteSheet(texture, 1, 1);
        spriteSheet.frames = []; // Clear the frames generated by the constructor

        // Set the frames from the provided array
        // Ensure each frame has an id
        spriteSheet.frames = frames.map(f => ({
            id: f.id || uuidv4(),
            x: f.x,
            y: f.y,
            width: f.width,
            height: f.height,
        }));

        return spriteSheet;
    }

    /**
     * Find a frame by its id. Returns the index or -1 if not found.
     */
    findFrameById(id: string): number {
        return this.frames.findIndex(f => f.id === id);
    }

    /**
     * Export an atlas-like object preserving frame ids and referencing animations by frame id.
     */
    toAtlas(): AtlasExport {
        const outFrames = this.frames.map(f => ({
            id: f.id,
            frame: { x: f.x, y: f.y, w: f.width, h: f.height }
        }));

        const outAnimations: Record<string, any> = {};
        this.animations.forEach((anim, name) => {
            // Map frame indices to frame ids
            const frameIds = (anim.frames || []).map(fi => {
                const frame = this.getFrame(fi);
                return frame?.id;
            }).filter(Boolean) as string[];

            outAnimations[name] = {
                frames: frameIds,
                duration: anim.duration,
                loop: anim.loop,
                pingPong: anim.pingPong,
            };
        });

        return { frames: outFrames, animations: outAnimations };
    }

    dispose(): void {
        this.texture.dispose();
        this.frames = [];
        this.animations.clear();
    }

    getSpriteFrameUV(index: number): SpriteFrameUV | undefined {
        const frame = this.getFrame(index);
        const texture = this.getTexture();

        if (!frame) return undefined;

        return {
            size: {
                width: frame.width,
                height: frame.height,
            },
            uv: {
                uvX: frame.x / texture.width,
                uvY: frame.y / texture.height,
                uvWidth: frame.width / texture.width,
                uvHeight: frame.height / texture.height,
            }
        };
    }
}
