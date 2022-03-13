import { GraphI } from '.';
import { Settings } from './settings';


declare var foobar: any;
declare var forge: any;
declare var Base64: any;


export class Identity {
  identity : any = {}
  key: any;
  popup: any;
  settings: any;
  identityResolve: any;
  identityReject: any;
  getAuthResolve: any
  getAuthReject: any
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
    AFFILIATE: 'affiliate',
    ASSET: 'asset',
    BID: 'bid',
    CONTACT: 'contact',
    CALENDAR: 'event_meeting',
    CHAT: 'chat',
    CHAT_FILE: 'chat_file',
    CONTRACT: 'contract',
    CONTRACT_SIGNED: 'contract_signed',
    GROUP: 'group',
    GROUP_CALENDAR: 'group_event_meeting',
    GROUP_CHAT: 'group_chat',
    GROUP_CHAT_FILE_NAME: 'group_chat_file_name',
    GROUP_CHAT_FILE: 'group_chat_file',
    GROUP_MAIL: 'group_mail',
    MAIL: 'mail',
    MARKET: 'market',
    PERMISSION_REQUEST: 'permission_request',
    SIGNATURE_REQUEST: 'signature_request',
    SMART_CONTRACT: 'smart_contract',
    WEB_CHALLENGE_REQUEST: 'web_challenge_request',
    WEB_CHALLENGE_RESPONSE: 'web_challenge_response',
    WEB_PAGE: 'web_page',
    WEB_PAGE_REQUEST: 'web_page_request',
    WEB_PAGE_RESPONSE: 'web_page_response',
    WEB_SIGNIN_REQUEST: 'web_signin_request',
    WEB_SIGNIN_RESPONSE: 'web_signin_response'
  }
  listening: boolean = false
  constructor() {
    this.initListener()
  }

  initListener() {
    window.addEventListener('message', async (event) => {
      console.log(event.data)
      if (event.data.method === 'identity') {
        this.identity = event.data.result.identity
        this.onIdentity(this.identity)
      }

      if(event.data.method === 'signin') {
        this.onSignIn(event.data.result.signature)
        const data = await (await fetch(this.settings.webServiceURL + '/auth', {
          method: 'POST',
          cache: 'no-cache',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            'username_signature': event.data.result.identity.username_signature,
            'challenge_signature': event.data.result.signature
          })
        })).json();
        console.log(data)
      }

      if(event.data.method === 'addcontact') {
        this.onAddContact()
      }

      if(event.data.method === 'addgroup') {
        this.onAddGroup()
      }

      if(event.data.method === 'getgraph') {
        this.onGetGraph(event.data.result.graph)
      }

      if(event.data.method === 'getcollection') {
        this.onGetCollection(event.data.result.graph)
      }

      if(event.data.method === 'sendmail') {
        this.onSendMail()
      }

      if(event.data.method === 'getmail') {
        this.onGetMail(event.data.result.graph)
      }
    })
  }

  onIdentity(identity: IdentityI.Identity) {
    // hook
  }

  onSignIn(signature: string) {
    // hook
  }

  onAddContact() {
    // hook
  }

  onAddGroup() {
    // hook
  }

  onGetGraph(graph: GraphI.Graph) {
    // hook
  }

  onGetCollection(graph: GraphI.Graph) {
    // hook
  }

  onSendMail() {
    // hook
  }

  onGetMail(graph: GraphI.Graph) {
    // hook
  }

  reviveUser(wif: string, username: string) {
    return new Promise((resolve, reject) => {
      var key = foobar.bitcoin.ECPair.fromWIF(wif);
      var public_key = key.getPublicKeyBuffer().toString('hex');
      const identity = {
        username_signature: this.generateUsernameSignature(key, username),
        username: username,
        wif: wif,
        public_key: public_key,
        key: key
      }
      return resolve(identity);
    });
  }

  generateUsernameSignature(key: any, username: string) {
      return key.sign(foobar.bitcoin.crypto.sha256(username)).toDER().toString('base64');
  }

  generateRid(username_signature1: string, username_signature2: string, collection='') {
    const username_signatures = [username_signature1, username_signature2].sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
    });
    return forge.sha256.create().update(username_signatures[0] + username_signatures[1] + collection).digest().toHex();
  }

  getIdentity() {
    return new Promise((resolve, reject) => {
      this.identityResolve = resolve;
      this.identityReject = reject;
      this.popup = window.open(this.settings.webServiceURL + '/identity#' + btoa(JSON.stringify({
        method: 'identity',
        origin: '*'
      })), '_blank', 'left=100,top=100,width=450,height=500')
    })
  }

  cloneIdentity() {
    return JSON.parse(this.identityJson())
  }

  identityJson() {
    return JSON.stringify(this.toIdentity(this.identity), null, 4)
  }

  publicKeyToAddress(public_key: string) {
      return foobar.bitcoin.ECPair.fromPublicKeyBuffer(foobar.Buffer.Buffer.from(public_key, 'hex')).getAddress()
  }

  toIdentity(identity: IdentityI.Identity) {
    if (!identity) return {};
    let iden: any = {
      username: identity.username,
      username_signature: identity.username_signature,
      public_key: identity.public_key
    }
    if (identity.parent) {
      iden.parent = identity.parent
    }
    if (identity.collection) {
      iden.collection = identity.collection
    }
    return iden;
  }

  async getAuth() {
    return new Promise((resolve, reject) => {
      this.getAuthResolve = resolve;
      this.getAuthReject = reject;
      return new Promise((resolve, reject) => {
        this.identityResolve = resolve;
        this.identityReject = reject;
        this.popup = window.open(this.settings.webServiceURL + '/identity#' + btoa(JSON.stringify({
          'method':'identity',
          'origin': '*'
        })), '_blank', 'left=100,top=100,width=450,height=500')
      })
      .then(() => {
        return fetch(this.settings.webServiceURL + '/challenge', {
          method: 'POST',
          cache: 'no-cache',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.identity)
        })
      })
      .then((res) => {
        return res.json()
      })
      .then((data) => {
        this.popup = window.open(this.settings.webServiceURL + '/identity#' + btoa(JSON.stringify({
          method:'signin',
          origin: '*',
          message: {
            challenge: data.challenge,
            identity: this.identity
          }
        })), '_blank', 'left=100,top=100,width=450,height=500')
      })
    })
  }

  async getSignature(hash: string) {
    return new Promise((resolve, reject) => {
      this.getAuthResolve = resolve;
      this.getAuthReject = reject;
      this.popup = window.open(this.settings.webServiceURL + '/identity#' + btoa(JSON.stringify({
        method:'signin',
        origin: '*',
        message: {
          challenge: hash,
          identity: this.identity
        }
      })), '_blank', 'left=100,top=100,width=450,height=500')
    })
  }
}

export declare namespace IdentityI {
  export interface Identity {
    public_key: string,
    username: string,
    username_signature: string,
    parent: {
      public_key: string,
      username: string,
      username_signature: string
    },
    collection: string
  }
  export interface Collections {
    AFFILIATE: string,
    ASSET: string,
    BID: string,
    CONTACT: string,
    CALENDAR: string,
    CHAT: string,
    CHAT_FILE: string,
    CONTRACT: string,
    CONTRACT_SIGNED: string,
    GROUP: string,
    GROUP_CALENDAR: string,
    GROUP_CHAT: string,
    GROUP_CHAT_FILE_NAME: string,
    GROUP_CHAT_FILE: string,
    GROUP_MAIL: string,
    MAIL: string,
    MARKET: string,
    PERMISSION_REQUEST: string,
    SIGNATURE_REQUEST: string,
    SMART_CONTRACT: string,
    WEB_CHALLENGE_REQUEST: string,
    WEB_CHALLENGE_RESPONSE: string,
    WEB_PAGE: string,
    WEB_PAGE_REQUEST: string,
    WEB_PAGE_RESPONSE: string,
    WEB_SIGNIN_REQUEST: string,
    WEB_SIGNIN_RESPONSE: string,
    [key: string]: string
  }
}
