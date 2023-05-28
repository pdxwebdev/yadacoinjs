var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Graph = void 0;
    class Graph {
        constructor(settings, identity) {
            this.graph = {
                mail: [],
                contacts: [],
                groups: [],
                files: [],
                friend_requests: [],
                sent_friend_requests: [],
            };
            this.keys = {};
            this.friends_indexed = {};
            this.groups_indexed = {};
            this.stored_secrets = {};
            this.sent_friend_requests_indexed = {};
            this.friend_request_count = 0;
            this.settings = settings;
            this.identity = identity;
        }
        endpointRequest(endpoint, post_data = {}) {
            return new Promise((resolve, reject) => {
                if (endpoint.substr(0, 1) !== "/") {
                    endpoint = "/" + endpoint;
                }
                const url = this.settings.webServiceURL +
                    endpoint +
                    "?origin=" +
                    encodeURIComponent(window.location.origin) +
                    "&username_signature=" +
                    encodeURIComponent(this.identity.identity.username_signature);
                this.post(url, post_data, resolve, reject);
            });
        }
        post(url, post_data, resolve, reject) {
            return fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(post_data),
            })
                .then((res) => {
                return res.json();
            })
                .then((data) => {
                return resolve(data);
            })
                .catch((err) => {
                return reject(err);
            });
        }
        resetGraph() {
            this.graph = {
                contacts: [],
                groups: [],
                files: [],
                mail: [],
                messages: [],
                friend_requests: [],
                sent_friend_requests: [],
            };
            this.groups_indexed = {};
            this.friends_indexed = {};
            this.notifications = {};
            for (let i = 0; i < Object.keys(this.identity.collections).length; i++) {
                let collectionKey = Object.keys(this.identity.collections)[i];
                if (!this.notifications[this.identity.collections[collectionKey]])
                    this.notifications[this.identity.collections[collectionKey]] = [];
            }
            if (!this.notifications["notifications"])
                this.notifications["notifications"] = [];
        }
        refreshFriendsAndGroups() {
            this.resetGraph();
            return this.getGroups()
                .then((results) => {
                return this.getGroups(null, "file");
            })
                .then(() => {
                return this.getFriendRequests();
            })
                .then(() => {
                return this.getSharedSecrets();
            });
        }
        _getMail(ridsoverride, collection = this.identity.collections.MAIL) {
            //get messages for a specific friend
            let rids = ridsoverride || [
                this.identity.generateRid(this.identity.identity.username_signature, this.identity.identity.username_signature, this.identity.collections.MAIL),
                this.identity.generateRid(this.identity.identity.username_signature, this.identity.identity.username_signature, this.identity.collections.CONTRACT),
                this.identity.generateRid(this.identity.identity.username_signature, this.identity.identity.username_signature, this.identity.collections.CONTRACT_SIGNED),
                this.identity.generateRid(this.identity.identity.username_signature, this.identity.identity.username_signature, this.identity.collections.CALENDAR),
            ];
            let group_rids = [];
            for (let i = 0; i < this.graph.groups.length; i++) {
                const group = this.getIdentityFromTxn(this.graph.groups[i], null);
                group_rids.push(this.identity.generateRid(group.username_signature, group.username_signature, this.identity.collections.GROUP_MAIL));
            }
            let file_rids = [];
            for (let i = 0; i < this.graph.files.length; i++) {
                const group = this.getIdentityFromTxn(this.graph.files[i], null);
                file_rids.push(this.identity.generateRid(group.username_signature, group.username_signature, this.identity.collections.GROUP_MAIL));
            }
            if (group_rids.length > 0) {
                rids = rids.concat(group_rids);
            }
            if (file_rids.length > 0) {
                rids = rids.concat(file_rids);
            }
            return new Promise((resolve, reject) => {
                this.endpointRequest("get-graph-collection", { rids })
                    .then((data) => {
                    return this.parseMail(data.collection, collection);
                })
                    .then((mail) => {
                    this.graph.mail = this.graph.mail.concat(mail);
                    this.graph.mail = this.toDistinct(this.graph.mail, "id");
                    this.sortInt(this.graph.mail, "time");
                    return resolve(mail);
                })
                    .catch((err) => {
                    reject(err);
                });
            });
        }
        parseMail(messages, collection = this.identity.collections.MAIL) {
            return new Promise((resolve, reject) => {
                var chats = [];
                dance: for (var i = 0; i < messages.length; i++) {
                    var message = messages[i];
                    if (!message.rid)
                        continue;
                    if (message.dh_public_key)
                        continue;
                    if (this.groups_indexed[message.requested_rid]) {
                        try {
                            let identity = this.getIdentityFromTxn(this.groups_indexed[message.requested_rid], this.identity.collections.GROUP);
                            if (!identity)
                                continue;
                            var decrypted = this.crypt.shared_decrypt(identity.username_signature, message.relationship);
                        }
                        catch (error) {
                            continue;
                        }
                        try {
                            var messageJson = JSON.parse(decrypted);
                        }
                        catch (err) {
                            continue;
                        }
                        if (messageJson[collection]) {
                            message.relationship = messageJson;
                            try {
                                message.relationship[collection] = JSON.parse(Base64.decode(messageJson[collection]));
                            }
                            catch (err) {
                                //not an invite, do nothing
                            }
                            chats.push(message);
                        }
                        continue dance;
                    }
                    else {
                        if (!this.stored_secrets[message.rid])
                            continue;
                        for (var j = 0; j < this.stored_secrets[message.rid].length; j++) {
                            var shared_secret = this.stored_secrets[message.rid][j];
                            try {
                                var decrypted = this.crypt.shared_decrypt(shared_secret.shared_secret, message.relationship);
                            }
                            catch (error) {
                                continue;
                            }
                            try {
                                var messageJson = JSON.parse(decrypted);
                            }
                            catch (err) {
                                continue;
                            }
                            if (messageJson[collection]) {
                                message.relationship = messageJson;
                                message.shared_secret = shared_secret.shared_secret;
                                message.dh_public_key = shared_secret.dh_public_key;
                                message.dh_private_key = shared_secret.dh_private_key;
                                try {
                                    message.relationship[collection] = JSON.parse(Base64.decode(messageJson[collection]));
                                }
                                catch (err) {
                                    //not an invite, do nothing
                                }
                                chats.push(message);
                            }
                            continue dance;
                        }
                    }
                }
                return resolve(chats);
            });
        }
        prepareMailItems(label) {
            return this.graph.mail
                .filter((item) => {
                if (label === "Sent" &&
                    item.public_key === this.identity.identity.public_key)
                    return true;
                if (label === "Inbox" &&
                    item.public_key !== this.identity.identity.public_key)
                    return true;
                return false;
            })
                .map((item) => {
                return this.prepareMailItem(item, label);
            });
        }
        prepareMailItem(item, label) {
            const group = this.getIdentityFromTxn(this.groups_indexed[item.requested_rid], this.identity.collections.GROUP);
            const friend = this.getIdentityFromTxn(this.friends_indexed[item.rid], this.identity.collections.CONTACT);
            const identity = group || friend;
            const collection = group
                ? this.identity.collections.GROUP_MAIL
                : this.identity.collections.MAIL;
            let sender;
            if (item.relationship[collection].sender) {
                sender = item.relationship[collection].sender;
            }
            else if (item.public_key === this.identity.identity.public_key &&
                label === "Inbox") {
                sender = this.identity.identity;
            }
            else {
                sender = {
                    username: identity.username,
                    username_signature: identity.username_signature,
                    public_key: identity.public_key,
                };
            }
            const datetime = new Date(parseInt(item.time) * 1000);
            return {
                sender: sender,
                group: group || null,
                subject: item.relationship[collection].subject,
                body: item.relationship[collection].body,
                datetime: datetime.toLocaleDateString() + " " + datetime.toLocaleTimeString(),
                id: item.id,
                thread: item.relationship.thread,
                message_type: item.relationship[collection].message_type,
                event_datetime: item.relationship[collection].event_datetime,
                skylink: item.relationship[collection].skylink,
                filename: item.relationship[collection].filename,
                rid: item.rid,
            };
        }
        generateMessage({ identity, recipient, collection, message }) {
            const rid = this.generateRid(identity.username_signature, recipient.username_signature);
            const requester_rid = this.generateRid(identity.username_signature, identity.username_signature, collection);
            const requested_rid = this.generateRid(recipient.username_signature, recipient.username_signature, collection);
            let send = false;
            let info = {};
            if (this.isGroup(recipient)) {
                info = {
                    relationship: {},
                    rid: rid,
                    requester_rid: requester_rid,
                    requested_rid: requested_rid,
                    shared_secret: recipient.username_signature,
                };
                info.relationship[collection] = {
                    sender: identity,
                    subject: message.subject,
                    body: message.body,
                    thread: message.thread,
                    event_datetime: message.event_datetime,
                    filename: message.filepath,
                };
                return info;
            }
            else {
                var dh_public_key = this.keys[rid].dh_public_keys[0];
                var dh_private_key = this.keys[rid].dh_private_keys[0];
                if (dh_public_key && dh_private_key) {
                    var privk = new Uint8Array(dh_private_key.match(/[\da-f]{2}/gi).map(function (h) {
                        return parseInt(h, 16);
                    }));
                    var pubk = new Uint8Array(dh_public_key.match(/[\da-f]{2}/gi).map(function (h) {
                        return parseInt(h, 16);
                    }));
                    var shared_secret = this.crypt.toHex(X25519.getSharedKey(privk, pubk));
                    // camera permission was granted
                    info = {
                        dh_public_key: dh_public_key,
                        dh_private_key: dh_private_key,
                        relationship: {},
                        shared_secret: shared_secret,
                        rid: rid,
                        requester_rid: requester_rid,
                        requested_rid: requested_rid,
                    };
                    info.relationship[collection] = {
                        subject: message.subject,
                        body: message.body,
                        thread: message.thread,
                        event_datetime: message.event_datetime,
                        filename: message.filepath,
                    };
                    return info;
                }
            }
            return false;
        }
        _sendMail(params) {
            return __awaiter(this, void 0, void 0, function* () {
                const info = this.generateMessage(params);
                if (info === false)
                    return;
                const txn = yield this.transaction.generateTransaction(info);
                yield this.transaction.sendTransaction(txn);
            });
        }
        addFriend(identity, rid = "", requester_rid = "", requested_rid = "") {
            rid =
                rid ||
                    this.generateRid(this.identity.identity.username_signature, identity.username_signature);
            requester_rid =
                requester_rid ||
                    this.generateRid(this.identity.identity.username_signature, this.identity.identity.username_signature, this.identity.collections.CONTACT);
            requested_rid =
                requested_rid ||
                    this.generateRid(identity.username_signature, identity.username_signature, this.identity.collections.CONTACT);
            if (requester_rid && requested_rid) {
                // get rid from bulletin secrets
            }
            else {
                requester_rid = "";
                requested_rid = "";
            }
            var raw_dh_private_key = foobar.bitcoin.crypto.sha256(this.identity.identity.key.toWIF() + identity.username_signature);
            var raw_dh_public_key = X25519.getPublic(raw_dh_private_key);
            var dh_private_key = this.crypt.toHex(raw_dh_private_key);
            var dh_public_key = this.crypt.toHex(raw_dh_public_key);
            let myIdentity = this.identity.cloneIdentity();
            myIdentity.collection = this.identity.collections.CONTACT;
            let info = {
                dh_private_key: dh_private_key,
            };
            info[this.identity.collections.CONTACT] = myIdentity;
            return this.transaction
                .generateTransaction({
                relationship: info,
                dh_public_key: dh_public_key,
                requested_rid: requested_rid,
                requester_rid: requester_rid,
                rid: rid,
                to: this.identity.publicKeyToAddress(identity.public_key),
                recipient_identity: identity,
            })
                .then((txn) => {
                return this.transaction.sendTransaction(txn);
            })
                .then(() => {
                return this.refreshFriendsAndGroups();
            });
        }
        getFriendRequests(rid = null) {
            return new Promise((resolve, reject) => {
                const rids = [
                    rid ||
                        this.generateRid(this.identity.identity.username_signature, this.identity.identity.username_signature, this.identity.collections.CONTACT),
                ];
                this.endpointRequest("get-graph-collection", { rids: rids })
                    .then((data) => {
                    this.parseFriendRequests(data.collection);
                    return resolve(null);
                })
                    .catch((err) => {
                    reject(err);
                })
                    .catch((err) => {
                    reject(err);
                });
            });
        }
        parseFriendRequests(friend_requests) {
            let friend_requestsObj = {};
            var sent_friend_requestsObj = {};
            if (!this.graph.contacts)
                this.graph.contacts = [];
            for (var i = 0; i < friend_requests.length; i++) {
                var friend_request = friend_requests[i];
                if (!this.keys[friend_request.rid]) {
                    this.keys[friend_request.rid] = {
                        dh_private_keys: [],
                        dh_public_keys: [],
                    };
                }
                try {
                    var decrypted = this.crypt.publicDecrypt(friend_request.relationship);
                    var relationship = JSON.parse(decrypted);
                    if (!relationship[this.identity.collections.CONTACT])
                        continue;
                    friend_request.relationship = relationship;
                    if (sent_friend_requestsObj[friend_request.rid]) {
                        delete friend_requestsObj[friend_request.rid];
                        delete sent_friend_requestsObj[friend_request.rid];
                        this.graph.contacts.push(friend_request);
                        this.friends_indexed[friend_request.rid] = friend_request;
                    }
                    else {
                        friend_requestsObj[friend_request.rid] = friend_request;
                    }
                    if (this.keys[friend_request.rid].dh_private_keys.indexOf(relationship.dh_private_key) === -1 &&
                        relationship.dh_private_key) {
                        this.keys[friend_request.rid].dh_private_keys.push(relationship.dh_private_key);
                    }
                }
                catch (err) {
                    if (friend_requestsObj[friend_request.rid]) {
                        this.graph.contacts.push(friend_requestsObj[friend_request.rid]);
                        this.friends_indexed[friend_request.rid] =
                            friend_requestsObj[friend_request.rid];
                        delete friend_requestsObj[friend_request.rid];
                        delete sent_friend_requestsObj[friend_request.rid];
                    }
                    else {
                        sent_friend_requestsObj[friend_request.rid] = friend_request;
                    }
                    if (this.keys[friend_request.rid].dh_public_keys.indexOf(friend_request.dh_public_key) === -1 &&
                        friend_request.dh_public_key) {
                        this.keys[friend_request.rid].dh_public_keys.push(friend_request.dh_public_key);
                    }
                }
            }
            var arr_sent_friend_requests = [];
            for (let i in sent_friend_requestsObj) {
                arr_sent_friend_requests.push(sent_friend_requestsObj[i].rid);
            }
            this.sent_friend_requests_indexed = {};
            const sent_friend_requests = [];
            let sent_friend_requests_diff = new Set(arr_sent_friend_requests);
            if (arr_sent_friend_requests.length > 0) {
                let arr_sent_friend_request_keys = Array.from(sent_friend_requests_diff.keys());
                for (i = 0; i < arr_sent_friend_request_keys.length; i++) {
                    sent_friend_requests.push(sent_friend_requestsObj[arr_sent_friend_request_keys[i]]);
                    this.sent_friend_requests_indexed[arr_sent_friend_request_keys[i]] =
                        sent_friend_requestsObj[arr_sent_friend_request_keys[i]];
                }
            }
            var arr_friend_requests = [];
            for (let i in friend_requestsObj) {
                arr_friend_requests.push(friend_requestsObj[i].rid);
            }
            friend_requests = [];
            let friend_requests_diff = new Set(arr_friend_requests);
            if (arr_friend_requests.length > 0) {
                let arr_friend_request_keys = Array.from(friend_requests_diff.keys());
                for (i = 0; i < arr_friend_request_keys.length; i++) {
                    friend_requests.push(friend_requestsObj[arr_friend_request_keys[i]]);
                }
            }
            this.friend_request_count = friend_requests.length;
            this.graph.friend_requests = friend_requests;
            this.graph.sent_friend_requests = sent_friend_requests;
            return friend_requests;
        }
        _addGroup(identity, rid = "", requester_rid = "", requested_rid = "", refresh = true) {
            identity.collection = identity.parent
                ? identity.parent.username_signature
                : identity.collection || this.identity.collections.GROUP;
            rid =
                rid ||
                    this.generateRid(this.identity.identity.username_signature, identity.username_signature);
            requester_rid =
                requester_rid ||
                    this.generateRid(this.identity.identity.username_signature, this.identity.identity.username_signature, identity.collection);
            requested_rid =
                requested_rid ||
                    this.generateRid(identity.parent ? identity.collection : identity.username_signature, identity.parent ? identity.collection : identity.username_signature, identity.collection);
            if (requester_rid && requested_rid) {
                // get rid from bulletin secrets
            }
            else {
                requester_rid = "";
                requested_rid = "";
            }
            if (this.groups_indexed[requested_rid]) {
                return new Promise((resolve, reject) => {
                    return resolve(identity);
                });
            }
            let info = {};
            info[identity.collection] = identity;
            return this.transaction
                .generateTransaction({
                rid: rid,
                relationship: info,
                requested_rid: requested_rid,
                requester_rid: requester_rid,
                to: this.identity.publicKeyToAddress(identity.public_key),
            })
                .then((txn) => {
                return this.transaction.sendTransaction(txn);
            })
                .then(() => {
                return refresh ? this.getGroups(null, identity.collection, true) : null;
            })
                .then(() => {
                return new Promise((resolve, reject) => {
                    return resolve(identity);
                });
            });
        }
        getGroups(rid = null, collectionName = "group", ignoreCache = false) {
            const root = !rid;
            rid =
                rid ||
                    this.generateRid(this.identity.identity.username_signature, this.identity.identity.username_signature, collectionName);
            if (this.graph[collectionName + "s"] &&
                this.graph[collectionName + "s"].length > 0 &&
                !ignoreCache) {
                return new Promise((resolve, reject) => {
                    return resolve(null);
                });
            }
            return this.endpointRequest("get-graph-collection", { rids: rid })
                .then((data) => __awaiter(this, void 0, void 0, function* () {
                return this.parseGroups(data.collection, root, collectionName);
            }))
                .then((groups) => {
                return groups;
            });
        }
        parseGroups(groups, root = true, collection = "group") {
            // we must call getSentFriendRequests and getFriendRequests before getting here
            // because we need this.keys to be populated with the dh_public_keys and dh_private_keys from the requests
            // though friends really should be cached
            // should be key: shared-secret_rid|pub_key[:26]priv_key[:26], value: {shared_secret: <shared_secret>, friend: [transaction.dh_public_key, transaction.dh_private_key]}
            return new Promise((resolve, reject) => {
                //start "just do dedup yada server because yada server adds itself to the friends array automatically straight from the api"
                let promises = [];
                for (var i = 0; i < groups.length; i++) {
                    var group = groups[i];
                    if (!this.keys[group.rid]) {
                        this.keys[group.rid] = {
                            dh_private_keys: [],
                            dh_public_keys: [],
                        };
                    }
                    var decrypted;
                    var bypassDecrypt = false;
                    let failed = false;
                    try {
                        if (typeof group.relationship == "object") {
                            bypassDecrypt = true;
                        }
                        else {
                            decrypted = this.crypt.decrypt(group.relationship);
                        }
                        var relationship;
                        if (bypassDecrypt) {
                            relationship = group.relationship[collection];
                        }
                        else {
                            relationship = JSON.parse(decrypted);
                            if (!relationship[collection])
                                continue;
                            if (relationship[collection].collection !== collection)
                                continue;
                            group["relationship"] = relationship;
                        }
                    }
                    catch (err) {
                        console.log(err);
                        failed = true;
                    }
                    if (failed && this.groups_indexed[group.requester_rid]) {
                        try {
                            let parentGroup = this.getIdentityFromTxn(this.groups_indexed[group.requester_rid], collection);
                            if (parentGroup.public_key !== group.public_key)
                                continue;
                            if (typeof group.relationship == "object") {
                                bypassDecrypt = true;
                            }
                            else {
                                decrypted = this.crypt.shared_decrypt(parentGroup.username_signature, group.relationship);
                            }
                            var relationship;
                            if (bypassDecrypt) {
                                relationship = group.relationship[collection];
                            }
                            else {
                                relationship = JSON.parse(decrypted);
                                if (!relationship[collection])
                                    continue;
                                if (!relationship[collection].parent)
                                    continue;
                                if (relationship[collection].collection !== collection)
                                    continue;
                                group["relationship"] = relationship;
                            }
                        }
                        catch (err) {
                            console.log(err);
                            continue;
                        }
                    }
                    else if (failed && !this.groups_indexed[group.requester_rid]) {
                        continue;
                    }
                    if (!this.groups_indexed[group.requested_rid]) {
                        this.graph[collection + "s"].push(group);
                    }
                    this.groups_indexed[group.requested_rid] = group;
                    let group_username_signature;
                    if (group.relationship[this.identity.collections.SMART_CONTRACT]) {
                        group_username_signature =
                            group.relationship[collection].identity.username_signature;
                    }
                    else {
                        group_username_signature =
                            group.relationship[collection].username_signature;
                    }
                    if (collection === this.identity.collections.GROUP) {
                        this.groups_indexed[this.generateRid(group_username_signature, group_username_signature, this.identity.collections.GROUP_CHAT)] = group;
                        this.groups_indexed[this.generateRid(group_username_signature, group_username_signature, this.identity.collections.GROUP_MAIL)] = group;
                        this.groups_indexed[this.generateRid(group_username_signature, group_username_signature, this.identity.collections.CALENDAR)] = group;
                        this.groups_indexed[this.generateRid(group_username_signature, group_username_signature, this.identity.collections.GROUP_CALENDAR)] = group;
                    }
                    this.groups_indexed[this.generateRid(group_username_signature, group_username_signature, group_username_signature)] = group;
                    try {
                        if (!relationship.parent &&
                            !relationship[this.identity.collections.SMART_CONTRACT]) {
                            promises.push(this.getGroups(this.generateRid(group_username_signature, group_username_signature, group_username_signature), collection, true));
                        }
                    }
                    catch (err) {
                        console.log(err);
                    }
                }
                var arr_friends = Object.keys(this.groups_indexed);
                groups = [];
                let friends_diff = new Set(arr_friends);
                if (arr_friends.length > 0) {
                    let used_username_signatures = [];
                    let arr_friends_keys = Array.from(friends_diff.keys());
                    for (i = 0; i < arr_friends_keys.length; i++) {
                        if (!this.groups_indexed[arr_friends_keys[i]].relationship[this.identity.collections.GROUP] ||
                            used_username_signatures.indexOf(this.groups_indexed[arr_friends_keys[i]].relationship[this.identity.collections.GROUP].username_signature) > -1) {
                            continue;
                        }
                        else {
                            groups.push(this.groups_indexed[arr_friends_keys[i]]);
                            used_username_signatures.push(this.groups_indexed[arr_friends_keys[i]].relationship[this.identity.collections.GROUP].username_signature);
                        }
                    }
                }
                return Promise.all(promises).then((results) => {
                    return resolve(groups);
                });
            });
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
        generateRids(identity, identity2 = null, collection = null) {
            identity2 = identity2 || this.identity.identity;
            const rid = this.generateRid(identity.username_signature, identity2.username_signature);
            const requested_rid = this.generateRid(identity.username_signature, identity.username_signature, identity.collection);
            const requester_rid = this.generateRid(identity2.username_signature, identity2.username_signature, collection || identity2.collection);
            return {
                rid,
                requested_rid,
                requester_rid,
            };
        }
        isMe(identity) {
            if (!identity)
                return false;
            return (identity.username_signature === this.identity.identity.username_signature);
        }
        isAdded(identity) {
            if (!identity)
                return false;
            const rids = this.generateRids(identity);
            const addedToGroups = this.isChild(identity)
                ? !!(this.groups_indexed[rids.rid] ||
                    this.groups_indexed[rids.requested_rid] ||
                    this.groups_indexed[this.generateRid(identity.parent
                        ? identity.parent.username_signature
                        : identity.username_signature, identity.parent
                        ? identity.parent.username_signature
                        : identity.username_signature, identity.parent.username_signature)])
                : !!(this.groups_indexed[rids.rid] ||
                    this.groups_indexed[rids.requested_rid]);
            const friend_requested_rid = this.generateRid(identity.username_signature, identity.username_signature);
            const friend_rid = this.generateRid(identity.username_signature, this.identity.identity.username_signature);
            const addedToFriends = !!(this.friends_indexed[friend_rid] ||
                this.friends_indexed[friend_requested_rid]);
            return !!(addedToFriends || addedToGroups);
        }
        isRequested(identity) {
            if (!identity)
                return false;
            const friend_rid = this.generateRid(identity.username_signature, this.identity.identity.username_signature);
            return !!this.sent_friend_requests_indexed[friend_rid];
        }
        isGroup(identity) {
            if (!identity)
                return false;
            return (identity.collection &&
                identity.collection !== this.identity.collections.CONTACT);
        }
        isChild(identity) {
            if (!identity)
                return false;
            return !!identity.parent;
        }
        sortInt(list, key, reverse = false) {
            list.sort((a, b) => {
                if (parseInt(a[key]) > parseInt(b[key]))
                    return reverse ? 1 : -1;
                if (parseInt(a[key]) < parseInt(b[key]))
                    return reverse ? -1 : 1;
                return 0;
            });
        }
        sortAlpha(list, key, reverse = false) {
            list.sort((a, b) => {
                if (a[key] < b[key])
                    return reverse ? 1 : -1;
                if (a[key] > b[key])
                    return reverse ? -1 : 1;
                return 0;
            });
        }
        toDistinct(list, key) {
            const hashMap = {};
            for (let i = 0; i < list.length; i++) {
                hashMap[list[i][key]] = list[i];
            }
            const newList = [];
            for (let i = 0; i < Object.keys(hashMap).length; i++) {
                newList.push(hashMap[Object.keys(hashMap)[i]]);
            }
            return newList;
        }
        getIdentityFromTxn(item, collection) {
            if (!item)
                return;
            let col = collection || this.getNewTxnCollection(item);
            return item.relationship[col];
        }
        getParentIdentityFromTxn(item, collection) {
            if (!item)
                return;
            let identity = this.getIdentityFromTxn(item, collection);
            return identity && identity.parent;
        }
        getNewTxnCollection(txn) {
            for (let j = 0; j < Object.keys(this.identity.collections).length; j++) {
                const key = Object.keys(this.identity.collections)[j];
                const collection = this.identity.collections[key];
                const rid = this.identity.generateRid(this.identity.identity.username_signature, this.identity.identity.username_signature, collection);
                if (txn.rid === rid ||
                    txn.requester_rid === rid ||
                    txn.requested_rid === rid) {
                    return collection;
                }
                if (txn.relationship[collection])
                    return collection;
            }
            const collections = [
                this.identity.collections.GROUP_CHAT,
                this.identity.collections.GROUP_MAIL,
                this.identity.collections.GROUP_CALENDAR,
            ];
            for (let j = 0; j < Object.keys(this.groups_indexed).length; j++) {
                const group = this.getIdentityFromTxn(this.groups_indexed[Object.keys(this.groups_indexed)[j]], this.identity.collections.GROUP);
                for (let i = 0; i < collections.length; i++) {
                    const collection = collections[i];
                    const rid = this.identity.generateRid(group.username_signature, group.username_signature, collection);
                    if (txn.rid === rid ||
                        txn.requester_rid === rid ||
                        txn.requested_rid === rid) {
                        return collection;
                    }
                }
            }
        }
        addContact(contact, identity, portal) {
            return new Promise((resolve, reject) => {
                this.identity.addContactResolve = resolve;
                this.identity.addContactReject = reject;
                this.identity.openPortal({
                    method: "addcontact",
                    origin: "*",
                    portal,
                    message: {
                        contact,
                        identity,
                    },
                });
            });
        }
        addGroup(group, identity, portal) {
            return new Promise((resolve, reject) => {
                this.identity.addGroupResolve = resolve;
                this.identity.addGroupReject = reject;
                this.identity.openPortal({
                    method: "addgroup",
                    origin: "*",
                    portal,
                    message: {
                        group,
                        identity,
                    },
                });
            });
        }
        getGraph(identity, portal) {
            return new Promise((resolve, reject) => {
                this.identity.getGraphResolve = resolve;
                this.identity.getGraphReject = reject;
                this.identity.openPortal({
                    method: "getgraph",
                    origin: "*",
                    portal,
                    message: {
                        identity,
                    },
                });
            });
        }
        getCollection(collections, portal) {
            return new Promise((resolve, reject) => {
                this.identity.getCollectionResolve = resolve;
                this.identity.getCollectionReject = reject;
                this.identity.openPortal({
                    method: "collection",
                    origin: "*",
                    portal,
                    message: {
                        collections,
                    },
                });
            });
        }
        sendMail(params, portal) {
            return new Promise((resolve, reject) => {
                this.identity.sendMailResolve = resolve;
                this.identity.sendMailReject = reject;
                this.identity.openPortal({
                    method: "sendmail",
                    origin: "*",
                    portal,
                    message: params,
                });
            });
        }
        getMail(identity, collection, portal) {
            return new Promise((resolve, reject) => {
                this.identity.getMailResolve = resolve;
                this.identity.getMailReject = reject;
                this.identity.openPortal({
                    method: "getmail",
                    origin: "*",
                    portal,
                    message: {
                        identity,
                        collection,
                    },
                });
            });
        }
        getSharedSecrets() {
            return new Promise((resolve, reject) => {
                for (let i in this.keys) {
                    if (!this.stored_secrets[i]) {
                        this.stored_secrets[i] = [];
                    }
                    var stored_secrets_by_dh_public_key = {};
                    for (var ss = 0; ss < this.stored_secrets[i].length; ss++) {
                        stored_secrets_by_dh_public_key[this.stored_secrets[i][ss].dh_public_key +
                            this.stored_secrets[i][ss].dh_private_key] = this.stored_secrets[i][ss];
                    }
                    for (var j = 0; j < this.keys[i].dh_private_keys.length; j++) {
                        var dh_private_key = this.keys[i].dh_private_keys[j];
                        if (!dh_private_key)
                            continue;
                        for (var k = 0; k < this.keys[i].dh_public_keys.length; k++) {
                            var dh_public_key = this.keys[i].dh_public_keys[k];
                            if (!dh_public_key)
                                continue;
                            if (stored_secrets_by_dh_public_key[dh_public_key + dh_private_key]) {
                                continue;
                            }
                            var privk = new Uint8Array(dh_private_key.match(/[\da-f]{2}/gi).map(function (h) {
                                return parseInt(h, 16);
                            }));
                            var pubk = new Uint8Array(dh_public_key.match(/[\da-f]{2}/gi).map(function (h) {
                                return parseInt(h, 16);
                            }));
                            var shared_secret = this.crypt.toHex(X25519.getSharedKey(privk, pubk));
                            this.stored_secrets[i].push({
                                shared_secret: shared_secret,
                                dh_public_key: dh_public_key,
                                dh_private_key: dh_private_key,
                                rid: i,
                            });
                        }
                    }
                }
                return resolve(null);
            });
        }
    }
    exports.Graph = Graph;
});
//# sourceMappingURL=graph.js.map