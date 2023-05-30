
let fastSVD = require("../src/index.js")
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

let session = new fastSVD.createSession(factory);

let svdUid  = "svd:test:test" + Math.floor(Math.random() * 100000);
session.beginTransaction([], function(err, transactionHandler){
    assert.equal(err ,  undefined, "Error in transaction");
    assert.equal(transactionHandler != 0 , undefined, "Transaction handler is 0");

    let test1 = session.create(svdUid, 1001);
    assert.equal(test1.read(), 1001);
    test1.changeValue(1002);
    assert.equal(test1.read(), 1002);
    test1.changeValue(1003);
    assert.equal(test1.read(), 1003);
    session.commitTransaction(function(err){
        assert.equal(err ,  undefined, "Error in transaction");
        assert.equal(transactionHandler != 0 , undefined, "Transaction handler is 0");
        let testSession = new fastSVD.createSession(factory);
        testSession.lookup(svdUid, function(err, test2){
            if(err){
                console.log("Error: ", err);
            }
            assert.equal(err , undefined, "Error in lookup");
            assert.equal(test2.read(), 1003);
            console.log("Cleaning ", "./SVDS/" + svdUid);

            fs.rm("./SVDS/" + svdUid, { recursive: true, force: true }, function(err,res){
                assert.equal(err , undefined, "Error in cleaning");
                console.log("Test ended successfully");
            });
        });
    });

});