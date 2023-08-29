"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMessageSignatureBundle = exports.toDSSEBundle = exports.isCAVerificationOptions = exports.SubjectAlternativeNameType = exports.PublicKeyDetails = exports.HashAlgorithm = exports.Envelope = void 0;
/*
Copyright 2023 The Sigstore Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
const bundle_1 = require("@sigstore/bundle");
const protobuf_specs_1 = require("@sigstore/protobuf-specs");
const util_1 = require("../util");
// Enums from protobuf-specs
// TODO: Move Envelope to "type" export once @sigstore/sign is a thing
var protobuf_specs_2 = require("@sigstore/protobuf-specs");
Object.defineProperty(exports, "Envelope", { enumerable: true, get: function () { return protobuf_specs_2.Envelope; } });
Object.defineProperty(exports, "HashAlgorithm", { enumerable: true, get: function () { return protobuf_specs_2.HashAlgorithm; } });
Object.defineProperty(exports, "PublicKeyDetails", { enumerable: true, get: function () { return protobuf_specs_2.PublicKeyDetails; } });
Object.defineProperty(exports, "SubjectAlternativeNameType", { enumerable: true, get: function () { return protobuf_specs_2.SubjectAlternativeNameType; } });
function isCAVerificationOptions(options) {
    return (options.ctlogOptions !== undefined &&
        (options.signers === undefined ||
            options.signers.$case === 'certificateIdentities'));
}
exports.isCAVerificationOptions = isCAVerificationOptions;
// All of the following functions are used to construct a ValidBundle
// from various types of input. When this code moves into the
// @sigstore/sign package, these functions will be exported from there.
function toDSSEBundle({ envelope, signature, tlogEntry, timestamp, }) {
    return {
        mediaType: bundle_1.BUNDLE_V01_MEDIA_TYPE,
        content: { $case: 'dsseEnvelope', dsseEnvelope: envelope },
        verificationMaterial: toVerificationMaterial({
            signature,
            tlogEntry,
            timestamp,
        }),
    };
}
exports.toDSSEBundle = toDSSEBundle;
function toMessageSignatureBundle({ digest, signature, tlogEntry, timestamp, }) {
    return {
        mediaType: bundle_1.BUNDLE_V01_MEDIA_TYPE,
        content: {
            $case: 'messageSignature',
            messageSignature: {
                messageDigest: {
                    algorithm: protobuf_specs_1.HashAlgorithm.SHA2_256,
                    digest: digest,
                },
                signature: signature.signature,
            },
        },
        verificationMaterial: toVerificationMaterial({
            signature,
            tlogEntry,
            timestamp,
        }),
    };
}
exports.toMessageSignatureBundle = toMessageSignatureBundle;
function toTransparencyLogEntry(entry) {
    /* istanbul ignore next */
    const b64SET = entry.verification?.signedEntryTimestamp || '';
    const set = Buffer.from(b64SET, 'base64');
    const logID = Buffer.from(entry.logID, 'hex');
    const proof = entry.verification?.inclusionProof
        ? toInclusionProof(entry.verification.inclusionProof)
        : undefined;
    // Parse entry body so we can extract the kind and version.
    const bodyJSON = util_1.encoding.base64Decode(entry.body);
    const entryBody = JSON.parse(bodyJSON);
    return {
        inclusionPromise: {
            signedEntryTimestamp: set,
        },
        logIndex: entry.logIndex.toString(),
        logId: {
            keyId: logID,
        },
        integratedTime: entry.integratedTime.toString(),
        kindVersion: {
            kind: entryBody.kind,
            version: entryBody.apiVersion,
        },
        inclusionProof: proof,
        canonicalizedBody: Buffer.from(entry.body, 'base64'),
    };
}
function toInclusionProof(proof) {
    return {
        logIndex: proof.logIndex.toString(),
        rootHash: Buffer.from(proof.rootHash, 'hex'),
        treeSize: proof.treeSize.toString(),
        checkpoint: {
            envelope: proof.checkpoint,
        },
        hashes: proof.hashes.map((h) => Buffer.from(h, 'hex')),
    };
}
function toVerificationMaterial({ signature, tlogEntry, timestamp, }) {
    return {
        content: signature.certificates
            ? toVerificationMaterialx509CertificateChain(signature.certificates)
            : toVerificationMaterialPublicKey(signature.key.id || ''),
        tlogEntries: tlogEntry ? [toTransparencyLogEntry(tlogEntry)] : [],
        timestampVerificationData: timestamp
            ? toTimestampVerificationData(timestamp)
            : undefined,
    };
}
function toVerificationMaterialx509CertificateChain(certificates) {
    return {
        $case: 'x509CertificateChain',
        x509CertificateChain: {
            certificates: certificates.map((c) => ({
                rawBytes: util_1.pem.toDER(c),
            })),
        },
    };
}
function toVerificationMaterialPublicKey(hint) {
    return { $case: 'publicKey', publicKey: { hint } };
}
function toTimestampVerificationData(timestamp) {
    return {
        rfc3161Timestamps: [{ signedTimestamp: timestamp }],
    };
}
