"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCommunityPlugins = void 0;
const tslib_1 = require("tslib");
const https_1 = require("https");
const COMMUNITY_PLUGINS_JSON_URL = 'https://raw.githubusercontent.com/nrwl/nx/master/community/approved-plugins.json';
function fetchCommunityPlugins() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const req = (0, https_1.get)(COMMUNITY_PLUGINS_JSON_URL, (res) => {
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    reject(new Error(`Request failed with status code ${res.statusCode}`));
                }
                const data = [];
                res.on('data', (chunk) => {
                    data.push(chunk);
                });
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(Buffer.concat(data).toString('utf-8')));
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            });
            req.on('error', reject);
            req.end();
        });
    });
}
exports.fetchCommunityPlugins = fetchCommunityPlugins;
