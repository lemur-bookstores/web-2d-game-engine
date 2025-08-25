import { EventSystem } from '../core/EventSystem';
import { AssetLoader, AssetType, AssetLoadEvent } from './AssetLoader';
import { Texture, SpriteSheet } from '../graphics';
import { GameEvent } from '../types';
import { ASSET_EVENTS } from '@/types/event-const';
import { SpriteSheetLibrary, GridDetectionConfig, DynamicDetectionConfig } from '../libs/sprite-sheet';
import { convertNormalizedToPixelFrames, createImageDataFromCanvas, createCanvasFromImage } from '../libs/sprite-sheet/engine-adapter';

interface Asset {
    type: AssetType;
    data: any;
}

interface SpriteSheetLibraryBase {
    useSpriteSheetLib?: boolean;
    namingPattern?: string;
}

interface SpriteSheetLibraryDynamic {
    libraryMode: 'dynamic';
    dynamic?: {
        alphaThreshold?: number;
        minFrameSize?: number;
        padding?: number;
    };
}

interface SpriteSheetLibraryGrid {
    libraryMode: 'grid';
    grid: {
        frameWidth: number;
        frameHeight: number;
        startX?: number;
        startY?: number;
        spacing?: number;
        margin?: number;
    };
}

export type SpriteSheetLibraryOptions = SpriteSheetLibraryDynamic & SpriteSheetLibraryBase | SpriteSheetLibraryGrid & SpriteSheetLibraryBase;

export class AssetManager {
    private static instance: AssetManager;
    private assets: Map<string, Asset>;
    private loader: AssetLoader;
    private eventSystem: EventSystem;

    private constructor() {
        this.assets = new Map();
        this.loader = AssetLoader.getInstance();
        this.eventSystem = EventSystem.getInstance();
        this.setupEventListeners();
    }

    static getInstance(): AssetManager {
        if (!AssetManager.instance) {
            AssetManager.instance = new AssetManager();
        }
        return AssetManager.instance;
    }

    private setupEventListeners(): void {
        this.eventSystem.on(ASSET_EVENTS.LOADED, (event: GameEvent) => {
            const assetEvent = event.data as AssetLoadEvent;
            console.log(`Asset loaded: ${assetEvent.asset}`);
        });

        this.eventSystem.on(ASSET_EVENTS.ERROR, (event: GameEvent) => {
            const assetEvent = event.data as AssetLoadEvent;
            console.error(`Error loading asset: ${assetEvent.asset}`, assetEvent.error);
        });

        this.eventSystem.on(ASSET_EVENTS.PROGRESS, (event: GameEvent) => {
            const assetEvent = event.data as AssetLoadEvent;
            console.log(`Loading progress: ${assetEvent.progress! * 100}%`);
        });
    }

    async loadTexture(name: string, path: string): Promise<Texture> {
        if (this.assets.has(name)) {
            const asset = this.assets.get(name)!;
            if (asset.type === 'texture') {
                return asset.data as Texture;
            }
            throw new Error(`Asset ${name} exists but is not a texture`);
        }

        const texture = await this.loader.loadTexture(path);
        this.assets.set(name, { type: 'texture', data: texture });
        return texture;
    }

    async loadSpriteSheet(
        name: string,
        texturePath: string,
        atlasPath?: string,
        frameWidth?: number,
        frameHeight?: number,
        options?: SpriteSheetLibraryOptions
    ): Promise<SpriteSheet> {
        const texture = await this.loadTexture(`${name}_texture`, texturePath);

        let spriteSheet: SpriteSheet;

        // Use sprite-sheet library if enabled and no atlas path provided
        if (options?.useSpriteSheetLib && !atlasPath) {
            spriteSheet = await this.createSpriteSheetWithLibrary(texture, options);
        } else if (atlasPath) {
            const atlasData = await this.loader.loadJSON(atlasPath);
            spriteSheet = SpriteSheet.fromAtlas(texture, atlasData);
        } else if (frameWidth && frameHeight) {
            spriteSheet = new SpriteSheet(texture, frameWidth, frameHeight);
        } else {
            throw new Error('Must specify either atlas path, frame dimensions, or use sprite-sheet library');
        }

        this.assets.set(name, { type: 'spritesheet', data: spriteSheet });
        return spriteSheet;
    }

