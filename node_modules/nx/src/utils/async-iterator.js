"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLastValueFromAsyncIterableIterator = exports.isAsyncIterator = void 0;
const tslib_1 = require("tslib");
function isAsyncIterator(v) {
    return typeof (v === null || v === void 0 ? void 0 : v[Symbol.asyncIterator]) === 'function';
}
exports.isAsyncIterator = isAsyncIterator;
function getLastValueFromAsyncIterableIterator(i) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let prev;
        let current;
        do {
            prev = current;
            current = yield i.next();
        } while (!current.done);
        return current.value !== undefined || !prev ? current.value : prev.value;
    });
}
exports.getLastValueFromAsyncIterableIterator = getLastValueFromAsyncIterableIterator;
