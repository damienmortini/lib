"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeTrailingSlash = void 0;
function removeTrailingSlash(apiUrl) {
    return apiUrl[apiUrl.length - 1] === '/'
        ? apiUrl.substr(0, apiUrl.length - 1)
        : apiUrl;
}
exports.removeTrailingSlash = removeTrailingSlash;
//# sourceMappingURL=remove-trailing-slash.js.map