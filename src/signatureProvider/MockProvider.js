
function MockSignatureProvider(){
    this.sign = function (diff) {
        return "Mock Signature for " + JSON.stringify(diff);
    }
}

module.exports.create = function(){
    return new MockSignatureProvider();
}