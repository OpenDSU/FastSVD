let SVDBase = require("./core/SVDBase.js");
let FSStrategy = require("./persistenceStrategies/FSStrategy.js");
let SVDFactory = require("./core/SVDFactory.js");
let SVDSession = require("./core/SVDSession.js");
const constants = require("./moduleConstants.js");


module.exports = {
    constants: constants,
    createSession: function(svdFactory){
        return new SVDSession(svdFactory);
    },
    createFSPersistence: function(path){
        return new FSStrategy(path);
    },
    createFactory: function(strategy, signatureProvider){
        if(!strategy)
        {
            strategy = new FSStrategy(path);
        }
        return new SVDFactory(strategy, signatureProvider);
    }



}