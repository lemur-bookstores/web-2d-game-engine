export type PlaybackHandle = {
    id: string;
    sourceNode?: AudioBufferSourceNode;
    gainNode?: GainNode;
};

export class AudioManager {
    private static instance: AudioManager;
    private audioContext: AudioContext | null = null;
    private buffers = new Map<string, AudioBuffer>();
    private playbacks = new Map<string, PlaybackHandle>();
    private groupGains = new Map<string, GainNode>();
    // audio metadata/mappers
    private audioMappers: Array<{
        typeName: string;
        predicate: (v: any) => boolean;
        normalize: (v: any) => any;
        description?: string;
    }> = [];

    registerAudioMapper(typeName: string, predicate: (v: any) => boolean, normalize: (v: any) => any, description?: string): void {
        this.audioMappers.push({ typeName, predicate, normalize, description });
    }

    getRegisteredAudioTypes(): string[] {
        return Array.from(new Set(this.audioMappers.map(m => m.typeName)));
    }

    getAudioMetadata(typeName: string): { type: string; description?: string } | undefined {
        const m = this.audioMappers.find(x => x.typeName === typeName);
        if (!m) return undefined;
        return { type: m.typeName, description: m.description };
    }

    normalizeAudioData(typeName: string, data: any): any {
        for (const m of this.audioMappers) {
            if (m.typeName === typeName || m.predicate(data)) {
                try { return m.normalize(data); } catch (_) { return data; }
            }
        }
        return data;
    }

    private constructor() {
        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.warn('WebAudio API not supported in this environment');
            this.audioContext = null;
        }
    }

    static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    async loadAudio(name: string, url: string): Promise<void> {
        if (!this.audioContext) return Promise.resolve();
        if (this.buffers.has(name)) return Promise.resolve();

        const res = await fetch(url);
        const arrayBuffer = await res.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer.slice(0));
        this.buffers.set(name, audioBuffer);
    }

    play(name: string, opts: { loop?: boolean; volume?: number; group?: string } = {}): PlaybackHandle | null {
        if (!this.audioContext) return null;
        const buffer = this.buffers.get(name);
        if (!buffer) {
            console.warn(`Audio buffer '${name}' not found.`);
            return null;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = !!opts.loop;

        const gain = this.audioContext.createGain();
        gain.gain.value = typeof opts.volume === 'number' ? opts.volume : 1;

        const groupName = opts.group || 'master';
        let groupGain = this.groupGains.get(groupName);
        if (!groupGain) {
            groupGain = this.audioContext.createGain();
            groupGain.gain.value = 1;
            groupGain.connect(this.audioContext.destination);
            this.groupGains.set(groupName, groupGain);
        }

        source.connect(gain);
        gain.connect(groupGain);

        const id = `${name}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const handle: PlaybackHandle = { id, sourceNode: source, gainNode: gain };

        source.onended = () => {
            this.playbacks.delete(id);
        };

        source.start(0);
        this.playbacks.set(id, handle);
        return handle;
    }

    stop(handleOrName: PlaybackHandle | string): void {
        if (!this.audioContext) return;
        if (typeof handleOrName === 'string') {
            // stop by name: stop all playbacks that start with name_
            const prefix = handleOrName + '_';
            for (const [id, handle] of this.playbacks.entries()) {
                if (id.startsWith(prefix) && handle.sourceNode) {
                    try { handle.sourceNode.stop(); } catch { };
                    this.playbacks.delete(id);
                }
            }
        } else {
            const handle = handleOrName as PlaybackHandle;
            if (handle.sourceNode) {
                try { handle.sourceNode.stop(); } catch { }
            }
            this.playbacks.delete(handle.id);
        }
    }

    setGroupVolume(group: string, volume: number): void {
        const gain = this.groupGains.get(group);
        if (gain) gain.gain.value = volume;
    }

    has(name: string): boolean {
        return this.buffers.has(name);
    }
}
