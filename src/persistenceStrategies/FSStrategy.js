function FSStrategy(path){
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

    this.storeAndUnlock = function(diff, transactionHandler, callback){
        diff.forEach(entry => {
            // save (entry.uid, entry.state, entry.changes);
            lockedSVds[entry.uid] = undefined;
        });
        callback(undefined, true);
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

module.exports = FSStrategy;