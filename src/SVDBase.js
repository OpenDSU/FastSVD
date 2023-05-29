const constants = require("./moduleConstants");
/*
    Description is a JSON in format { [functionName:function1], actions : [action1, action2, ...] }
    The SVDBase instances will look like normal JS objects with methods from description and actions mixed together.
 */

function SVDBase( svdIdentifier, state, description, session, callCtor){
    let self = this;

    this.getUID = function(){
        return svdIdentifier.getUID();
    }

    function generateReadOnlyFunction(f){
        return f.bind(self);
    }

    function generateModifier(fn, f){
        let boundFunc = f.bind(self);
        return function(...args){
            session.audit(self, fn, ...args)
            return boundFunc(...args);
        }.bind(self)
    }

    for(let fn in description){
        if(typeof description[fn] == 'function'){
            this[fn] = generateReadOnlyFunction(description[fn])
        }
    }

    let actions = description[constants.ACTIONS];
    if(actions == undefined){
        throw new Error("No actions defined for destiption of SVD  " + svdIdentifier.getType() + "  !!! actions:{} is mandatory" );
    }
    for(let fn in actions){
        if(this[fn] != undefined){
            throw new Error("Function name collision in action: " + fn);
        }
        this[fn] = generateModifier(fn, actions[fn])
    }



    if(callCtor)
    {
        if(this.ctor){
            try{
                session.audit(self, "ctor", ...state);
                this.ctor(...state);
            }catch (err){
                let newError = new Error("Ctor initialisation for" + svdIdentifier.getTypeName() +" failed to run properly. See .previous for details");
                newError.previous = err;
                throw newError;
            }
        } else {
            throw new Error("Ctor not defined for " + svdIdentifier.getTypeName());
        }
    } else {
        if(state){
            for(let key in state){
                if(this[key] != undefined){
                    throw new Error("State cant contain functions. Key name collision in state: " + key);
                }
                this[key] = state[key];
            }
        }
    }

    this.getState = function(){
        let state = {};
        for(let key in self){
            if(typeof self[key] != 'function'){
                state[key] = self[key];
            }
        }
        return state;
    }

}

module.exports = SVDBase;