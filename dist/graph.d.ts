import { Settings } from "./settings";
import { Identity, IdentityI } from "./identity";
export declare class Graph {
    notifications: any;
    graph: GraphI.Graph;
    keys: GraphI.Keys;
    friends_indexed: GraphI.FriendsIndexed;
    groups_indexed: GraphI.GroupsIndexed;
    stored_secrets: GraphI.StoredSecrets;
    sent_friend_requests_indexed: GraphI.SendFriendRequestsIndexed;
    friend_request_count: number;
    settings: any;
    identity: any;
    crypt: any;
    transaction: any;
    addContactResolve: any;
    constructor(settings: Settings, identity: Identity);
    endpointRequest(endpoint: string, post_data?: {}): Promise<unknown>;
    post(url: string, post_data: any, resolve: any, reject: any): Promise<any>;
    resetGraph(): void;
    refreshFriendsAndGroups(): Promise<unknown>;
    _getMail(ridsoverride: any, collection?: any): Promise<unknown>;
    parseMail(messages: GraphI.TxnParams[], collection?: any): Promise<unknown>;
    prepareMailItems(label: string): {
        sender: any;
        group: IdentityI.Identity | null;
        subject: any;
        body: any;
        datetime: string;
        id: string;
        thread: any;
        message_type: any;
        event_datetime: any;
        skylink: any;
        filename: any;
        rid: string;
    }[];
    prepareMailItem(item: GraphI.Txn, label: string): {
        sender: any;
        group: IdentityI.Identity | null;
        subject: any;
        body: any;
        datetime: string;
        id: string;
        thread: any;
        message_type: any;
        event_datetime: any;
        skylink: any;
        filename: any;
        rid: string;
    };
    generateMessage({ identity, recipient, collection, message, rid, }: any): Promise<any>;
    _sendMail(params: any): Promise<void>;
    addFriend(identity: IdentityI.Identity, rid?: string, requester_rid?: string, requested_rid?: string): any;
    getFriendRequests(rid?: null): Promise<unknown>;
    parseFriendRequests(friend_requests: GraphI.Txn[]): GraphI.Txn[];
    _addGroup(identity: IdentityI.Identity, rid?: string, requester_rid?: string, requested_rid?: string, refresh?: boolean): any;
    getGroups(rid?: null, collectionName?: string, ignoreCache?: boolean): Promise<null | void>;
    parseGroups(groups: any, root?: boolean, collection?: string): Promise<unknown>;
    generateRid(username_signature1: string, username_signature2: string, collection?: IdentityI.Collections | string): any;
    generateRids(identity: IdentityI.Identity, identity2?: IdentityI.Identity | null, collection?: IdentityI.Collections | null): {
        rid: any;
        requested_rid: any;
        requester_rid: any;
    };
    isMe(identity: IdentityI.Identity): boolean;
    isAdded(identity: IdentityI.Identity): boolean;
    isRequested(identity: IdentityI.Identity): boolean;
    isGroup(identity: IdentityI.Identity): boolean | "";
    isChild(identity: IdentityI.Identity): boolean;
    sortInt(list: GraphI.Txn[], key: GraphI.TxnKey, reverse?: boolean): void;
    sortAlpha(list: Generic.DynamicObjectString[], key: string, reverse?: boolean): void;
    toDistinct(list: GraphI.Txn[], key: GraphI.TxnKey): GraphI.Txn[];
    getIdentityFromTxn(item: GraphI.Txn, collection: string | null): IdentityI.Identity | undefined;
    getParentIdentityFromTxn(item: GraphI.Txn, collection: string): {
        public_key: string;
        username: string;
        username_signature: string;
    } | undefined;
    getNewTxnCollection(txn: GraphI.Txn): string | void;
    addContact(contact: any, identity: any, portal: string): Promise<unknown>;
    addGroup(group: any, identity: any, portal: string): Promise<unknown>;
    getGraph(identity: any, portal: string): Promise<unknown>;
    getCollection(collections: any[], portal: string): Promise<unknown>;
    sendMail(params: any, portal: string): Promise<unknown>;
    getMail(identity: any, collection: any, portal: string): Promise<unknown>;
    getSharedSecrets(): Promise<unknown>;
}
export declare namespace GraphI {
    interface Txn {
        public_key: string;
        time: string;
        id: string;
        dh_public_key: string;
        rid: string;
        requested_rid: string;
        requester_rid: string;
        dh_private_key: string;
        relationship: any;
        fee: number | string;
        outputs: any;
        inputs: any;
        version: number;
    }
    interface TxnParams {
        public_key?: string;
        time?: string;
        id?: string;
        dh_public_key?: string;
        rid?: string;
        requested_rid?: string;
        requester_rid?: string;
        dh_private_key?: string;
        shared_secret?: string;
        relationship?: any;
        recipient_identity?: IdentityI.Identity;
        unspent_transaction?: GraphI.Txn;
        fee?: number | string;
        outputs?: any;
        inputs?: any;
        value?: number;
        version?: number;
        to?: string;
        never_expire?: boolean;
        private?: boolean;
    }
    type TxnKey = keyof GraphI.Txn;
    type TxnParamsKey = keyof GraphI.TxnParams;
    interface Relationship {
        dh_private_key: string;
        [collection: string]: IdentityI.Identity | string;
    }
    interface Keys {
        [key: string]: {
            dh_public_keys: string[];
            dh_private_keys: string[];
        };
    }
    interface TxnIndexed {
        [key: string]: GraphI.Txn;
    }
    interface FriendsIndexed {
        [key: string]: GraphI.Txn;
    }
    interface GroupsIndexed {
        [key: string]: GraphI.Txn;
    }
    interface SendFriendRequestsIndexed {
        [key: string]: GraphI.Txn;
    }
    interface Graph {
        mail: GraphI.Txn[];
        groups: GraphI.Txn[];
        files: GraphI.Txn[];
        contacts: GraphI.Txn[];
        friend_requests: GraphI.Txn[];
        sent_friend_requests: GraphI.Txn[];
        [key: string]: GraphI.Txn[];
    }
    interface StoredSecrets {
        [rid: string]: StoredSecret[];
    }
    interface StoredSecret {
        shared_secret: string;
        dh_public_key: string;
        dh_private_key: string;
        rid: string;
    }
}
declare namespace Generic {
    interface DynamicObjectNumber {
        [key: string]: number;
    }
    interface DynamicObjectString {
        [key: string]: string;
    }
    interface DynamicObjectObjectString {
        [key: string]: {
            [key: string]: string;
        };
    }
}
export {};
//# sourceMappingURL=graph.d.ts.map