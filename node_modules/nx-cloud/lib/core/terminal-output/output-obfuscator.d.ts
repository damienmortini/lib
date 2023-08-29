export declare class OutputObfuscator {
    private normalizedMaskedProperties;
    constructor(maskedProperties?: string[]);
    obfuscate(terminalOutput: string): string;
    toCamelCase(input: string): string;
}
