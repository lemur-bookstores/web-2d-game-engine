export class Texture {
    public readonly width: number;
    public readonly height: number;
    private image: HTMLImageElement;

    constructor(image: HTMLImageElement) {
        this.image = image;
        this.width = image.width;
        this.height = image.height;

        console.log(`[Texture] Created texture with dimensions: ${this.width}x${this.height}, complete: ${image.complete}, src: ${image.src}`);

        if (!image.complete) {
            console.warn(`[Texture] Warning: Image not fully loaded when creating texture!`);
        }
    }

    getImage(): HTMLImageElement {
        return this.image;
    }

    dispose(): void {
        // En WebGL, aquí liberaríamos la textura de la GPU
        // Por ahora solo eliminamos la referencia a la imagen
        (this.image as any) = null;
    }
}
