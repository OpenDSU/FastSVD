let SVDBase = require("./SVDBase.js");
let FSStrategy = require("./persistenceStrategies/FSStrategy.js");
let SVDFactory = require("./SVDFactory.js");
let SVDSession = require("./SVDSession.js");
const constants = require("./moduleConstants.js");


module.exports = {
    constants: constants,
    createSession: function(svdFactory){
        return new SVDSession(svdFactory);
    },
    createFSPersistence: function(path){
        return new FSStrategy(path);
    },
    createFactory: function(strategy){
        if(!strategy)
        {
            strategy = new FSStrategy(path);
        }
        return new SVDFactory(strategy);
    }



}