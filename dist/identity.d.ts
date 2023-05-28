import { Settings } from "./settings";
export declare class Identity {
    identity: any;
    key: any;
    popup: any;
    settings: any;
    identityResolve: any;
    identityReject: any;
    getAuthResolve: any;
    getAuthReject: any;
    addContactResolve: any;
    addContactReject: any;
    addGroupResolve: any;
    addGroupReject: any;
    getGraphResolve: any;
    getGraphReject: any;
    getCollectionResolve: any;
    getCollectionReject: any;
    sendMailResolve: any;
    sendMailReject: any;
    getMailResolve: any;
    getMailReject: any;
    graph: any;
    collections: IdentityI.Collections;
    listening: boolean;
    constructor(settings: Settings);
    initListener(): void;
    onIdentity(data: any): void;
    onSignIn(data: any): void;
    onAddContact(data: any): void;
    onAddGroup(data: any): void;
    onGetGraph(data: any): void;
    onGetCollection(data: any): void;
    onSendMail(data: any): void;
    onGetMail(data: any): void;
    reviveUser(wif: string, username: string): Promise<unknown>;
    generateUsernameSignature(key: any, username: string): any;
    generateRid(username_signature1: string, username_signature2: string, collection?: string): any;
    getIdentity(portal: string, identifier: string): Promise<unknown>;
    cloneIdentity(): any;
    identityJson(): string;
    publicKeyToAddress(public_key: string): Promise<string>;
    sha256(hexstr: any): Promise<string>;
    hexToByteArray(s: any): Uint8Array;
    arbuf2hex(buffer: any): Promise<string>;
    toHex(byteArray: any): string;
    toIdentity(identity: IdentityI.Identity): any;
    getAuth(portal: string): Promise<unknown>;
    getSignature(hash: string, portal: string): Promise<unknown>;
    openPortal(options: any): void;
}
export declare namespace IdentityI {
    interface Identity {
        public_key: string;
        username: string;
        username_signature: string;
        parent: {
            public_key: string;
            username: string;
            username_signature: string;
        };
        collection: string;
        key: any;
    }
    interface Collections {
        AFFILIATE: string;
        ASSET: string;
        BID: string;
        CONTACT: string;
        CALENDAR: string;
        CHAT: string;
        CHAT_FILE: string;
        CONTRACT: string;
        CONTRACT_SIGNED: string;
        GROUP: string;
        GROUP_CALENDAR: string;
        GROUP_CHAT: string;
        GROUP_CHAT_FILE_NAME: string;
        GROUP_CHAT_FILE: string;
        GROUP_MAIL: string;
        MAIL: string;
        MARKET: string;
        PERMISSION_REQUEST: string;
        SIGNATURE_REQUEST: string;
        SMART_CONTRACT: string;
        WEB_CHALLENGE_REQUEST: string;
        WEB_CHALLENGE_RESPONSE: string;
        WEB_PAGE: string;
        WEB_PAGE_REQUEST: string;
        WEB_PAGE_RESPONSE: string;
        WEB_SIGNIN_REQUEST: string;
        WEB_SIGNIN_RESPONSE: string;
        [key: string]: string;
    }
}
//# sourceMappingURL=identity.d.ts.map