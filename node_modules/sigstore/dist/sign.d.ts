/// <reference types="node" />
import { SignerFunc } from './types/signature';
import type { Bundle } from '@sigstore/bundle';
import type { CA } from './ca';
import type { Provider } from './identity';
import type { TLog } from './tlog';
import type { TSA } from './tsa';
export interface SignOptions {
    ca: CA;
    tlog: TLog;
    tsa?: TSA;
    identityProviders: Provider[];
    tlogUpload?: boolean;
    signer?: SignerFunc;
}
export declare class Signer {
    private ca;
    private tlog;
    private tsa?;
    private tlogUpload;
    private signer;
    private identityProviders;
    constructor(options: SignOptions);
    signBlob(payload: Buffer): Promise<Bundle>;
    signAttestation(payload: Buffer, payloadType: string): Promise<Bundle>;
    private signWithEphemeralKey;
    private getIdentityToken;
}
