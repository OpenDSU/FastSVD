let FSStrategy = require("./persistenceStrategies/FSStrategy.js");
let SVDFactory = require("./core/SVDFactory.js");
let SVDTransaction = require("./core/SVDSession.js");
let NullSignatureProvider = require("./signatureProvider/NullSignatureProvider.js");

const constants = require("./moduleConstants.js");


module.exports = {
    constants: constants,
    createTransaction: function(svdFactory){
        return new SVDTransaction(svdFactory);
    },
    createFSPersistence: function(path){
        return new FSStrategy(path);
    },
    createFactory: function(strategy, signatureProvider){
        if(!strategy)
        {
            strategy = new FSStrategy(path);
        }

        if(!signatureProvider)
        {
            signatureProvider = NullSignatureProvider.create();
        }
        
        return new SVDFactory(strategy, signatureProvider);
    }



}