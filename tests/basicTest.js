
let fastSVD = require("../src/index.js")
let crypto = require("crypto");
let fs = require("fs");
let assert = require("assert");
/*
test SVDSession style of working
 */

let persistence = fastSVD.createFSPersistence("./svds");
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
session.beginTransaction([], function(err, transactionHandler){
    let test1 = session.create("svd:test:test1", 1001);

    /*for(let i in test1){
        console.log(i, typeof test1[i],typeof test1[i] != "function" ? test1[i].toString() : "jscode");
    }*/
    assert.equal(test1.read(), 1001);
    test1.changeValue(1002);
    assert.equal(test1.read(), 1002);
    session.commitTransaction(function(err){
        let testSession = new fastSVD.createSession(factory);
        testSession.lookup("svd:test:test1", function(err, test2){
            assert.equal(err == undefined, true);
            assert.equal(test2.read(), 1002);
            console.log("Test ended successfully");
        });
    });
   // fs.unlinksync("./svds")
});