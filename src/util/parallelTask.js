function ParallelTasks(callback){
    let counter = 0;
    let self = this;
    let res = [];
    let alreadyReturned = false;

    this.addTask = function(func){
        counter++;
        func(function(err, res){
            if(err){
                return self.onEnd(err);
            }
            if(res != undefined){
                res.push(res);
            } else {
                console.log("Parallel task returned undefined", res, counter);
            }
            counter--;
            if(counter == 0){
                self.onEnd(undefined,res);
            }
        });
    }

    this.onEnd = function(fail, res) {
        if(!alreadyReturned){
            alreadyReturned = true;
            callback(fail, res);
        }
    }


}
module.exports.createNewParallelTaskRunner = function(callback){
    return new ParallelTasks(callback);
};