HDKey.prototype.deriveChild = function(index) {
    var indexBuffer = Buffer.allocUnsafe(4);
    indexBuffer.writeUInt32BE(index, 0);

    var data = Buffer.concat([this.publicKey, indexBuffer]);

    var I = crypto
        .createHmac("sha512", this.chainCode)
        .update(data)
        .digest();
    var IL = I.slice(0, 32);
    var IR = I.slice(32);

    var hd = new HDKey(this.versions);

    if (this.privateKey) {
        hd.privateKey = secp256k1.privateKeyTweakAdd(this.privateKey, IL);
    } else {
        hd.publicKey = secp256k1.publicKeyTweakAdd(this.publicKey, IL, true);
    }

    hd.chainCode = IR;
    hd.index = index;

    return hd;
};