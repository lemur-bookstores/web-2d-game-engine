import { Texture } from '../graphics';
import { EventSystem } from '../core/EventSystem';
import { ASSET_EVENTS } from '@/types/event-const';

export type AssetType = 'texture' | 'audio' | 'json' | 'text' | 'spritesheet';

// Adjusted AssetLoadEvent type to match ASSET_EVENTS
export interface AssetLoadEvent {
    type: typeof ASSET_EVENTS[keyof typeof ASSET_EVENTS];
    asset: string;
    assetType: AssetType;
    progress?: number;
    error?: Error;
}

export class AssetLoader {
    private static instance: AssetLoader;
    private eventSystem: EventSystem;
    private loadingAssets: Map<string, Promise<any>>;
    private totalAssets: number;
    private loadedAssets: number;

    private constructor() {
        this.eventSystem = EventSystem.getInstance();
        this.loadingAssets = new Map();
        this.totalAssets = 0;
        this.loadedAssets = 0;
    }

    static getInstance(): AssetLoader {
        if (!AssetLoader.instance) {
            AssetLoader.instance = new AssetLoader();
        }
        return AssetLoader.instance;
    }

    async loadTexture(path: string): Promise<Texture> {
        this.trackAsset(path, 'texture');

        try {
            const image = new Image();
            const textureLoadPromise = new Promise<Texture>((resolve, reject) => {
                image.onload = () => {
                    const texture = new Texture(image);
                    this.assetLoaded(path, 'texture');
                    resolve(texture);
                };
                image.onerror = () => {
                    const error = new Error(`Failed to load texture: ${path}`);
                    this.assetError(path, 'texture', error);
                    reject(error);
                };
            });

            image.src = path;
            this.loadingAssets.set(path, textureLoadPromise);
            return textureLoadPromise;
        } catch (error) {
            this.assetError(path, 'texture', error as Error);
            throw error;
        }
    }

    async loadJSON(path: string): Promise<any> {
        this.trackAsset(path, 'json');

        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const json = await response.json();
            this.assetLoaded(path, 'json');
            return json;
        } catch (error) {
            this.assetError(path, 'json', error as Error);
            throw error;
        }
    }

    async loadText(path: string): Promise<string> {
        this.trackAsset(path, 'text');

        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            this.assetLoaded(path, 'text');
            return text;
        } catch (error) {
            this.assetError(path, 'text', error as Error);
            throw error;
        }
    }

    async loadAudio(path: string): Promise<AudioBuffer> {
        this.trackAsset(path, 'audio');

        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const response = await fetch(path);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            this.assetLoaded(path, 'audio');
            return audioBuffer;
        } catch (error) {
            this.assetError(path, 'audio', error as Error);
            throw error;
        }
    }

    private trackAsset(path: string, _type: AssetType): void {
        if (!this.loadingAssets.has(path)) {
            this.totalAssets++;
            this.updateProgress();
        }
    }

    private assetLoaded(path: string, type: AssetType): void {
        this.loadedAssets++;
        this.updateProgress();
        this.eventSystem.emit(ASSET_EVENTS.LOADED, {
            type: ASSET_EVENTS.LOADED,
            asset: path,
            assetType: type
        } as AssetLoadEvent);
    }

    private assetError(path: string, type: AssetType, error: Error): void {
        this.loadedAssets++;
        this.updateProgress();
        this.eventSystem.emit(ASSET_EVENTS.ERROR, {
            type: ASSET_EVENTS.ERROR,
            asset: path,
            assetType: type,
            error
        } as AssetLoadEvent);
    }

    private updateProgress(): void {
        const progress = this.totalAssets > 0 ? this.loadedAssets / this.totalAssets : 1;
        this.eventSystem.emit(ASSET_EVENTS.PROGRESS, {
            type: ASSET_EVENTS.PROGRESS,
            asset: '',
            assetType: 'text',
            progress
        } as AssetLoadEvent);
    }

    async waitForAll(): Promise<void> {
        const promises = Array.from(this.loadingAssets.values());
        await Promise.all(promises);
    }

    reset(): void {
        this.loadingAssets.clear();
        this.totalAssets = 0;
        this.loadedAssets = 0;
    }
}
