"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputObfuscator = void 0;
class OutputObfuscator {
    constructor(maskedProperties = []) {
        this.normalizedMaskedProperties = [];
        // Remove possible duplicates from config
        this.normalizedMaskedProperties = Array.from(new Set(maskedProperties)).map(this.toCamelCase);
    }
    obfuscate(terminalOutput) {
        if (!this.normalizedMaskedProperties.length) {
            return terminalOutput;
        }
        /**
         * Replace instances of a secret key being used as a command flag
         * --secret-key=somekey => --secret-key=********
         * or
         * --secretKey=somekey => --secretKey=********
         */
        this.normalizedMaskedProperties.forEach((secretKey) => {
            const commandFlagPattern = new RegExp(`(--${secretKey}=)[\\S]*`);
            terminalOutput = terminalOutput.replace(commandFlagPattern, '$1********');
        });
        /**
         * Replace instances of a secret key's value that exists in process.env
         * by reverse lookup
         */
        const secretValues = this.normalizedMaskedProperties
            .filter((secretKey) => secretKey in process.env)
            .map((secretKey) => process.env[secretKey]);
        secretValues.forEach((secretValue) => {
            terminalOutput = terminalOutput.replace(secretValue, '********');
        });
        return terminalOutput;
    }
    toCamelCase(input) {
        if (input.indexOf('-') > 1) {
            return input
                .toLowerCase()
                .replace(/-(.)/g, (match, group1) => group1.toUpperCase());
        }
        else {
            return input;
        }
    }
}
exports.OutputObfuscator = OutputObfuscator;
//# sourceMappingURL=output-obfuscator.js.map