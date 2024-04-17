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
    ctor: function (value) {
        this.value = value;
        this.selfRef = 0;
    },
    _ctor: function () {

    },
    read: function () {
        return this.value;
    },
    actions: {
        changeValue: function (newValue) {
            this.value = newValue;
            this.timeOfChange = this.now();
            this.getTransaction().lookup(this.getUID(), function (err, selfRefDummy) {
                selfRefDummy.selfRef++;
            });
        }
    }
})

let transaction = new fastSVD.createTransaction(factory);

let svdUid = "svd:test:test" + Math.floor(Math.random() * 100000);
transaction.begin([], function (err, transactionHandler) {
    assert.equal(err, undefined, "Error in transaction ");
    console.log("Transaction handler: ", transactionHandler);
    assert.notEqual(transactionHandler, "", "Transaction handler is empty");

    let test1 = transaction.create(svdUid, 1001);
    assert.equal(test1.read(), 1001);
    test1.changeValue(1002);
    assert.equal(test1.read(), 1002);
    test1.changeValue(1003);
    assert.equal(test1.read(), 1003);
    transaction.commit(function (err) {
        assert.equal(err, undefined, "Error in transaction");
        assert.notEqual(transactionHandler, "", "Transaction handler is empty");
        let testTransaction = new fastSVD.createTransaction(factory);
        testTransaction.lookup(svdUid, function (err, test2) {
            if (err) {
                console.log("Error: ", err);
            }
            assert.equal(err, undefined, "Error in lookup");
            assert.equal(test2.read(), 1003);
            console.log("Cleaning ", "./SVDS/" + svdUid);

            fs.rm("./SVDS/" + svdUid, {recursive: true, force: true}, function (err, res) {
                assert.equal(err, undefined, "Error in cleaning");
                console.log("Test ended successfully");
            });
        });
    });

});