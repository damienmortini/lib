"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yargsReportCommand = void 0;
const tslib_1 = require("tslib");
exports.yargsReportCommand = {
    command: 'report',
    describe: 'Reports useful version numbers to copy into the Nx issue template',
    handler: () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        yield (yield Promise.resolve().then(() => require('./report'))).reportHandler();
        process.exit(0);
    }),
};