    private async createSpriteSheetWithLibrary(
        texture: Texture,
        options: SpriteSheetLibraryOptions
    ): Promise<SpriteSheet> {
        // Create ImageData from texture - we need to get the underlying image data
        // For now, we'll assume the texture has an image property or canvas
        // In a real implementation, this might need to be handled differently
        // depending on how Texture is implemented
        const imageData = await this.createImageDataFromTexture(texture);

        let spriteFrames;
        if (options.libraryMode === 'dynamic') {
            const config = new DynamicDetectionConfig(
                options.dynamic?.alphaThreshold,
                options.dynamic?.minFrameSize,
                options.dynamic?.padding
            );
            spriteFrames = SpriteSheetLibrary.separateDynamically(imageData, {
                alphaThreshold: config.alphaThreshold,
                minFrameSize: config.minFrameSize,
                padding: config.padding,
                namingPattern: options.namingPattern,
            });
        } else {
            // Default to grid mode
            if (!options.grid?.frameWidth || !options.grid?.frameHeight) {
                throw new Error('Grid mode requires frameWidth and frameHeight in options.grid');
            }
            const config = new GridDetectionConfig(
                options.grid.frameWidth,
                options.grid.frameHeight,
                options.grid.startX,
                options.grid.startY,
                options.grid.spacing,
                options.grid.margin
            );
            spriteFrames = SpriteSheetLibrary.separateByGrid(imageData,
                config.frameWidth,
                config.frameHeight,
                {
                    startX: config.startX,
                    startY: config.startY,
                    spacing: config.spacing,
                    margin: config.margin,
                    namingPattern: options.namingPattern,
                }
            );
        }

        // Convert normalized UV coordinates to pixel frames
        const pixelFrames = convertNormalizedToPixelFrames(texture, spriteFrames);

        // Create SpriteSheet from frames
        return SpriteSheet.fromFrames(texture, pixelFrames);
    }

    private async createImageDataFromTexture(texture: Texture): Promise<ImageData> {
        // This is a simplified implementation - in practice, you might need
        // to handle different texture formats or sources differently

        // For browser environment, if texture has an image or canvas source
        if (typeof document !== 'undefined') {
            // Try to get the source image/canvas from texture
            const source = (texture as any).source || (texture as any).image;

            if (source instanceof HTMLImageElement) {
                const canvas = createCanvasFromImage(source);
                return createImageDataFromCanvas(canvas);
            } else if (source instanceof HTMLCanvasElement) {
                return createImageDataFromCanvas(source);
            }
        }

        // Fallback: create a simple ImageData with texture dimensions
        // This won't have actual pixel data, but allows the API to work
        const data = new Uint8ClampedArray(texture.width * texture.height * 4);
        data.fill(255); // Fill with white pixels as fallback

        return {
            width: texture.width,
            height: texture.height,
            data,
        } as ImageData;
    }

    async loadJSON(name: string, path: string): Promise<any> {
        if (this.assets.has(name)) {
            const asset = this.assets.get(name)!;
            if (asset.type === 'json') {
                return asset.data;
            }
            throw new Error(`Asset ${name} exists but is not JSON`);
        }

        const data = await this.loader.loadJSON(path);
        this.assets.set(name, { type: 'json', data });
        return data;
    }

    async loadAudio(name: string, path: string): Promise<AudioBuffer> {
        if (this.assets.has(name)) {
            const asset = this.assets.get(name)!;
            if (asset.type === 'audio') {
                return asset.data as AudioBuffer;
            }
            throw new Error(`Asset ${name} exists but is not audio`);
        }

        const audioBuffer = await this.loader.loadAudio(path);
        this.assets.set(name, { type: 'audio', data: audioBuffer });
        return audioBuffer;
    }

    getTexture(name: string): Texture | undefined {
        const asset = this.assets.get(name);
        if (asset?.type === 'texture') {
            return asset.data as Texture;
        }
        return undefined;
    }

    getSpriteSheet(name: string): SpriteSheet | undefined {
        const asset = this.assets.get(name);
        if (asset?.type === 'spritesheet') {
            return asset.data as SpriteSheet;
        }
        return undefined;
    }

    getJSON(name: string): any | undefined {
        const asset = this.assets.get(name);
        if (asset?.type === 'json') {
            return asset.data;
        }
        return undefined;
    }

    getAudio(name: string): AudioBuffer | undefined {
        const asset = this.assets.get(name);
        if (asset?.type === 'audio') {
            return asset.data as AudioBuffer;
        }
        return undefined;
    }

    unload(name: string): boolean {
        return this.assets.delete(name);
    }

    unloadAll(): void {
        this.assets.clear();
    }

    async preloadAssets(manifest: Array<{ name: string; type: AssetType; path: string }>): Promise<void> {
        const loadPromises = manifest.map(async ({ name, type, path }) => {
            switch (type) {
                case 'texture':
                    await this.loadTexture(name, path);
                    break;
                case 'json':
                    await this.loadJSON(name, path);
                    break;
                case 'audio':
                    await this.loadAudio(name, path);
                    break;
                default:
                    throw new Error(`Unsupported asset type: ${type}`);
            }
        });

        await Promise.all(loadPromises);
    }
}
