function FSStrategy(path){
    let fs = require('fs');
    let lockedSVds = {};

    this.lock = function(uid, transactionHandler){
        let stringUID = uid.getUID();
        if(lockedSVds[uid] != undefined){
            throw new Error("SVD already locked by transaction  " + lockedSVds[stringUID] + " and " + transactionHandler + " tried to lock it again)");
        }
        lockedSVds[stringUID] = transactionHandler;
    }

    this.storeAndUnlock = function(diff, transactionHandler, callback){
        let parallelTaskRunner = require("../util/parallelTask").createNewParallelTaskRunner(callback);
        let self = this;

        let getTask = function(entry){
            return (callback) => {
                //console.log("storeAndUnlock: ", entry.uid, " with ", entry.changes.length, " changes: ", entry.changes);
                saveSVD(entry.uid, entry.state, entry.changes, entry.signature, callback);
                lockedSVds[entry.uid] = undefined;
            }
        }
        diff.forEach(entry => {
            parallelTaskRunner.addTask(getTask(entry));
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

    this.loadState = function(uid, callback){
        let stringUID = uid.getUID();
        fs.readFile(path + "/" + stringUID +"/state", 'utf8', function(err, res) {
            if(err){
                return callback(err);
            }
            try{
                let obj = JSON.parse(res);
                callback(undefined, obj);
            }catch(err){
                callback(err);
            }
        });
    }
    function saveSVD(stringUID, svdState, changes, signature, callback){
        let dirPath = path + "/" + stringUID + "/";
        fs.mkdir(dirPath, function(){
            fs.writeFile(dirPath+ "/state", JSON.stringify(svdState), function(){
                let auditEntry = {
                    changes: changes,
                    signature: signature
                }
                //make stringify as an audit single line removing all newlines
                let auditLogLine = JSON.stringify(auditEntry).replace(/\n/g, " ");
                fs.appendFile(path + "/" + stringUID +"/history", auditLogLine + "\n", callback );
            });
        });
    }
}

module.exports = FSStrategy;