export default class GerstnerWave {
    static compute({ x, y, time, direction, steepness, wavelength, speed, }: {
        x?: number;
        y?: number;
        time?: number;
        direction?: number[];
        steepness?: number;
        wavelength?: number;
        speed?: number;
    }): number[];
    constructor({ direction, steepness, wavelength, speed, }: {
        direction?: number[];
        steepness?: number;
        wavelength?: number;
        speed?: number;
    });
    direction: number[];
    steepness: number;
    wavelength: number;
    speed: number;
    get wavenumber(): number;
}
