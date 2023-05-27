import { Identity } from "./identity";
import { encrypt, decrypt, PrivateKey } from "eciesjs";

declare var forge: any;
declare var Base64: any;

export class Crypt {
  identity: any;
  constructor(identity: Identity) {
    this.identity = identity;
  }

  encrypt(message: string) {
    var key = forge.pkcs5.pbkdf2(
      forge.sha256
        .create()
        .update(this.identity.identity.key.toWIF())
        .digest()
        .toHex(),
      "salt",
      400,
      32
    );
    var cipher = forge.cipher.createCipher("AES-CBC", key);
    var iv = forge.random.getBytesSync(16);
    cipher.start({ iv: iv });
    cipher.update(forge.util.createBuffer(iv + JSON.stringify(message)));
    cipher.finish();
    return cipher.output.toHex();
  }

  decrypt(message: string) {
    var key = forge.pkcs5.pbkdf2(
      forge.sha256
        .create()
        .update(this.identity.identity.key.toWIF())
        .digest()
        .toHex(),
      "salt",
      400,
      32
    );
    var decipher = forge.cipher.createDecipher("AES-CBC", key);
    var enc = this.hexToBytes(message);
    decipher.start({ iv: enc.slice(0, 16) });
    decipher.update(forge.util.createBuffer(enc.slice(16)));
    decipher.finish();
    return decipher.output.data;
  }

  publicEncrypt(message: any, public_key: any) {
    const data = Buffer.from(message);
    return encrypt(public_key, data).toString("hex");
  }

  publicDecrypt(message: string) {
    const decrypted = decrypt(
      this.identity.identity.key.d.toHex(),
      Buffer.from(this.hexToByteArray(message))
    ).toString();
    return decrypted;
  }

  shared_encrypt(shared_secret: any, message: any) {
    var key = forge.pkcs5.pbkdf2(
      forge.sha256.create().update(shared_secret).digest().toHex(),
      "salt",
      400,
      32
    );
    var cipher = forge.cipher.createCipher("AES-CBC", key);
    var iv = forge.random.getBytesSync(16);
    cipher.start({ iv: iv });
    cipher.update(forge.util.createBuffer(iv + Base64.encode(message)));
    cipher.finish();
    return cipher.output.toHex();
  }

  shared_decrypt(shared_secret: any, message: any) {
    var key = forge.pkcs5.pbkdf2(
      forge.sha256.create().update(shared_secret).digest().toHex(),
      "salt",
      400,
      32
    );
    var decipher = forge.cipher.createDecipher("AES-CBC", key);
    var enc = this.hexToBytes(message);
    decipher.start({ iv: enc.slice(0, 16) });
    decipher.update(forge.util.createBuffer(enc.slice(16)));
    decipher.finish();
    return Base64.decode(decipher.output.data);
  }

  hexToBytes(s: string) {
    var arr = [];
    for (var i = 0; i < s.length; i += 2) {
      var c = s.substr(i, 2);
      arr.push(parseInt(c, 16));
    }
    return String.fromCharCode.apply(null, arr);
  }

  hexToByteArray(str: any) {
    if (!str) {
      return new Uint8Array([]);
    }

    var a = [];
    for (var i = 0, len = str.length; i < len; i += 2) {
      a.push(parseInt(str.substr(i, 2), 16));
    }

    return new Uint8Array(a);
  }

  toHex(byteArray: any) {
    var callback = function (byte: any) {
      return ("0" + (byte & 0xff).toString(16)).slice(-2);
    };
    return Array.from(byteArray, callback).join("");
  }
}
