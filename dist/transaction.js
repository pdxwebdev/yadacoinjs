var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "base64-js"], function (require, exports, base64_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Transaction = void 0;
    base64_js_1 = __importDefault(base64_js_1);
    class Transaction {
        constructor(settings, identity) {
            this.info = null;
            this.transaction = null;
            this.key = null;
            this.xhr = null;
            this.rid = null;
            this.callbackurl = null;
            this.blockchainurl = null;
            this.shared_secret = null;
            this.to = null;
            this.prevTxn = null;
            this.txns = null;
            this.resolve = null;
            this.value = null;
            this.username = null;
            this.signatures = null;
            this.settings = settings;
            this.identity = identity;
            this.txnattempts = [12, 5, 4];
            this.cbattempts = [12, 5, 4];
        }
        generateTransaction(info) {
            return __awaiter(this, void 0, void 0, function* () {
                const version = 4;
                this.txnattempts = [12, 5, 4];
                this.cbattempts = [12, 5, 4];
                this.key = this.identity.identity.key;
                this.username = this.identity.identity.username;
                this.recipient_identity = info.recipient_identity;
                this.info = info;
                this.unspent_transaction_override = this.info
                    .unspent_transaction;
                this.blockchainurl = this.info.blockchainurl;
                this.callbackurl = this.info.callbackurl;
                this.to = this.info.to;
                this.value = parseFloat(this.info.value);
                this.transaction = {
                    version: version,
                    rid: this.info.rid,
                    fee: 0.0,
                    outputs: [],
                    requester_rid: typeof this.info.requester_rid == "undefined"
                        ? ""
                        : this.info.requester_rid,
                    requested_rid: typeof this.info.requested_rid == "undefined"
                        ? ""
                        : this.info.requested_rid,
                    time: parseInt((+new Date() / 1000).toString()).toString(),
                    public_key: this.key.getPublic(true, "hex"),
                };
                if (this.info.outputs) {
                    this.transaction.outputs = this.info.outputs;
                }
                if (this.info.dh_public_key && this.info.relationship.dh_private_key) {
                    this.transaction.dh_public_key = this.info.dh_public_key;
                }
                if (this.to) {
                    this.transaction.outputs.push({
                        to: this.to,
                        value: this.value || 0,
                    });
                }
                let transaction_total = 0;
                if (this.transaction.outputs.length > 0) {
                    for (let i = 0; i < this.transaction.outputs.length; i++) {
                        transaction_total += parseFloat(this.transaction.outputs[i].value);
                    }
                    transaction_total += parseFloat(this.transaction.fee);
                }
                else {
                    transaction_total = parseFloat(this.transaction.fee);
                }
                let inputs_hashes_concat = "";
                // if ((this.info.relationship && this.info.relationship.dh_private_key && this.wallet.wallet.balance < transaction_total) /* || this.wallet.wallet.unspent_transactions.length == 0*/) {
                //     reject("not enough money");
                //     return
                // } else {
                //     if (transaction_total > 0) {
                //         var inputs = [];
                //         var input_sum = 0
                //         let unspent_transactions: any;
                //         if(this.unspent_transaction_override) {
                //             unspent_transactions = [this.unspent_transaction_override];
                //         } else {
                //             this.info.relationship = this.info.relationship || {};
                //             unspent_transactions = this.wallet.wallet.unspent_transactions;
                //             unspent_transactions.sort(function (a: any, b: any) {
                //                 if (a.height < b.height)
                //                 return -1
                //                 if (a.height > b.height)
                //                 return 1
                //                 return 0
                //             });
                //         }
                //         let already_added = []
                //         dance:
                //         for (var i=0; i < unspent_transactions.length; i++) {
                //             var unspent_transaction = unspent_transactions[i];
                //             for (var j=0; j < unspent_transaction.outputs.length; j++) {
                //                 var unspent_output = unspent_transaction.outputs[j];
                //                 if (unspent_output.to === this.key.getAddress()) {
                //                     if (already_added.indexOf(unspent_transaction.id) === -1){
                //                         already_added.push(unspent_transaction.id);
                //                         inputs.push({id: unspent_transaction.id});
                //                         input_sum += parseFloat(unspent_output.value);
                //                         console.log(parseFloat(unspent_output.value));
                //                     }
                //                     if (input_sum >= transaction_total) {
                //                         this.transaction.outputs.push({
                //                             to: this.key.getAddress(),
                //                             value: (input_sum - transaction_total)
                //                         })
                //                         break dance;
                //                     }
                //                 }
                //             }
                //         }
                //         if (input_sum < transaction_total) {
                //             return reject('Insufficient funds');
                //         }
                //         this.transaction.inputs = inputs;
                //         var inputs_hashes = [];
                //         for(i=0; i < inputs.length; i++) {
                //             inputs_hashes.push(inputs[i].id);
                //         }
                //         var inputs_hashes_arr = inputs_hashes.sort(function (a, b) {
                //             if (a.toLowerCase() < b.toLowerCase())
                //               return -1
                //             if ( a.toLowerCase() > b.toLowerCase())
                //               return 1
                //             return 0
                //         });
                //         inputs_hashes_concat = inputs_hashes_arr.join('')
                //     }
                // }
                var myAddress = yield this.identity.publicKeyToAddress(this.transaction.public_key);
                var found = false;
                for (var h = 0; h < this.transaction.outputs.length; h++) {
                    if (this.transaction.outputs[h].to == myAddress) {
                        found = true;
                    }
                }
                if (!found) {
                    this.transaction.outputs.push({
                        to: myAddress,
                        value: 0,
                    });
                }
                let outputs_hashes = [];
                this.transaction.outputs.forEach((output) => {
                    outputs_hashes.push(output.to + output.value.toFixed(8));
                });
                var outputs_hashes_arr = outputs_hashes.sort(function (a, b) {
                    if (a.toLowerCase() < b.toLowerCase())
                        return -1;
                    if (a.toLowerCase() > b.toLowerCase())
                        return 1;
                    return 0;
                });
                var outputs_hashes_concat = outputs_hashes_arr.join("");
                if (typeof this.info.relationship === "string") {
                    this.transaction.relationship = this.info.relationship;
                }
                if (this.info.dh_public_key && this.info.relationship.dh_private_key) {
                    // creating new relationship
                    this.transaction.relationship = this.crypt.publicEncrypt(JSON.stringify(this.info.relationship), this.recipient_identity.public_key);
                    var hash = yield this.identity.sha256(this.transaction.public_key +
                        this.transaction.time +
                        this.transaction.dh_public_key +
                        this.transaction.rid +
                        this.transaction.relationship +
                        this.transaction.fee.toFixed(8) +
                        this.transaction.requester_rid +
                        this.transaction.requested_rid +
                        inputs_hashes_concat +
                        outputs_hashes_concat +
                        version);
                }
                else if (this.info.relationship[this.identity.collections.SMART_CONTRACT]) {
                    //creating smart contract instance
                    this.transaction.relationship = this.info.relationship;
                    let smart_contract = this.info.relationship[this.identity.collections.SMART_CONTRACT];
                    if (smart_contract.asset) {
                        smart_contract.asset = this.crypt.shared_encrypt(this.info.shared_secret, JSON.stringify(smart_contract.asset));
                    }
                    if (smart_contract.target) {
                        smart_contract.target = this.crypt.shared_encrypt(this.info.shared_secret, JSON.stringify(smart_contract.target));
                    }
                    this.transaction.relationship[this.identity.collections.SMART_CONTRACT].creator = this.crypt.shared_encrypt(this.info.shared_secret, JSON.stringify(this.transaction.relationship[this.identity.collections.SMART_CONTRACT].creator));
                    var hash = yield this.identity.sha256(this.transaction.public_key +
                        this.transaction.time +
                        this.transaction.rid +
                        //   this.smartContract.toString(this.info.relationship[this.identity.collections.SMART_CONTRACT]) +
                        this.transaction.fee.toFixed(8) +
                        this.transaction.requester_rid +
                        this.transaction.requested_rid +
                        inputs_hashes_concat +
                        outputs_hashes_concat +
                        version);
                }
                else if (this.info.relationship[this.identity.collections.CALENDAR] ||
                    this.info.relationship[this.identity.collections.CHAT] ||
                    this.info.relationship[this.identity.collections.GROUP_CALENDAR] ||
                    this.info.relationship[this.identity.collections.GROUP_CHAT] ||
                    this.info.relationship[this.identity.collections.GROUP_MAIL] ||
                    this.info.relationship[this.identity.collections.MAIL]) {
                    // chat
                    this.transaction.relationship = this.crypt.shared_encrypt(this.info.shared_secret, JSON.stringify(this.info.relationship));
                    hash = yield this.identity.sha256(this.transaction.public_key +
                        this.transaction.time +
                        this.transaction.rid +
                        this.transaction.relationship +
                        this.transaction.fee.toFixed(8) +
                        this.transaction.requester_rid +
                        this.transaction.requested_rid +
                        inputs_hashes_concat +
                        outputs_hashes_concat +
                        version);
                }
                else if (this.info.relationship.data && version === 4) {
                    // chat
                    this.transaction.relationship = this.crypt.shared_encrypt(this.info.shared_secret, JSON.stringify(this.info.relationship));
                    this.transaction.relationship_hash = yield this.identity.sha256(this.transaction.relationship);
                    hash = yield this.identity.sha256(this.transaction.public_key +
                        this.transaction.time +
                        this.transaction.rid +
                        this.transaction.relationship_hash +
                        this.transaction.fee.toFixed(8) +
                        this.transaction.requester_rid +
                        this.transaction.requested_rid +
                        inputs_hashes_concat +
                        outputs_hashes_concat +
                        version);
                }
                else if (this.info.relationship[this.identity.collections.WEB_PAGE_REQUEST]) {
                    // sign in
                    this.transaction.relationship = this.crypt.shared_encrypt(this.info.shared_secret, JSON.stringify(this.info.relationship));
                    hash = yield this.identity.sha256(this.transaction.public_key +
                        this.transaction.time +
                        this.transaction.rid +
                        this.transaction.relationship +
                        this.transaction.fee.toFixed(8) +
                        this.transaction.requester_rid +
                        this.transaction.requested_rid +
                        inputs_hashes_concat +
                        outputs_hashes_concat +
                        version);
                }
                else if (this.info.relationship.wif) {
                    // recovery
                    this.transaction.relationship = this.crypt.shared_encrypt(this.info.shared_secret, JSON.stringify(this.info.relationship));
                    hash = yield this.identity.sha256(this.transaction.public_key +
                        this.transaction.time +
                        this.transaction.rid +
                        this.transaction.relationship +
                        this.transaction.fee.toFixed(8) +
                        this.transaction.requester_rid +
                        this.transaction.requested_rid +
                        inputs_hashes_concat +
                        outputs_hashes_concat +
                        version);
                }
                else if (this.info.relationship[this.identity.collections.GROUP]) {
                    // join or create group
                    if (this.info.relationship[this.identity.collections.GROUP].parent) {
                        this.transaction.relationship = this.crypt.shared_encrypt(this.info.relationship[this.identity.collections.GROUP].parent
                            .username_signature, JSON.stringify(this.info.relationship));
                    }
                    else {
                        this.transaction.relationship = this.crypt.encrypt(this.info.relationship);
                    }
                    hash = yield this.identity.sha256(this.transaction.public_key +
                        this.transaction.time +
                        this.transaction.rid +
                        this.transaction.relationship +
                        this.transaction.fee.toFixed(8) +
                        this.transaction.requester_rid +
                        this.transaction.requested_rid +
                        inputs_hashes_concat +
                        outputs_hashes_concat +
                        version);
                }
                else if (this.info.relationship[this.identity.collections.MARKET]) {
                    // join or create market
                    this.transaction.relationship = this.crypt.encrypt(this.info.relationship);
                    hash = yield this.identity.sha256(this.transaction.public_key +
                        this.transaction.time +
                        this.transaction.rid +
                        this.transaction.relationship +
                        this.transaction.fee.toFixed(8) +
                        this.transaction.requester_rid +
                        this.transaction.requested_rid +
                        inputs_hashes_concat +
                        outputs_hashes_concat +
                        version);
                }
                else if (this.info.relationship[this.identity.collections.AFFILIATE] ||
                    this.info.relationship[this.identity.collections.BID] ||
                    this.info.relationship[this.identity.collections.WEB_CHALLENGE_REQUEST] ||
                    this.info.relationship[this.identity.collections.WEB_CHALLENGE_RESPONSE] ||
                    this.info.relationship[this.identity.collections.WEB_PAGE_REQUEST] ||
                    this.info.relationship[this.identity.collections.WEB_PAGE_RESPONSE] ||
                    this.info.relationship[this.identity.collections.WEB_SIGNIN_REQUEST] ||
                    this.info.relationship[this.identity.collections.WEB_SIGNIN_RESPONSE]) {
                    this.transaction.relationship = this.crypt.shared_encrypt(this.info.shared_secret, JSON.stringify(this.info.relationship));
                    hash = yield this.identity.sha256(this.transaction.public_key +
                        this.transaction.time +
                        this.transaction.rid +
                        this.transaction.relationship +
                        this.transaction.fee.toFixed(8) +
                        this.transaction.requester_rid +
                        this.transaction.requested_rid +
                        inputs_hashes_concat +
                        outputs_hashes_concat +
                        version);
                }
                else if (this.info.relationship[this.identity.collections.WEB_PAGE] ||
                    this.info.relationship[this.identity.collections.ASSET]) {
                    // mypage
                    this.transaction.relationship = this.crypt.encrypt(this.info.relationship);
                    hash = yield this.identity.sha256(this.transaction.public_key +
                        this.transaction.time +
                        this.transaction.rid +
                        this.transaction.relationship +
                        this.transaction.fee.toFixed(8) +
                        this.transaction.requester_rid +
                        this.transaction.requested_rid +
                        inputs_hashes_concat +
                        outputs_hashes_concat +
                        version);
                }
                else {
                    //straight transaction
                    hash = yield this.identity.sha256(this.transaction.public_key +
                        this.transaction.time +
                        (this.transaction.rid || "") +
                        (this.transaction.relationship || "") +
                        this.transaction.fee.toFixed(8) +
                        (this.transaction.requester_rid || "") +
                        (this.transaction.requested_rid || "") +
                        inputs_hashes_concat +
                        outputs_hashes_concat +
                        version);
                }
                this.transaction.hash = hash;
                var attempt = this.txnattempts.pop();
                attempt = this.cbattempts.pop();
                this.transaction.id = this.sign(this.transaction.hash, this.identity);
                if (hash) {
                    return this.transaction;
                }
                return false;
            });
        }
        sendTransaction(txn = null, transactionUrlOverride = undefined) {
            return __awaiter(this, void 0, void 0, function* () {
                const address = yield this.identity.publicKeyToAddress(txn.public_key);
                return new Promise((resolve, reject) => {
                    var url = "";
                    url =
                        (transactionUrlOverride ||
                            this.settings.webServiceURL + "/transaction") +
                            "?username_signature=" +
                            this.identity.identity.username_signature +
                            "&to=" +
                            address +
                            "&username=" +
                            this.username;
                    this.post(url, txn, resolve, reject);
                });
            });
        }
        post(url, txn, resolve, reject) {
            return fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(txn),
            })
                .then((res) => {
                return resolve(res);
            })
                .catch((err) => {
                return reject(err);
            });
        }
        sign(message, identity) {
            var hash = forge.sha256.create().update(message).digest().toHex();
            var der = identity.identity.key.sign(hash).toDER();
            return base64_js_1.default.fromByteArray(der);
        }
    }
    exports.Transaction = Transaction;
});
//# sourceMappingURL=transaction.js.map