import { System } from '../ecs/System';
import { Entity } from '../ecs/Entity';
import { AudioManager } from './AudioManager';

export interface AudioComponent {
    type: 'audio';
    clip: string;
    loop?: boolean;
    volume?: number;
    group?: string;
    autoplay?: boolean;
    _playingHandle?: any;
}

export class AudioSystem extends System {
    requiredComponents = ['audio'];
    private audioManager = AudioManager.getInstance();

    update(entities: Entity[], deltaTime: number): void {
        const audioEntities = this.getEntitiesWithComponents(entities, this.requiredComponents);

        audioEntities.forEach(entity => {
            const audio = entity.getComponent<AudioComponent>('audio');
            if (!audio) return;

            // Autoplay behavior
            if (audio.autoplay && !audio._playingHandle && this.audioManager.has(audio.clip)) {
                const handle = this.audioManager.play(audio.clip, { loop: !!audio.loop, volume: audio.volume, group: audio.group });
                audio._playingHandle = handle;
            }

            // If clip not loaded, try to load lazily (no await here)
            if (!this.audioManager.has(audio.clip)) {
                // best-effort load (fire-and-forget)
                this.audioManager.loadAudio(audio.clip, `assets/${audio.clip}`)
                    .catch(err => console.warn('Failed to load audio', audio.clip, err));
            }
        });
    }

    // Public API convenience methods
    play(entity: Entity): boolean {
        const audio = entity.getComponent<AudioComponent>('audio');
        if (!audio) return false;
        const handle = this.audioManager.play(audio.clip, { loop: !!audio.loop, volume: audio.volume, group: audio.group });
        audio._playingHandle = handle;
        return !!handle;
    }

    stop(entity: Entity): boolean {
        const audio = entity.getComponent<AudioComponent>('audio');
        if (!audio) return false;
        if (audio._playingHandle) {
            this.audioManager.stop(audio._playingHandle);
            audio._playingHandle = undefined;
            return true;
        }
        this.audioManager.stop(audio.clip);
        return true;
    }
}
