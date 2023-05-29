
let fastSVD = require("../src/index.js")
let crypto = require("crypto");
let fs = require("fs");
let assert = require("assert");
/*
test SVDSession style of working
 */

let persistence = fastSVD.createFSPersistence("./SVDS/");
let factory = new fastSVD.createFactory(persistence);

factory.registerType("test", {
        ctor: function(value){
                this.value = value;
        },
        read: function(){
                return this.value;
        },
        actions: {
            changeValue: function(newValue){
                this.value = newValue;
            }
        }
})

let session = new fastSVD.createSession(factory);

let svdUid  = "svd:test:test" + Math.floor(Math.random() * 100000);
session.beginTransaction([], function(err, transactionHandler){
    let test1 = session.create(svdUid, 1001);

    assert.equal(test1.read(), 1001);
    test1.changeValue(1002);
    assert.equal(test1.read(), 1002);
    test1.changeValue(1003);
    assert.equal(test1.read(), 1003);
    session.commitTransaction(function(err){
        let testSession = new fastSVD.createSession(factory);
        testSession.lookup(svdUid, function(err, test2){
            console.log(err && err.stack);
            assert.equal(err == undefined, true);
            assert.equal(test2.read(), 1003);
            console.log("Test ended successfully");
        });
    });
   // fs.unlinksync("./svds")
});