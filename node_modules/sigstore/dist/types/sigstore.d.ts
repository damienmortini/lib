/// <reference types="node" />
import { SignatureMaterial } from './signature';
import type { Bundle } from '@sigstore/bundle';
import type { ArtifactVerificationOptions, Envelope, PublicKey, TransparencyLogInstance } from '@sigstore/protobuf-specs';
import type { Entry } from '../external/rekor';
import type { WithRequired } from './utility';
export { Envelope, HashAlgorithm, PublicKeyDetails, SubjectAlternativeNameType, } from '@sigstore/protobuf-specs';
export type { ArtifactVerificationOptions, ArtifactVerificationOptions_CtlogOptions, ArtifactVerificationOptions_TlogOptions, CertificateAuthority, CertificateIdentities, CertificateIdentity, ObjectIdentifierValuePair, PublicKey, SubjectAlternativeName, TransparencyLogInstance, TrustedRoot, } from '@sigstore/protobuf-specs';
export type RequiredArtifactVerificationOptions = WithRequired<ArtifactVerificationOptions, 'ctlogOptions' | 'tlogOptions'>;
export type CAArtifactVerificationOptions = WithRequired<ArtifactVerificationOptions, 'ctlogOptions'> & {
    signers?: Extract<ArtifactVerificationOptions['signers'], {
        $case: 'certificateIdentities';
    }>;
};
export declare function isCAVerificationOptions(options: ArtifactVerificationOptions): options is CAArtifactVerificationOptions;
export type ViableTransparencyLogInstance = TransparencyLogInstance & {
    logId: NonNullable<TransparencyLogInstance['logId']>;
    publicKey: WithRequired<PublicKey, 'rawBytes'>;
};
export declare function toDSSEBundle({ envelope, signature, tlogEntry, timestamp, }: {
    envelope: Envelope;
    signature: SignatureMaterial;
    tlogEntry?: Entry;
    timestamp?: Buffer;
}): Bundle;
export declare function toMessageSignatureBundle({ digest, signature, tlogEntry, timestamp, }: {
    digest: Buffer;
    signature: SignatureMaterial;
    tlogEntry?: Entry;
    timestamp?: Buffer;
}): Bundle;
