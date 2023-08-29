"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unparse = exports.serializeOverrides = void 0;
function serializeOverrides(task) {
    return task.overrides.__overrides_unparsed__
        ? task.overrides.__overrides_unparsed__.join(' ')
        : unparse(task.overrides).join(' ');
}
exports.serializeOverrides = serializeOverrides;
function unparse(options) {
    const unparsed = [];
    for (const key of Object.keys(options)) {
        const value = options[key];
        unparseOption(key, value, unparsed);
    }
    return unparsed;
}
exports.unparse = unparse;
function unparseOption(key, value, unparsed) {
    if (key === '_') {
        unparsed.push(...value);
    }
    else if (value === true) {
        unparsed.push(`--${key}`);
    }
    else if (value === false) {
        unparsed.push(`--no-${key}`);
    }
    else if (Array.isArray(value)) {
        value.forEach((item) => unparseOption(key, item, unparsed));
    }
    else if (typeof value === 'string' &&
        stringShouldBeWrappedIntoQuotes(value)) {
        const sanitized = value.replace(/"/g, String.raw `\"`);
        unparsed.push(`--${key}="${sanitized}"`);
    }
    else if (value != null) {
        unparsed.push(`--${key}=${value}`);
    }
}
function stringShouldBeWrappedIntoQuotes(str) {
    return str.includes(' ') || str.includes('{') || str.includes('"');
}
//# sourceMappingURL=serializer-overrides.js.map