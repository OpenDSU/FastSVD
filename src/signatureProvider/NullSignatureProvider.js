
function NullSignatureProvider(){
    this.sign = function (diff) {
        return "NULL";
    }
}

module.exports.create = function(){
    return new NullSignatureProvider();
}