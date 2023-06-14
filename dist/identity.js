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
define(["require", "exports", "noble-ripemd160", "bs58"], function (require, exports, noble_ripemd160_1, bs58_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Identity = void 0;
    noble_ripemd160_1 = __importDefault(noble_ripemd160_1);
    bs58_1 = __importDefault(bs58_1);
    class Identity {
        constructor(settings) {
            this.identity = {};
            this.collections = {
                AFFILIATE: "affiliate",
                ASSET: "asset",
                BID: "bid",
                CONTACT: "contact",
                CALENDAR: "event_meeting",
                CHAT: "chat",
                CHAT_FILE: "chat_file",
                CONTRACT: "contract",
                CONTRACT_SIGNED: "contract_signed",
                FILE_REQUEST: "file_request",
                GROUP: "group",
                GROUP_CALENDAR: "group_event_meeting",
                GROUP_CHAT: "group_chat",
                GROUP_CHAT_FILE_NAME: "group_chat_file_name",
                GROUP_CHAT_FILE: "group_chat_file",
                GROUP_MAIL: "group_mail",
                MAIL: "mail",
                MARKET: "market",
                PERMISSION_REQUEST: "permission_request",
                SIGNATURE_REQUEST: "signature_request",
                SMART_CONTRACT: "smart_contract",
                WEB_CHALLENGE_REQUEST: "web_challenge_request",
                WEB_CHALLENGE_RESPONSE: "web_challenge_response",
                WEB_PAGE: "web_page",
                WEB_PAGE_REQUEST: "web_page_request",
                WEB_PAGE_RESPONSE: "web_page_response",
                WEB_SIGNIN_REQUEST: "web_signin_request",
                WEB_SIGNIN_RESPONSE: "web_signin_response",
            };
            this.listening = false;
            this.settings = settings;
            this.initListener();
        }
        initListener() {
            window.addEventListener("message", (event) => __awaiter(this, void 0, void 0, function* () {
                console.log(event.data);
                if (event.data.method === "identity") {
                    this.identity = event.data.result.identity;
                    this.onIdentity(event.data);
                }
                if (event.data.method === "signin") {
                    this.onSignIn(event.data);
                    const data = yield (yield fetch(this.settings.webServiceURL + "/auth", {
                        method: "POST",
                        cache: "no-cache",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            username_signature: event.data.result.identity.username_signature,
                            challenge_signature: event.data.result.signature,
                        }),
                    })).json();
                    console.log(data);
                }
                if (event.data.method === "addcontact") {
                    this.onAddContact(event.data);
                }
                if (event.data.method === "addgroup") {
                    this.onAddGroup(event.data);
                }
                if (event.data.method === "getgraph") {
                    this.onGetGraph(event.data);
                }
                if (event.data.method === "getcollection") {
                    this.onGetCollection(event.data);
                }
                if (event.data.method === "sendmail") {
                    this.onSendMail(event.data);
                }
                if (event.data.method === "getmail") {
                    this.onGetMail(event.data);
                }
            }));
        }
        onIdentity(data) {
            this.identityResolve && this.identityResolve(data.result.identity);
            if (data.portal === "window") {
                this.popup.close();
            }
        }
        onSignIn(data) {
            this.getAuthResolve && this.getAuthResolve(data.result.signature);
            if (data.portal === "window") {
                this.popup.close();
            }
        }
        onAddContact(data) {
            this.addContactResolve && this.addContactResolve();
            if (data.portal === "window") {
                this.popup.close();
            }
        }
        onAddGroup(data) {
            this.addGroupResolve && this.addGroupResolve();
            if (data.portal === "window") {
                this.popup.close();
            }
        }
        onGetGraph(data) {
            this.getGraphResolve && this.getGraphResolve(data.result.graph);
            if (data.portal === "window") {
                this.popup.close();
            }
        }
        onGetCollection(data) {
            this.getCollectionResolve && this.getCollectionResolve(data.result.graph);
            if (data.portal === "window") {
                this.popup.close();
            }
        }
        onSendMail(data) {
            this.sendMailResolve && this.sendMailResolve();
            if (data.portal === "window") {
                this.popup.close();
            }
        }
        onGetMail(data) {
            this.getMailResolve && this.getMailResolve(data.result.graph);
            if (data.portal === "window") {
                this.popup.close();
            }
        }
        reviveUser(wif, username) {
            return new Promise((resolve, reject) => {
                var key = foobar.bitcoin.ECPair.fromWIF(wif);
                var public_key = key.getPublicKeyBuffer().toString("hex");
                const identity = {
                    username_signature: this.generateUsernameSignature(key, username),
                    username: username,
                    wif: wif,
                    public_key: public_key,
                    key: key,
                };
                return resolve(identity);
            });
        }
        generateUsernameSignature(key, username) {
            return key
                .sign(foobar.bitcoin.crypto.sha256(username))
                .toDER()
                .toString("base64");
        }
        generateRid(username_signature1, username_signature2, collection = "") {
            const username_signatures = [username_signature1, username_signature2].sort(function (a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            });
            return forge.sha256
                .create()
                .update(username_signatures[0] + username_signatures[1] + collection)
                .digest()
                .toHex();
        }
        getIdentity(portal, identifier) {
            return new Promise((resolve, reject) => {
                this.identityResolve = resolve;
                this.identityReject = reject;
                this.openPortal({
                    method: "identity",
                    origin: "*",
                    portal,
                    message: {
                        identifier,
                    },
                });
            });
        }
        cloneIdentity() {
            return JSON.parse(this.identityJson());
        }
        identityJson() {
            return JSON.stringify(this.toIdentity(this.identity), null, 4);
        }
        publicKeyToAddress(public_key) {
            return __awaiter(this, void 0, void 0, function* () {
                const pubkey256 = yield this.sha256(public_key);
                const hash160 = (0, noble_ripemd160_1.default)(this.hexToByteArray(pubkey256));
                console.log(this.toHex(hash160));
                const first = yield this.sha256("00" + this.toHex(hash160));
                console.log(first);
                const pubkey2562 = yield this.sha256(first);
                console.log(this.toHex(pubkey2562));
                const unencodedAddress = "00" + this.toHex(hash160) + pubkey2562.substring(0, 8);
                return bs58_1.default.encode(this.hexToByteArray(unencodedAddress));
            });
        }
        sha256(hexstr) {
            return __awaiter(this, void 0, void 0, function* () {
                // We transform the string into an arraybuffer.
                var buffer = new Uint8Array(hexstr.match(/[\da-f]{2}/gi).map(function (h) {
                    return parseInt(h, 16);
                }));
                const hash = yield crypto.subtle.digest("SHA-256", buffer);
                return yield this.arbuf2hex(hash);
            });
        }
        hexToByteArray(s) {
            var arr = [];
            for (var i = 0; i < s.length; i += 2) {
                var c = s.substr(i, 2);
                arr.push(parseInt(c, 16));
            }
            return new Uint8Array(arr);
        }
        arbuf2hex(buffer) {
            return __awaiter(this, void 0, void 0, function* () {
                var hexCodes = [];
                var view = new DataView(buffer);
                for (var i = 0; i < view.byteLength; i += 4) {
                    // Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
                    var value = view.getUint32(i);
                    // toString(16) will give the hex representation of the number without padding
                    var stringValue = value.toString(16);
                    // We use concatenation and slice for padding
                    var padding = "00000000";
                    var paddedValue = (padding + stringValue).slice(-padding.length);
                    hexCodes.push(paddedValue);
                }
                // Join all the hex strings into one
                return hexCodes.join("");
            });
        }
        toHex(byteArray) {
            var callback = function (byte) {
                return ("0" + (byte & 0xff).toString(16)).slice(-2);
            };
            return Array.from(byteArray, callback).join("");
        }
        toIdentity(identity) {
            if (!identity)
                return {};
            let iden = {
                username: identity.username,
                username_signature: identity.username_signature,
                public_key: identity.public_key,
            };
            if (identity.parent) {
                iden.parent = identity.parent;
            }
            if (identity.collection) {
                iden.collection = identity.collection;
            }
            return iden;
        }
        getAuth(portal) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => {
                    this.getAuthResolve = resolve;
                    this.getAuthReject = reject;
                    return new Promise((resolve, reject) => {
                        this.identityResolve = resolve;
                        this.identityReject = reject;
                        this.openPortal({
                            method: "identity",
                            origin: "*",
                            portal,
                        });
                    })
                        .then(() => {
                        return fetch(this.settings.webServiceURL + "/challenge", {
                            method: "POST",
                            cache: "no-cache",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(this.identity),
                        });
                    })
                        .then((res) => {
                        return res.json();
                    })
                        .then((data) => {
                        this.openPortal({
                            method: "signin",
                            origin: "*",
                            portal,
                            message: {
                                challenge: data.challenge,
                                identity: this.identity,
                            },
                        });
                    });
                });
            });
        }
        getSignature(hash, portal) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => {
                    this.getAuthResolve = resolve;
                    this.getAuthReject = reject;
                    this.openPortal({
                        method: "signin",
                        origin: "*",
                        portal,
                        message: {
                            challenge: hash,
                            identity: this.identity,
                        },
                    });
                });
            });
        }
        openPortal(options) {
            const url = this.settings.webServiceURL +
                "/identity#" +
                btoa(JSON.stringify(options));
            if (options.portal === "window") {
                this.popup = window.open(url, "_blank", "left=100,top=100,width=450,height=500");
            }
            else if (options.portal === "iframe") {
                let iframe = document.getElementById("yadacoin_identity_widget");
                if (!iframe) {
                    iframe = document.createElement("iframe");
                    iframe.id = "yadacoin_identity_widget";
                    iframe.style.display = "none";
                    document.body.appendChild(iframe);
                }
                iframe.src = url;
            }
        }
    }
    exports.Identity = Identity;
});
//# sourceMappingURL=identity.js.map