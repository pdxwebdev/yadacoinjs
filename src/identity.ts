import ripemd160 from "noble-ripemd160";
import bs58 from "bs58";
import { GraphI } from ".";
import { Settings } from "./settings";

declare var foobar: any;
declare var forge: any;

export class Identity {
  identity: any = {};
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
  collections: IdentityI.Collections = {
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
  listening: boolean = false;
  constructor(settings: Settings) {
    this.settings = settings;
    this.initListener();
  }

  initListener() {
    window.addEventListener("message", async (event) => {
      console.log(event.data);
      if (event.data.method === "identity") {
        this.identity = event.data.result.identity;
        this.onIdentity(event.data);
      }

      if (event.data.method === "signin") {
        this.onSignIn(event.data);
        const data = await (
          await fetch(this.settings.webServiceURL + "/auth", {
            method: "POST",
            cache: "no-cache",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username_signature: event.data.result.identity.username_signature,
              challenge_signature: event.data.result.signature,
            }),
          })
        ).json();
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
    });
  }

  onIdentity(data: any) {
    this.identityResolve && this.identityResolve(data.result.identity);
    if (data.portal === "window") {
      this.popup.close();
    }
  }

  onSignIn(data: any) {
    this.getAuthResolve && this.getAuthResolve(data.result.signature);
    if (data.portal === "window") {
      this.popup.close();
    }
  }

  onAddContact(data: any) {
    this.addContactResolve && this.addContactResolve();
    if (data.portal === "window") {
      this.popup.close();
    }
  }

  onAddGroup(data: any) {
    this.addGroupResolve && this.addGroupResolve();
    if (data.portal === "window") {
      this.popup.close();
    }
  }

  onGetGraph(data: any) {
    this.getGraphResolve && this.getGraphResolve(data.result.graph);
    if (data.portal === "window") {
      this.popup.close();
    }
  }

  onGetCollection(data: any) {
    this.getCollectionResolve && this.getCollectionResolve(data.result.graph);
    if (data.portal === "window") {
      this.popup.close();
    }
  }

  onSendMail(data: any) {
    this.sendMailResolve && this.sendMailResolve();
    if (data.portal === "window") {
      this.popup.close();
    }
  }

  onGetMail(data: any) {
    this.getMailResolve && this.getMailResolve(data.result.graph);
    if (data.portal === "window") {
      this.popup.close();
    }
  }

  reviveUser(wif: string, username: string) {
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

  generateUsernameSignature(key: any, username: string) {
    return key
      .sign(foobar.bitcoin.crypto.sha256(username))
      .toDER()
      .toString("base64");
  }

  generateRid(
    username_signature1: string,
    username_signature2: string,
    collection = ""
  ) {
    const username_signatures = [username_signature1, username_signature2].sort(
      function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
      }
    );
    return forge.sha256
      .create()
      .update(username_signatures[0] + username_signatures[1] + collection)
      .digest()
      .toHex();
  }

  getIdentity(portal: string, identifier: string) {
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

  async publicKeyToAddress(public_key: string) {
    const pubkey256 = await this.sha256(public_key);
    const hash160 = ripemd160(this.hexToByteArray(pubkey256));
    console.log(this.toHex(hash160));
    const first = await this.sha256("00" + this.toHex(hash160));
    console.log(first);
    const pubkey2562 = await this.sha256(first);
    console.log(this.toHex(pubkey2562));
    const unencodedAddress =
      "00" + this.toHex(hash160) + pubkey2562.substring(0, 8);
    return bs58.encode(this.hexToByteArray(unencodedAddress));
  }

  async sha256(hexstr: any) {
    // We transform the string into an arraybuffer.
    var buffer = new Uint8Array(
      hexstr.match(/[\da-f]{2}/gi).map(function (h: any) {
        return parseInt(h, 16);
      })
    );
    const hash = await crypto.subtle.digest("SHA-256", buffer);
    return await this.arbuf2hex(hash);
  }

  hexToByteArray(s: any) {
    var arr = [];
    for (var i = 0; i < s.length; i += 2) {
      var c = s.substr(i, 2);
      arr.push(parseInt(c, 16));
    }
    return new Uint8Array(arr);
  }

  async arbuf2hex(buffer: any) {
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
  }

  toHex(byteArray: any) {
    var callback = function (byte: any) {
      return ("0" + (byte & 0xff).toString(16)).slice(-2);
    };
    return Array.from(byteArray, callback).join("");
  }

  toIdentity(identity: IdentityI.Identity) {
    if (!identity) return {};
    let iden: any = {
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

  async getAuth(portal: string) {
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
  }

  async getSignature(hash: string, portal: string) {
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
  }

  openPortal(options: any) {
    const url =
      this.settings.webServiceURL +
      "/identity#" +
      btoa(JSON.stringify(options));
    if (options.portal === "window") {
      this.popup = window.open(
        url,
        "_blank",
        "left=100,top=100,width=450,height=500"
      );
    } else if (options.portal === "iframe") {
      let iframe = document.getElementById("yadacoin_identity_widget") as any;
      if (!iframe) {
        iframe = document.createElement("iframe") as any;
        iframe.id = "yadacoin_identity_widget";
        iframe.style.display = "none";
        document.body.appendChild(iframe);
      }
      iframe.src = url;
    }
  }
}

export declare namespace IdentityI {
  export interface Identity {
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
  export interface Collections {
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
