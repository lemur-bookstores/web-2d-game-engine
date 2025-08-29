import { describe, it, expect } from 'vitest';
import { AudioManager } from '../../src/audio/AudioManager';

describe('AudioManager mappers', () => {
    it('can register and expose audio mapper types', () => {
        const am = AudioManager.getInstance();
        am.registerAudioMapper('sfx', (v: any) => v && v.name, (v: any) => ({ name: v.name }));
        const types = am.getRegisteredAudioTypes();
        expect(types).toEqual(expect.arrayContaining(['sfx']));
        const normalized = am.normalizeAudioData('sfx', { name: 'boom' });
        expect(normalized).toHaveProperty('name', 'boom');
    });
});
