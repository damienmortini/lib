"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringifyPnpmLockfile = exports.parsePnpmLockfile = void 0;
const pnpm_normalizer_1 = require("./utils/pnpm-normalizer");
const package_json_1 = require("./utils/package-json");
const object_sort_1 = require("../../../utils/object-sort");
const file_hasher_1 = require("../../../hasher/file-hasher");
function parsePnpmLockfile(lockFileContent, builder) {
    const data = (0, pnpm_normalizer_1.parseAndNormalizePnpmLockfile)(lockFileContent);
    const isV6 = (0, pnpm_normalizer_1.isV6Lockfile)(data);
    // we use key => node map to avoid duplicate work when parsing keys
    const keyMap = new Map();
    addNodes(data, builder, keyMap, isV6);
    addDependencies(data, builder, keyMap, isV6);
}
exports.parsePnpmLockfile = parsePnpmLockfile;
function addNodes(data, builder, keyMap, isV6) {
    const nodes = new Map();
    Object.entries(data.packages).forEach(([key, snapshot]) => {
        findPackageNames(key, snapshot, data).forEach((packageName) => {
            var _a, _b, _c;
            const rawVersion = findVersion(key, packageName);
            const version = parseBaseVersion(rawVersion, isV6);
            // we don't need to keep duplicates, we can just track the keys
            const existingNode = (_a = nodes.get(packageName)) === null || _a === void 0 ? void 0 : _a.get(version);
            if (existingNode) {
                keyMap.set(key, existingNode);
                return;
            }
            const node = {
                type: 'npm',
                name: version ? `npm:${packageName}@${version}` : `npm:${packageName}`,
                data: {
                    version,
                    packageName,
                    hash: ((_b = snapshot.resolution) === null || _b === void 0 ? void 0 : _b['integrity']) ||
                        (0, file_hasher_1.hashArray)(((_c = snapshot.resolution) === null || _c === void 0 ? void 0 : _c['tarball'])
                            ? [snapshot.resolution['tarball']]
                            : [packageName, version]),
                },
            };
            keyMap.set(key, node);
            if (!nodes.has(packageName)) {
                nodes.set(packageName, new Map([[version, node]]));
            }
            else {
                nodes.get(packageName).set(version, node);
            }
        });
    });
    const hoistedDeps = (0, pnpm_normalizer_1.loadPnpmHoistedDepsDefinition)();
    for (const [packageName, versionMap] of nodes.entries()) {
        let hoistedNode;
        if (versionMap.size === 1) {
            hoistedNode = versionMap.values().next().value;
        }
        else {
            const hoistedVersion = getHoistedVersion(hoistedDeps, packageName, isV6);
            hoistedNode = versionMap.get(hoistedVersion);
        }
        if (hoistedNode) {
            hoistedNode.name = `npm:${packageName}`;
        }
        versionMap.forEach((node) => {
            builder.addExternalNode(node);
        });
    }
}
function getHoistedVersion(hoistedDependencies, packageName, isV6) {
    let version = (0, package_json_1.getHoistedPackageVersion)(packageName);
    if (!version) {
        const key = Object.keys(hoistedDependencies).find((k) => k.startsWith(`/${packageName}/`));
        if (key) {
            version = parseBaseVersion(getVersion(key, packageName), isV6);
        }
        else {
            // pnpm might not hoist every package
            // similarly those packages will not be available to be used via import
            return;
        }
    }
    return version;
}
function addDependencies(data, builder, keyMap, isV6) {
    Object.entries(data.packages).forEach(([key, snapshot]) => {
        const node = keyMap.get(key);
        [snapshot.dependencies, snapshot.optionalDependencies].forEach((section) => {
            if (section) {
                Object.entries(section).forEach(([name, versionRange]) => {
                    const version = parseBaseVersion(findVersion(versionRange, name), isV6);
                    const target = builder.graph.externalNodes[`npm:${name}@${version}`] ||
                        builder.graph.externalNodes[`npm:${name}`];
                    if (target) {
                        builder.addStaticDependency(node.name, target.name);
                    }
                });
            }
        });
    });
}
function parseBaseVersion(rawVersion, isV6) {
    return isV6 ? rawVersion.split('(')[0] : rawVersion.split('_')[0];
}
function stringifyPnpmLockfile(graph, rootLockFileContent, packageJson) {
    const data = (0, pnpm_normalizer_1.parseAndNormalizePnpmLockfile)(rootLockFileContent);
    const { lockfileVersion, packages } = data;
    const output = {
        lockfileVersion,
        importers: {
            '.': mapRootSnapshot(packageJson, packages, graph.externalNodes),
        },
        packages: (0, object_sort_1.sortObjectByKeys)(mapSnapshots(data.packages, graph.externalNodes)),
    };
    return (0, pnpm_normalizer_1.stringifyToPnpmYaml)(output);
}
exports.stringifyPnpmLockfile = stringifyPnpmLockfile;
function mapSnapshots(packages, nodes) {
    const result = {};
    Object.values(nodes).forEach((node) => {
        const matchedKeys = findOriginalKeys(packages, node, {
            returnFullKey: true,
        });
        // the package manager doesn't check for types of dependencies
        // so we can safely set all to prod
        matchedKeys.forEach(([key, snapshot]) => {
            snapshot.dev = false;
            result[key] = snapshot;
        });
    });
    return result;
}
function findOriginalKeys(packages, { data: { packageName, version } }, { returnFullKey } = {}) {
    const matchedKeys = [];
    for (const key of Object.keys(packages)) {
        const snapshot = packages[key];
        // standard package
        if (key.startsWith(`/${packageName}/${version}`)) {
            matchedKeys.push([
                returnFullKey ? key : getVersion(key, packageName),
                snapshot,
            ]);
        }
        // tarball package
        if (key === version) {
            matchedKeys.push([version, snapshot]);
        }
        // alias package
        if (versionIsAlias(key, version)) {
            matchedKeys.push([key, snapshot]);
        }
    }
    return matchedKeys;
}
// check if version has a form of npm:packageName@version and
// key starts with /packageName/version
function versionIsAlias(key, versionExpr) {
    const PREFIX = 'npm:';
    if (!versionExpr.startsWith(PREFIX))
        return false;
    const indexOfVersionSeparator = versionExpr.indexOf('@', PREFIX.length + 1);
    const packageName = versionExpr.slice(PREFIX.length, indexOfVersionSeparator);
    const version = versionExpr.slice(indexOfVersionSeparator + 1);
    return key.startsWith(`/${packageName}/${version}`);
}
function mapRootSnapshot(packageJson, packages, nodes) {
    const snapshot = { specifiers: {} };
    [
        'dependencies',
        'optionalDependencies',
        'devDependencies',
        'peerDependencies',
    ].forEach((depType) => {
        if (packageJson[depType]) {
            Object.keys(packageJson[depType]).forEach((packageName) => {
                const version = packageJson[depType][packageName];
                const node = nodes[`npm:${packageName}@${version}`] || nodes[`npm:${packageName}`];
                snapshot.specifiers[packageName] = version;
                // peer dependencies are mapped to dependencies
                let section = depType === 'peerDependencies' ? 'dependencies' : depType;
                snapshot[section] = snapshot[section] || {};
                snapshot[section][packageName] = findOriginalKeys(packages, node)[0][0];
            });
        }
    });
    Object.keys(snapshot).forEach((key) => {
        snapshot[key] = (0, object_sort_1.sortObjectByKeys)(snapshot[key]);
    });
    return snapshot;
}
function findVersion(key, packageName) {
    if (key.startsWith(`/${packageName}/`)) {
        return getVersion(key, packageName);
    }
    // for alias packages prepend with "npm:"
    if (key.startsWith('/')) {
        const aliasName = key.slice(1, key.lastIndexOf('/'));
        const version = getVersion(key, aliasName);
        return `npm:${aliasName}@${version}`;
    }
    // for tarball package the entire key is the version spec
    return key;
}
function findPackageNames(key, snapshot, data) {
    const packageNames = new Set();
    const originalPackageName = extractNameFromKey(key);
    const matchPropValue = (record) => {
        if (!record) {
            return undefined;
        }
        const index = Object.values(record).findIndex((version) => version === key);
        if (index > -1) {
            return Object.keys(record)[index];
        }
        // check if non aliased name is found
        if (record[originalPackageName] &&
            key.startsWith(`/${originalPackageName}/${record[originalPackageName]}`)) {
            return originalPackageName;
        }
    };
    const matchedDependencyName = (importer) => {
        return (matchPropValue(importer.dependencies) ||
            matchPropValue(importer.optionalDependencies) ||
            matchPropValue(importer.peerDependencies));
    };
    // snapshot already has a name
    if (snapshot.name) {
        packageNames.add(snapshot.name);
    }
    // it'a a root dependency
    const rootDependencyName = matchedDependencyName(data.importers['.']) ||
        // only root importers have devDependencies
        matchPropValue(data.importers['.'].devDependencies);
    if (rootDependencyName) {
        packageNames.add(rootDependencyName);
    }
    // find a snapshot that has a dependency that points to this snapshot
    const snapshots = Object.values(data.packages);
    for (let i = 0; i < snapshots.length; i++) {
        const dependencyName = matchedDependencyName(snapshots[i]);
        if (dependencyName) {
            packageNames.add(dependencyName);
        }
    }
    if (packageNames.size === 0) {
        packageNames.add(originalPackageName);
    }
    return Array.from(packageNames);
}
function getVersion(key, packageName) {
    const KEY_NAME_SEPARATOR_LENGTH = 2; // leading and trailing slash
    return key.slice(packageName.length + KEY_NAME_SEPARATOR_LENGTH);
}
function extractNameFromKey(key) {
    // if package name contains org e.g. "/@babel/runtime/7.12.5"
    // we want slice until the third slash
    if (key.startsWith('/@')) {
        // find the position of the '/' after org name
        const startFrom = key.indexOf('/', 1);
        return key.slice(1, key.indexOf('/', startFrom + 1));
    }
    if (key.startsWith('/')) {
        // if package has just a name e.g. "/react/7.12.5..."
        return key.slice(1, key.indexOf('/', 1));
    }
    return key;
}
