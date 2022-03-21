import { Identity } from './identity';
export declare class Crypt {
    identity: any;
    constructor(identity: Identity);
    encrypt(message: string): any;
    decrypt(message: string): any;
    publicEncrypt(message: any, public_key: any): string;
    publicDecrypt(message: string): string;
    shared_encrypt(shared_secret: any, message: any): any;
    shared_decrypt(shared_secret: any, message: any): any;
    hexToBytes(s: string): string;
    hexToByteArray(str: any): Uint8Array;
    toHex(byteArray: any): string;
}
//# sourceMappingURL=crypt.d.ts.map