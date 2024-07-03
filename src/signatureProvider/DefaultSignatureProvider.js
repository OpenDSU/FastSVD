function DefaultSignatureProvider() {
    const openDSU = require('opendsu');
    const crypto = openDSU.loadAPI('crypto');
    const keySSISpace = openDSU.loadAPI('keyssi');
    const templateSeedSSI = keySSISpace.createTemplateSeedSSI("default");
    const constants = openDSU.constants;
    this.sign = (privateKey, data) => {
        const signFn = crypto.getCryptoFunctionForKeySSI(templateSeedSSI, constants.CRYPTO_FUNCTION_TYPES.SIGN);
        return signFn(data, privateKey);
    }
    this.verify = (publicKey, data, signature) => {
        const verifyFn = crypto.getCryptoFunctionForKeySSI(templateSeedSSI, constants.CRYPTO_FUNCTION_TYPES.VERIFY);
        return verifyFn(data, publicKey, signature);
    }
}

module.exports.create = function () {
    return new DefaultSignatureProvider();
}