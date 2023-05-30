/*
    A SVDIdentifiers is in format svd:type:id
 */
const FSStrategy = require("../persistenceStrategies/FSStrategy");
const SVDBase = require("./SVDBase");


function SVDFactory(persistenceStrategy, signatureProvider){
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

    this.store = function(changesForAllSVDS, transactionHandler, callback){
        changesForAllSVDS.forEach(entry => {
            entry.signature = signatureProvider.sign(entry.state.__version, entry.changes);
        })
        //console.debug("Storing diff: ", changesForAllSVDS);
        persistenceStrategy.storeAndUnlock(changesForAllSVDS, transactionHandler, callback);
    }

    this.create = function(svdId,  session, ...args){
         return new SVDBase(svdId, args, typesRegistry[svdId.getTypeName()], session, true);
    }
}

module.exports = SVDFactory;