import { EventSystem } from '../core/EventSystem';
import { AssetLoader, AssetType, AssetLoadEvent } from './AssetLoader';
import { Texture, SpriteSheet } from '../graphics';
import { GameEvent } from '../types';

interface Asset {
    type: AssetType;
    data: any;
}

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
        this.eventSystem.on('assetLoaded', (event: GameEvent) => {
            const assetEvent = event.data as AssetLoadEvent;
            console.log(`Asset loaded: ${assetEvent.asset}`);
        });

        this.eventSystem.on('assetError', (event: GameEvent) => {
            const assetEvent = event.data as AssetLoadEvent;
            console.error(`Error loading asset: ${assetEvent.asset}`, assetEvent.error);
        });

        this.eventSystem.on('assetProgress', (event: GameEvent) => {
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
        frameHeight?: number
    ): Promise<SpriteSheet> {
        const texture = await this.loadTexture(`${name}_texture`, texturePath);

        let spriteSheet: SpriteSheet;
        if (atlasPath) {
            const atlasData = await this.loader.loadJSON(atlasPath);
            spriteSheet = SpriteSheet.fromAtlas(texture, atlasData);
        } else if (frameWidth && frameHeight) {
            spriteSheet = new SpriteSheet(texture, frameWidth, frameHeight);
        } else {
            throw new Error('Must specify either atlas path or frame dimensions');
        }

        this.assets.set(name, { type: 'spritesheet', data: spriteSheet });
        return spriteSheet;
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
