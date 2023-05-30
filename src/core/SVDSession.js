let SVDIdentifier = require("./SVDIdentifier.js");
function SVDSession(svdFactory){
    let currentSVDs = {};
    let self = this;


    this.create = function(svdId, ...args){
        if(typeof svdId == 'string'){
            svdId = new SVDIdentifier(svdId);
        }
        let svdInstance = svdFactory.create(svdId, self, ...args);
        currentSVDs[svdInstance.getUID()] = svdInstance;
        return svdInstance;
    }

    this.lookup = function(svdId, callback){
        if(typeof callback != 'function'){
            throw new Error("Invalid callback function");
        }

        setTimeout(function(){//force async behaviour
            if(typeof svdId == 'string'){
                svdId = new SVDIdentifier(svdId);
            }
            let svdInstance = currentSVDs[svdId.getUID()];
            if(!svdInstance) {
                svdFactory.restore(svdId, self, function (err, svdInstance) {
                    if(err){
                        return callback(err);
                    }

                    currentSVDs[svdId.getUID()] = svdInstance;
                    callback(undefined, svdInstance);
                });
            } else {
                callback(undefined, svdInstance);
            }
        }, 0);
    }

    this.lookupAsync = async function(svdId){
        //make callback in promise
        return new Promise((resolve, reject) => {
                self.lookup(svdId, (err, res) => {
                    if(err){
                        reject(err);
                    } else {
                        resolve(res);
                    }
                });
        });
    }

    let auditLog = {};
    function addAuditEntry(uid, nowValue, fn, args){
        if(typeof uid == 'object'){
            uid = uid.getUID();
        }
        if(!auditLog[uid]){
            auditLog[uid] = [];
        }
        let entry = {
            fn: fn,
            args: args,
            now: nowValue
        }
        auditLog[uid].push(entry);
    }

    let transactionHandler = undefined;
    this.beginTransaction = function(lockList, callback){
        if(transactionHandler != undefined){
            throw new Error("Transaction already in progress");
        }
        let crypto = require('crypto');

        transactionHandler = crypto.randomBytes(32).toString('hex');
        if(!lockList || lockList.length == 0){
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


    function detectDiffsToBeSaved(callback){
        let diff = [];
        let counter = 0;
        for(let uid in auditLog){
            counter++
            self.lookup(uid, function(err, svdInstance){
                diff.push({
                    uid: uid,
                    state: svdInstance.getState(),
                    changes: auditLog[uid],
                    now:Date.now()
                })
                counter--;
                if(counter == 0){
                    callback(diff);
                }
                if(counter < 0){
                    throw new Error("Counter can't be negative");
                }
            });
        }
    }

    function updateVersion (svdInfo){
        if(!svdInfo.state){
            svdInfo.state = {__version: 0};
        }

        if(!svdInfo.state.__version){
            svdInfo.state.__version = 0;
        }
        svdInfo.state.__version++;
    }

    this.commitTransaction = function(callback){
        detectDiffsToBeSaved(function(diff){

            diff.forEach( function(svdInfo){
                updateVersion(svdInfo);
            });
            //console.debug("Committing: ", diff);
            svdFactory.store(diff, transactionHandler, callback);
            transactionHandler = undefined;
        });
    }

    this.audit = function(svdInstance, fn, ...args){
        if(!transactionHandler){
            throw new Error("Modifiers must be called only during the transactions lifetimes");
        }
        //console.log("Audit: ", svdInstance.getUID(), fn, args);
        addAuditEntry(svdInstance.getUID(), svdInstance.__timeOfLastChange, fn, args);
    }
}

module.exports = SVDSession;