/*
    A SVDIdentifiers is in format svd:type:id
 */
const FSStrategy = require("./persistenceStrategies/FSStrategy");
const SVDBase = require("./SVDBase");
const SVDIdentifier = require("./SVDIdentifier");

function SVDFactory(persistenceStrategy){
    let typesRegistry = {};

    if(!persistenceStrategy){
        persistenceStrategy = new FSStrategy("./svds");
    }

    this.registerType  = function(typeName, description){
        typesRegistry[typeName] = description;
    }

    this.restore = function(svdId, session, callback){
        persistenceStrategy.loadState(svdId, function(err, state){
            if(err){
                callback(err);
                return;
            }
            callback(undefined, new SVDBase(svdId, state, typesRegistry[svdId.getTypeName()], session, false));
        });
    }

    this.store = function(diff, transactionHandler, callback){
        persistenceStrategy.storeAndUnlock(diff, transactionHandler, callback);
    }

    this.create = function(svdId,  session, ...args){
         return new SVDBase(svdId, args, typesRegistry[svdId.getTypeName()], session, true);
    }
}

module.exports = SVDFactory;