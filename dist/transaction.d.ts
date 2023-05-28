import { Settings } from "./settings";
import { GraphI } from "./graph";
import { Identity } from "./identity";
export declare class Transaction {
    info: any;
    transaction: any | null;
    key: any;
    xhr: any;
    rid: any;
    callbackurl: any;
    blockchainurl: any;
    shared_secret: any;
    to: any;
    txnattempts: number[];
    cbattempts: number[];
    prevTxn: any;
    txns: any;
    resolve: any;
    unspent_transaction_override: any;
    value: any;
    username: any;
    signatures: any;
    recipient_identity: any;
    identity: any;
    settings: any;
    crypt: any;
    constructor(settings: Settings, identity: Identity);
    generateTransaction(info: GraphI.TxnParams): Promise<unknown>;
    sendTransaction(txn?: null, transactionUrlOverride?: undefined): Promise<unknown>;
    post(url: string, txn: GraphI.Txn | null, resolve: any, reject: any): Promise<any>;
    get_transaction_id(hash: any, trynum: any): any;
}
//# sourceMappingURL=transaction.d.ts.map