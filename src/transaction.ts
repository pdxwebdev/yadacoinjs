import { Settings } from './settings';
import { encrypt, decrypt, PrivateKey } from 'eciesjs'
//import { SmartContract } from './smartContract';
import { Graph, GraphI } from './graph';
import { Identity, IdentityI } from './identity';
import { Crypt } from './crypt';
import { Resolver } from 'dns/promises';


declare var foobar: any;
declare var forge: any;
declare var Base64: any;

export class Transaction {
    info: any = null;
    transaction: any|null = null;
    key: any = null;
    xhr: any = null;
    rid: any = null;
    callbackurl: any = null;
    blockchainurl: any = null;
    shared_secret: any = null;
    to: any = null;
    txnattempts: number[];
    cbattempts: number[];
    prevTxn: any = null;
    txns: any = null;
    resolve: any = null;
    unspent_transaction_override: any;
    value: any = null;
    username: any = null;
    signatures: any = null;
    recipient_identity: any;
    identity: any;
    settings: any;
    crypt: any;
    constructor(
      settings: Settings,
      identity: Identity
    ) {
      this.settings = settings
      this.identity = identity
      this.txnattempts = [12, 5, 4];
      this.cbattempts = [12, 5, 4];
    }

    generateTransaction(info: GraphI.TxnParams) {
        return new Promise((resolve, reject) => {
            const version = 3;
            this.txnattempts = [12, 5, 4];
            this.cbattempts = [12, 5, 4];
            this.key = this.identity.identity.key;
            this.username = this.identity.identity.username;
            this.recipient_identity = (info.recipient_identity as IdentityI.Identity);
            this.info = info;
            this.unspent_transaction_override = (this.info.unspent_transaction as GraphI.Txn);
            this.blockchainurl = this.info.blockchainurl;
            this.callbackurl = this.info.callbackurl;
            this.to = this.info.to;
            this.value = parseFloat(this.info.value);

            this.transaction = {
                version: 3,
                rid:  this.info.rid,
                fee: 0.00,
                outputs: [],
                requester_rid: typeof this.info.requester_rid == 'undefined' ? '' : this.info.requester_rid,
                requested_rid: typeof this.info.requested_rid == 'undefined' ? '' : this.info.requested_rid,
                time: parseInt(((+ new Date()) / 1000).toString()).toString(),
                public_key: this.key.getPublicKeyBuffer().toString('hex')
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
                    value: this.value || 0
                })
            }
            let transaction_total = 0
            if (this.transaction.outputs.length > 0) {
                for(let i=0; i < this.transaction.outputs.length; i++) {
                  transaction_total += parseFloat(this.transaction.outputs[i].value)
                }
                transaction_total += parseFloat((this.transaction.fee as string));
            } else {
                transaction_total = parseFloat((this.transaction.fee as string));
            }
            let inputs_hashes_concat = '';
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
            var myAddress = this.key.getAddress();
            var found = false;
            for (var h=0; h < this.transaction.outputs.length; h++) {
                if (this.transaction.outputs[h].to == myAddress) {
                    found = true;
                }
            }
            if (!found) {
                this.transaction.outputs.push({
                    to: this.key.getAddress(),
                    value: 0
                })
            }

            let outputs_hashes: any = [];
            this.transaction.outputs.forEach((output: any) => {
                outputs_hashes.push(output.to+output.value.toFixed(8));
            })

            var outputs_hashes_arr = outputs_hashes.sort(function (a: string, b: string) {
                if (a.toLowerCase() < b.toLowerCase())
                  return -1
                if ( a.toLowerCase() > b.toLowerCase())
                  return 1
                return 0
            });
            var outputs_hashes_concat = outputs_hashes_arr.join('');
            if (typeof this.info.relationship === 'string') {
              this.transaction.relationship = this.info.relationship;
            }

            if (this.info.dh_public_key && this.info.relationship.dh_private_key) {
                // creating new relationship
                this.transaction.relationship = this.crypt.publicEncrypt(JSON.stringify(this.info.relationship), this.recipient_identity.public_key)
                var hash = foobar.bitcoin.crypto.sha256(
                    this.transaction.public_key +
                    this.transaction.time +
                    this.transaction.dh_public_key +
                    this.transaction.rid +
                    this.transaction.relationship +
                    this.transaction.fee.toFixed(8) +
                    this.transaction.requester_rid +
                    this.transaction.requested_rid +
                    inputs_hashes_concat +
                    outputs_hashes_concat +
                    version
                ).toString('hex')
            } else if (this.info.relationship[this.identity.collections.SMART_CONTRACT]) {
              //creating smart contract instance
              this.transaction.relationship = this.info.relationship;

              let smart_contract = this.info.relationship[this.identity.collections.SMART_CONTRACT];
              if(smart_contract.asset) {
                smart_contract.asset = this.crypt.shared_encrypt(
                  this.info.shared_secret,
                  JSON.stringify(smart_contract.asset)
                )
              }

              if(smart_contract.target) {
                smart_contract.target = this.crypt.shared_encrypt(
                  this.info.shared_secret,
                  JSON.stringify(smart_contract.target)
                )
              }
              this.transaction.relationship[this.identity.collections.SMART_CONTRACT].creator = this.crypt.shared_encrypt(
                this.info.shared_secret,
                JSON.stringify(this.transaction.relationship[this.identity.collections.SMART_CONTRACT].creator)
              )
              var hash = foobar.bitcoin.crypto.sha256(
                  this.transaction.public_key +
                  this.transaction.time +
                  this.transaction.rid +
                //   this.smartContract.toString(this.info.relationship[this.identity.collections.SMART_CONTRACT]) +
                  this.transaction.fee.toFixed(8) +
                  this.transaction.requester_rid +
                  this.transaction.requested_rid +
                  inputs_hashes_concat +
                  outputs_hashes_concat +
                  version
              ).toString('hex')
            } else if (
              this.info.relationship[this.identity.collections.CALENDAR] ||
              this.info.relationship[this.identity.collections.CHAT] ||
              this.info.relationship[this.identity.collections.GROUP_CALENDAR] ||
              this.info.relationship[this.identity.collections.GROUP_CHAT] ||
              this.info.relationship[this.identity.collections.GROUP_MAIL] ||
              this.info.relationship[this.identity.collections.MAIL]
            ) {
                // chat
                this.transaction.relationship = this.crypt.shared_encrypt(this.info.shared_secret, JSON.stringify(this.info.relationship));

                hash = foobar.bitcoin.crypto.sha256(
                    this.transaction.public_key +
                    this.transaction.time +
                    this.transaction.rid +
                    this.transaction.relationship +
                    this.transaction.fee.toFixed(8) +
                    this.transaction.requester_rid +
                    this.transaction.requested_rid +
                    inputs_hashes_concat +
                    outputs_hashes_concat +
                    version
                ).toString('hex')
            } else if (this.info.relationship[this.identity.collections.WEB_PAGE_REQUEST ]) {
                // sign in
                this.transaction.relationship = this.crypt.shared_encrypt(this.info.shared_secret, JSON.stringify(this.info.relationship));

                hash = foobar.bitcoin.crypto.sha256(
                    this.transaction.public_key +
                    this.transaction.time +
                    this.transaction.rid +
                    this.transaction.relationship +
                    this.transaction.fee.toFixed(8) +
                    this.transaction.requester_rid +
                    this.transaction.requested_rid +
                    inputs_hashes_concat +
                    outputs_hashes_concat +
                    version
                ).toString('hex')
            } else if (this.info.relationship.wif) {
                // recovery
                this.transaction.relationship = this.crypt.shared_encrypt(this.info.shared_secret, JSON.stringify(this.info.relationship));

                hash = foobar.bitcoin.crypto.sha256(
                    this.transaction.public_key +
                    this.transaction.time +
                    this.transaction.rid +
                    this.transaction.relationship +
                    this.transaction.fee.toFixed(8) +
                    this.transaction.requester_rid +
                    this.transaction.requested_rid +
                    inputs_hashes_concat +
                    outputs_hashes_concat +
                    version
                ).toString('hex')
            } else if (
              this.info.relationship[this.identity.collections.GROUP]
            ) {
                // join or create group
                if (this.info.relationship[this.identity.collections.GROUP].parent) {
                  this.transaction.relationship = this.crypt.shared_encrypt(this.info.relationship[this.identity.collections.GROUP].parent.username_signature, JSON.stringify(this.info.relationship));
                } else {
                  this.transaction.relationship = this.crypt.encrypt(this.info.relationship);
                }

                hash = foobar.bitcoin.crypto.sha256(
                    this.transaction.public_key +
                    this.transaction.time +
                    this.transaction.rid +
                    this.transaction.relationship +
                    this.transaction.fee.toFixed(8) +
                    this.transaction.requester_rid +
                    this.transaction.requested_rid +
                    inputs_hashes_concat +
                    outputs_hashes_concat +
                    version
                ).toString('hex')
            } else if (
              this.info.relationship[this.identity.collections.MARKET]
            ) {
              // join or create market
              this.transaction.relationship = this.crypt.encrypt(this.info.relationship);

              hash = foobar.bitcoin.crypto.sha256(
                  this.transaction.public_key +
                  this.transaction.time +
                  this.transaction.rid +
                  this.transaction.relationship +
                  this.transaction.fee.toFixed(8) +
                  this.transaction.requester_rid +
                  this.transaction.requested_rid +
                  inputs_hashes_concat +
                  outputs_hashes_concat +
                  version
              ).toString('hex')
            } else if (
              this.info.relationship[this.identity.collections.AFFILIATE] ||
              this.info.relationship[this.identity.collections.BID] ||
              this.info.relationship[this.identity.collections.WEB_CHALLENGE_REQUEST] ||
              this.info.relationship[this.identity.collections.WEB_CHALLENGE_RESPONSE] ||
              this.info.relationship[this.identity.collections.WEB_PAGE_REQUEST] ||
              this.info.relationship[this.identity.collections.WEB_PAGE_RESPONSE] ||
              this.info.relationship[this.identity.collections.WEB_SIGNIN_REQUEST] ||
              this.info.relationship[this.identity.collections.WEB_SIGNIN_RESPONSE]
            ) {
                this.transaction.relationship = this.crypt.shared_encrypt(this.info.shared_secret, JSON.stringify(this.info.relationship));

                hash = foobar.bitcoin.crypto.sha256(
                    this.transaction.public_key +
                    this.transaction.time +
                    this.transaction.rid +
                    this.transaction.relationship +
                    this.transaction.fee.toFixed(8) +
                    this.transaction.requester_rid +
                    this.transaction.requested_rid +
                    inputs_hashes_concat +
                    outputs_hashes_concat +
                    version
                ).toString('hex')
            } else if (
              this.info.relationship[this.identity.collections.WEB_PAGE] ||
              this.info.relationship[this.identity.collections.ASSET]
            ) {
                // mypage
                this.transaction.relationship = this.crypt.encrypt(this.info.relationship);

                hash = foobar.bitcoin.crypto.sha256(
                    this.transaction.public_key +
                    this.transaction.time +
                    this.transaction.rid +
                    this.transaction.relationship +
                    this.transaction.fee.toFixed(8) +
                    this.transaction.requester_rid +
                    this.transaction.requested_rid +
                    inputs_hashes_concat +
                    outputs_hashes_concat +
                    version
                ).toString('hex')
            } else {
                //straight transaction
                hash = foobar.bitcoin.crypto.sha256(
                    this.transaction.public_key +
                    this.transaction.time +
                    (this.transaction.rid || '') +
                    (this.transaction.relationship || '') +
                    this.transaction.fee.toFixed(8) +
                    (this.transaction.requester_rid || '') +
                    (this.transaction.requested_rid || '') +
                    inputs_hashes_concat +
                    outputs_hashes_concat +
                    version
                ).toString('hex');
            }

            this.transaction.hash = hash
            var attempt = this.txnattempts.pop();
            attempt = this.cbattempts.pop();
            this.transaction.id = this.get_transaction_id(this.transaction.hash, attempt);
            if(hash) {
                resolve(this.transaction);
            } else {
                reject(false);
            }
        });
    }

    sendTransaction(txn=null, transactionUrlOverride = undefined) {
        return new Promise((resolve, reject) => {
            var url = '';
            url = (transactionUrlOverride || this.settings.webServiceURL + '/transaction') + '?username_signature=' + this.identity.identity.username_signature + '&to=' + this.key.getAddress() + '&username=' + this.username

            this.post(url, txn, resolve, reject)
        });
    }

    post(url: string, txn: GraphI.Txn|null, resolve: any, reject: any) {

      return fetch(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(txn),
        }
      )
      .then((res) => {
        return resolve(res)
      })
      .catch((err) => {
        return reject(err);
      })
    }

    get_transaction_id(hash:any, trynum: any) {
        var combine = new Uint8Array(hash.length);
        //combine[0] = 0;
        //combine[1] = 64;
        for (var i = 0; i < hash.length; i++) {
            combine[i] = hash.charCodeAt(i)
        }
        var shaMessage = foobar.bitcoin.crypto.sha256(combine);
        var signature = this.key.sign(shaMessage);
        var der = signature.toDER();
        return foobar.base64.fromByteArray(der);
    }
}