
let fastSVD = require("../src/index.js")
let crypto = require("crypto");
let fs = require("fs");
let assert = require("assert");
/*
test SVDSession style of working
 */

let persistence = fastSVD.createFSPersistence("./SVDS/");
let signatureProvider = require("../src/signatureProvider/MockProvider.js").create();


let factory = new fastSVD.createFactory(persistence, signatureProvider);

factory.registerType("test", {
        ctor: function(value){
                this.value = value;
                this.selfRef = 0;
        },
        read: function(){
                return this.value;
        },
        actions: {
            changeValue: function(newValue){
                this.value = newValue;
                this.timeOfChange  = this.getSession().now();
                 this.getSession().lookup(this.getUID(), function(err,  selfRefDummy){
                    selfRefDummy.selfRef++;
                });
            }
        }
})



let svdUid1  = "svd:test:test" + Math.floor(Math.random() * 100000);
let svdUid2  = "svd:test:test" + Math.floor(Math.random() * 100000);

function createSvd(svdUid, value, callback){
    let session = new fastSVD.createSession(factory);
    session.beginTransaction([], function(err, transactionHandler){
        let svd = session.create(svdUid, value);
        session.commitTransaction(function(err){
            callback(err, svd);
        });
    });
}
function changeSVD(svdUid, value, callback){
    let session = new fastSVD.createSession(factory);
    session.beginTransaction([], function(err, transactionHandler){
        let svd = session.lookup(svdUid, function(err, svd){
            svd.changeValue(value);
            session.commitTransaction(function(err){
                callback(err, svd);
            });
        });
    });
}

function changeTwoSVDs(svdUid1, svdUid2, value1, value2, callback){
    let session = new fastSVD.createSession(factory);
    session.beginTransaction([], function(err, transactionHandler){
        let svd1 = session.lookup(svdUid1, function(err, svd1){
            let svd2 = session.lookup(svdUid2, function(err, svd2){
                svd1.changeValue(value1);
                svd2.changeValue(value2);
                session.commitTransaction(function(err){
                    callback(err, svd1, svd2);
                });
            });
        });
    });
}

createSvd(svdUid1, 1001, function(err, svd){
        createSvd(svdUid2, 2001, function(err, svd){
            changeSVD(svdUid1, 1002, function(err, svd){
                changeSVD(svdUid2, 2002, function(err, svd){
                    changeSVD(svdUid1, 1003, function(err, svd){
                        changeSVD(svdUid2, 2003, function(err, svd){
                            changeTwoSVDs(svdUid1, svdUid2, 1004, 2004, function(err, svd1, svd2){
                                let testSession = new fastSVD.createSession(factory);
                                testSession.lookup(svdUid1, function(err, test1){
                                    testSession.lookup(svdUid2, function(err, test2){
                                        assert.equal(test1.read(), 1004);
                                        assert.equal(test2.read(), 2004);
                                        console.log("Cleaning ", "./SVDS/" + svdUid1);
                                        console.log("Cleaning ", "./SVDS/" + svdUid2);
                                        fs.rm("./SVDS/" + svdUid1, { recursive: true, force: true }, function(err,res){
                                            fs.rm("./SVDS/" + svdUid2, { recursive: true, force: true }, function(err,res){
                                                console.log("Test ended successfully");
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
});

