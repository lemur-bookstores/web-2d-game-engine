import { Component } from '../ecs/Component';
import { Color } from '../math/Color';

export interface SpriteComponent extends Component {
    type: 'sprite';
    texture: string;
    width: number;
    height: number;
    tint: Color;
    // Coordenadas UV para sprite sheets
    uvX: number;
    uvY: number;
    uvWidth: number;
    uvHeight: number;
    flipX: boolean;
    flipY: boolean;
}

export class Sprite {
    texture: string;
    width: number;
    height: number;
    tint: Color;
    uvX: number;
    uvY: number;
    uvWidth: number;
    uvHeight: number;
    flipX: boolean;
    flipY: boolean;

    constructor(
        texture: string,
        width: number,
        height: number,
        tint: Color = new Color(255, 255, 255, 255)
    ) {
        this.texture = texture;
        this.width = width;
        this.height = height;
        this.tint = tint;
        this.uvX = 0;
        this.uvY = 0;
        this.uvWidth = width;
        this.uvHeight = height;
        this.flipX = false;
        this.flipY = false;
    }

    setUV(x: number, y: number, width: number, height: number): void {
        this.uvX = x;
        this.uvY = y;
        this.uvWidth = width;
        this.uvHeight = height;
    }

    flip(horizontal: boolean = false, vertical: boolean = false): void {
        this.flipX = horizontal;
        this.flipY = vertical;
    }

    setTint(color: Color): void {
        this.tint = color;
    }

    clone(): Sprite {
        const sprite = new Sprite(this.texture, this.width, this.height, this.tint);
        sprite.uvX = this.uvX;
        sprite.uvY = this.uvY;
        sprite.uvWidth = this.uvWidth;
        sprite.uvHeight = this.uvHeight;
        sprite.flipX = this.flipX;
        sprite.flipY = this.flipY;
        return sprite;
    }
}
