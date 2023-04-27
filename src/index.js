/*
    A SVDIdentifiers is in format svd:type:id
 */
function SVDIdentifier(svdUID){
    let parsed = svdUID.split(":");

    this.getUID = function(){
        return svdUID;
    }

    if(parsed[0] != "svd" && parsed.length != 3){
        throw new Error("Invalid SVD Unique identifier");
    }

    this.getType = function(){
        return parsed[1];
    }

    /* Type Unique ID */
    this.getId = function(){
        return parsed[2];
    }
}
/*
    Description is a JSON in format { [functionName:function1], actions : [action1, action2, ...] }
    The SVDBase instances will look like normal JS objects with methods from description and actions mixed together.
 */
function SVDBase(uid, typeName, state, description, session){
    let self = this;

    this.getUID = function(){
        return uid;
    }


    function generateReadOnlyFunction(f){
        return f.bind(self);
    }

    function generateModifier(fn, f){
        return function(...args){
            session.audit(self, fn, ...args)
            return f(...args);
        }.bind(self)
    }

    for(let fn in description){
        if(typeof description[fn] == 'function'){
            this[fn] = generateReadOnlyFunction(description[fn])
        }
    }

    let actions = description.actions;
    for(let fn in actions){
        if(this[fn] != undefined){
            throw new Error("Function name collision in action: " + fn);
        }
        this[fn] = generateModifier(fn, actions[fn])
    }

    if(state){
        for(let key in state){
            if(this[key] != undefined){
                throw new Error("State cant contain entries like functions. Key name collision in state: " + key);
            }
            this[key] = state[key];
        }
    } else {
        if(this.ctor){
            try{
                this.ctor();
            }catch (err){
                let newError = new Error("Ctor initialisation for" + typeName +" failed to run properly. See .previous for details");
                newError.previous = err;
                throw newError;
            }
        }
    }

    this.getState = function(){
        let state = {};
        for(let key in self){
            if(typeof self[key] != 'function'){
                state[key] = self[key];
            }
        }
        return state;
    }

}

function SVDPersistenceStrategyFS(path){
    let fs = require('fs');
    let lockedSVds = {};

    this.lock = function(uid, transactionHandler){
        if(lockedSVds[uid] != undefined){
            throw new Error("SVD already locked by transaction  " + lockedSVds[uid] + " and " + transactionHandler + " tried to lock it again)");
        }
        lockedSVds[uid] = transactionHandler;
    }

    this.loadState = function(uid, callback){
        fs.readFile(path + "/" + uid +"/state", 'utf8', callback);
    }
    function appendHistory(uid, newState, newDiff, callback){
        fs.write(path + "/" + uid + "/", history, function(){
            fs.writeFile(path + "/" + uid +"/audit/", newState);
        });
    }

    this.storeAndUnlock = function(diff, transactionHandler){
        diff.forEach(entry => {
            // save (entry.uid, entry.state, entry.changes);
            lockedSVds[entry.uid] = undefined;
        });
    }

    this.abortLocks = function(diff, transactionHandler){
        diff.forEach(entry => {
            if(lockedSVds[entry.uid] != transactionHandler){
                console.error("Transaction " + transactionHandler + " tried to abort transaction " + lockedSVds[entry.uid] + "on " + entry.uid + "without owning the lock")
            } else {
                lockedSVds[entry.uid] = undefined;
            }
        });
    }
}


function SVDFactory(persistenceStrategy){
    let typesRegistry = {};

    if(!SVDPersistenceStrategyFS){
        persistenceStrategy = new SVDPersistenceStrategyFS("./svds");
    }

    this.registerType  = function(typeName, description){
        typesRegistry[typeName] = description;
    }

    this.restore = function(svdId, session,callback){
        persistenceStrategy.loadState(svdId, function(err, state){
            if(err){
                callback(err);
                return;
            }
            callback(undefined, new SVDBase(state, typesRegistry[svdId.getType()], session));
        });
    }

    this.store = function(diff, transactionHandler, callback){
        persistenceStrategy.storeAndUnlock(diff, transactionHandler);
    }
}

function SVDSession(svdFactory){
    let currentSVDs = {};
    let self = this;

    this.lookup = function(svdId, callback){
        if(typeof svdId == 'string'){
            svdId = new SVDIdentifier(svdId);
        }
        let svdInstance = currentSVDs[svdId.getUID()];
        if(!svdInstance) {
                svdFactory.restore(svdId, self, function (err, svdInstance) {
                    currentSVDs[svdId.getUID()] = svdInstance;
                    callback(undefined, svdInstance);
                });
        } else {
            callback(undefined, svdInstance);
        }
    }
    let auditLog = {};
     function addAuditEntry(uid, fn, args){
        if(!auditLog[uid]){
            auditLog[uid] = [];
        }
        let entry = {
            fn: fn,
            args: args
        }
        auditLog[uid].push(entry);
    }

    let transactionHandler = undefined;
    this.beginTransaction = function(lockList, callback){
        if(transactionHandler != undefined){
            throw new Error("Transaction already in progress");
        }
        transactionHandler = crypto.randomBytes(32).toString('hex');
        if(!lockList){
            callback(undefined, transactionHandler);
        } else {
            let locksListClone = lockList.slice();
                function recursiveLock(){
                    if(locksListClone.length == 0){
                        callback(undefined, transactionHandler);
                    } else {
                        let uid = locksListClone.pop();
                        svdFactory.lock(uid, transactionHandler, function(err, res) {
                            if (err) {
                                self.abortTransaction();
                                callback(err);
                            }
                            recursiveLock();
                    });
                }
            }
        }
    }

    this.abortTransaction = function(){
        svdFactory.abortLocks(auditLog, transactionHandler);
        transactionHandler = undefined;
    }

    this.commitTransaction = function(callback){
        let diff = [];
        for(let uid in auditLog){
            let svdInstance = this.lookup(uid);
            diff.push({
                uid: uid,
                state: svdInstance.getState(),
                changes: auditLog[uid]
            })
        }
        svdFactory.store(diff, transactionHandler, callback);
        transactionHandler = undefined;
    }

    this.audit = function(svdInstance, fn, ...args){
         if(!transactionHandler){
             throw new Error("Modifiers must be called only during the transactions lifetimes");
         }
        console.log("Audit: ", svdInstance.getUID(), fn, args);
        addAuditEntry(svdInstance.getUID(), fn, args);
    }
}


module.exports = {
    createSVDSession: function(svdFactory){
        return new SVDSession(svdFactory);
    },
    createSVDPersistenceStrategyFS: function(path){
        return new SVDPersistenceStrategyFS(path);
    }

}