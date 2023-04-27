function SVDIdentifier(svdUID){
    if(typeof svdUID != "string"){
        console.log("SVDIdentifier: svdUID is not a string ")
        svdUID = svdUID.getUID();
    }
    let parsed = svdUID.split(":");

    this.getUID = function(){
        return svdUID;
    }

    if(parsed[0] != "svd" && parsed.length != 3){
        console.log(parsed, svdUID);
        throw new Error("Invalid SVD Unique identifier " + svdUID + " !!! Expected format: svd:<type>:<id>");
    }

    this.getTypeName = function(){
        return parsed[1];
    }

    /* Type Unique ID */
    this.getId = function(){
        return parsed[2];
    }
}

module.exports = SVDIdentifier;