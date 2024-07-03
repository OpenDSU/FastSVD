let FSStrategy = require("./persistenceStrategies/FSStrategy.js");
let SVDFactory = require("./core/SVDFactory.js");
let SVDTransaction = require("./core/SVDSession.js");
let DefaultSignatureProvider = require("./signatureProvider/DefaultSignatureProvider.js");

const constants = require("./moduleConstants.js");


module.exports = {
    constants: constants,
    createTransaction: function (svdFactory) {
        return new SVDTransaction(svdFactory);
    },
    createFSPersistence: function (path) {
        return new FSStrategy(path);
    },
    createFactory: function (strategy, signatureProvider) {
        if (!strategy) {
            throw new Error("No strategy provided");
        }

        if (!signatureProvider) {
            signatureProvider = DefaultSignatureProvider.create();
        }

        return new SVDFactory(strategy, signatureProvider);
    }


}