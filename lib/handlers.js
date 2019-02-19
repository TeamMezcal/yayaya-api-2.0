/*
 * Request Handlers
 *
 */

// Dependencies
var _data = require('./data');
var helpers = require('./helpers');

// Define all the handlers
var handlers = {};

// Ping
handlers.ping = function (data, callback) {
    callback(200);
};

// Not-Found
handlers.notFound = function (data, callback) {
    callback(404);
};

// Users
handlers.users = function (data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for all the users methods
handlers._users = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function (data, callback) {
    // Check that all required fields are filled out
    var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tosAgreement = typeof (data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;
    var address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address : false;
    var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length> 0 ? data.payload.email : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        // Make sure the user doesnt already exist
        _data.read('users', phone, function (err, data) {
            if (err) {
                // Hash the password
                var hashedPassword = helpers.hash(password);

                // Create the user object
                if (hashedPassword) {
                    //call random string helper to store user Id:
                    var userId = helpers.createRandomString(10)
                    var userObject = {
                        'id' : userId,
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'hashedPassword': hashedPassword,
                        'email' : email,
                        'address': address,
                        'tosAgreement': true
                    };

                    // Store the user
                    _data.create('users', phone, userObject, function (err) {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, {
                                'Error': 'Could not create the new user'
                            });
                        }
                    });
                } else {
                    callback(500, {
                        'Error': 'Could not hash the user\'s password.'
                    });
                }

            } else {
                // User alread exists
                callback(400, {
                    'Error': 'A user with that phone number already exists'
                });
            }
        });

    } else {
        callback(400, {
            'Error': 'Missing required fields'
        });
    }

};

// Required data: phone
// Optional data: none
handlers._users.get = function (data, callback) {
    // Check that phone number is valid
    var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {

        // Get token from headers
        var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
            if (tokenIsValid) {
                // Lookup the user
                _data.read('users', phone, function (err, data) {
                    if (!err && data) {
                        // Remove the hashed password from the user user object before returning it to the requester
                        delete data.hashedPassword;
                        callback(200, data);
                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(403, {
                    "Error": "Missing required token in header, or token is invalid."
                })
            }
        });
    } else {
        callback(400, {
            'Error': 'Missing required field'
        })
    }
};

// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
handlers._users.put = function (data, callback) {
    // Check for required field
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    console.log(phone)
    // Check for optional fields
    var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address : false;
    var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email : false;

    // Error if phone is invalid
    if (phone) {
        // Error if nothing is sent to update
        if (firstName || lastName || password || address || email) {
            console.log(data.payload)

            // Get token from headers
            var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

            // Verify that the given token is valid for the phone number
            handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
                if (tokenIsValid) {

                    // Lookup the user
                    _data.read('users', phone, function (err, userData) {
                        if (!err && userData) {
                            // Update the fields if necessary
                            if (firstName) {
                                userData.firstName = firstName;
                            }
                            if (address) {
                                userData.address = address;
                            }
                            if (email) {
                                userData.email = email;
                            }
                            if (lastName) {
                                userData.lastName = lastName;
                            }
                            if (password) {
                                userData.hashedPassword = helpers.hash(password);
                            }
                            // Store the new updates
                            _data.update('users', phone, userData, function (err) {
                                if (!err) {
                                    callback(200);
                                } else {
                                    callback(500, {
                                        'Error': 'Could not update the user.'
                                    });
                                }
                            });
                        } else {
                            callback(400, {
                                'Error': 'Specified user does not exist.'
                            });
                        }
                    });
                } else {
                    callback(403, {
                        "Error": "Missing required token in header, or token is invalid."
                    });
                }
            });
        } else {
            callback(400, {
                'Error': 'Missing fields to update.'
            });
        }
    } else {
        callback(400, {
            'Error': 'Missing required field.'
        });
    }

};

// Required data: phone
// @TODO Cleanup (delete) any other data files associated with the user
handlers._users.delete = function (data, callback) {
    // Check that phone number is valid
    var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {

        // Get token from headers
        var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

        // Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
            if (tokenIsValid) {
                // Lookup the user
                _data.read('users', phone, function (err, data) {
                    if (!err && data) {
                        _data.delete('users', phone, function (err) {
                            if (!err) {
                                callback(200);
                            } else {
                                callback(500, {
                                    'Error': 'Could not delete the specified user'
                                });
                            }
                        });
                    } else {
                        callback(400, {
                            'Error': 'Could not find the specified user.'
                        });
                    }
                });
            } else {
                callback(403, {
                    "Error": "Missing required token in header, or token is invalid."
                });
            }
        });
    } else {
        callback(400, {
            'Error': 'Missing required field'
        })
    }
};

// Tokens
handlers.tokens = function (data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for all the tokens methods
handlers._tokens = {};

// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = function (data, callback) {
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    if (phone && password) {
        // Lookup the user who matches that phone number
        _data.read('users', phone, function (err, userData) {
            if (!err && userData) {
                // Hash the sent password, and compare it to the password stored in the user object
                var hashedPassword = helpers.hash(password);
                if (hashedPassword == userData.hashedPassword) {
                    // If valid, create a new token with a random name. Set an expiration date 1 hour in the future.
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + 1000 * 60 * 60;
                    var tokenObject = {
                        'phone': phone,
                        'id': tokenId,
                        'expires': expires
                    };

                    // Store the token
                    _data.create('tokens', tokenId, tokenObject, function (err) {
                        if (!err) {
                            callback(200, tokenObject);
                        } else {
                            callback(500, {
                                'Error': 'Could not create the new token'
                            });
                        }
                    });
                } else {
                    callback(400, {
                        'Error': 'Password did not match the specified user\'s stored password'
                    });
                }
            } else {
                callback(400, {
                    'Error': 'Could not find the specified user.'
                });
            }
        });
    } else {
        callback(400, {
            'Error': 'Missing required field(s).'
        })
    }
};

// Tokens - get
// Required data: id
// Optional data: none
handlers._tokens.get = function (data, callback) {
    // Check that id is valid
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        // Lookup the token
        _data.read('tokens', id, function (err, tokenData) {
            if (!err && tokenData) {
                callback(200, tokenData);
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {
            'Error': 'Missing required field, or field invalid'
        })
    }
};

// Tokens - put
// Required data: id, extend
// Optional data: none
handlers._tokens.put = function (data, callback) {
    var id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    var extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
    if (id && extend) {
        // Lookup the existing token
        _data.read('tokens', id, function (err, tokenData) {
            if (!err && tokenData) {
                // Check to make sure the token isn't already expired
                if (tokenData.expires > Date.now()) {
                    // Set the expiration an hour from now
                    tokenData.expires = Date.now() + 1000 * 60 * 60;
                    // Store the new updates
                    _data.update('tokens', id, tokenData, function (err) {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, {
                                'Error': 'Could not update the token\'s expiration.'
                            });
                        }
                    });
                } else {
                    callback(400, {
                        "Error": "The token has already expired, and cannot be extended."
                    });
                }
            } else {
                callback(400, {
                    'Error': 'Specified user does not exist.'
                });
            }
        });
    } else {
        callback(400, {
            "Error": "Missing required field(s) or field(s) are invalid."
        });
    }
};


// Tokens - delete
// Required data: id
// Optional data: none
handlers._tokens.delete = function (data, callback) {
    // Check that id is valid
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        // Lookup the token
        _data.read('tokens', id, function (err, tokenData) {
            if (!err && tokenData) {
                // Delete the token
                _data.delete('tokens', id, function (err) {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, {
                            'Error': 'Could not delete the specified token'
                        });
                    }
                });
            } else {
                callback(400, {
                    'Error': 'Could not find the specified token.'
                });
            }
        });
    } else {
        callback(400, {
            'Error': 'Missing required field'
        })
    }
};

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function(id,phone,callback){
    // Lookup the token
    _data.read('tokens',id,function(err,tokenData){
      if(!err && tokenData){
        // Check that the token is for the given user and has not expired
        if(tokenData.phone == phone && tokenData.expires > Date.now()){
          callback(true);
        } else {
          callback(false);
        }
      } else {
        callback(false);
      }
    });
  };

//MEALS:
handlers.meals = function (data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._meals[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for all the meals methods
handlers._meals = {};

// Meals - post
// Required data: name, userID, description, igredients, portions, price, images, tags,
// Optional data: none
handlers._meals.post = function (data, callback) {
    
    // Check that all required fields are filled out
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone : false;

    var mealName = typeof (data.payload.mealName) == 'string' && data.payload.mealName.trim().length > 0 ? data.payload.mealName.trim() : false;
    var userId = typeof (userId) == 'string' && userId.trim().length == 10 ? userId.trim() : false;
    var description = typeof (data.payload.description) == 'string' && data.payload.description.trim().length > 0 ? data.payload.description.trim() : false;
    var ingredients = typeof (data.payload.ingredients) == 'object' && data.payload.ingredients instanceof Array && data.payload.ingredients.length > 0 ? data.payload.ingredients : false;
    var portions = typeof (data.payload.portions) == 'number' && data.payload.portions > 0 ? data.payload.portions : false;
    var price = typeof (data.payload.price) == 'number' && data.payload.price > 0 ? data.payload.price : false;
    var days = typeof (data.payload.days) == 'number' && data.payload.days > 0 ? data.payload.days : false;
    var tags = typeof (data.payload.tags) == 'object' && data.payload.tags instanceof Array && data.payload.tags.length > 0 ? data.payload.tags : false;
    //@TO-DO: add image 

    //Error if user failed  to fill any of the required fields:
    if(mealName && description && ingredients && portions && price && tags) {
        //Look up token in headers & get user Id through phone stored within:
        var token = data.headers.token;
        //Get user phone from token:
        
        //Check if a valid token was provided in headers:
        handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
            if (tokenIsValid) {
                //Search for user: 
                _data.read('users', phone, function(err, userData){
                    if (!err && userData){
            
                        //Call createRandomString to generate mealID:
                        var mealId = helpers.createRandomString(11)
                        //Create meal object:
                        var mealObject = {
                            'id' : mealId,
                            'user':userData.id,
                            'userPhone' : userData.phone,
                            'createdAt' : [Date().replace('(Central European Standard Time)', ''), Date.now()],
                            'expires' : Date.now() + 1000 * 60 * 60 * days,
                            'daysLeft' : `Good for ${days} days`, // should update in real time. initialised to value provided by user
                            'name' : mealName,
                            'description' : description,
                            'ingredients' : ingredients,
                            'portions' : portions,
                            'price' : price,
                            'tags' : tags
                        }
                        //Save meal to file:
                        _data.create('meals', mealId, mealObject, function(err){
                            if(!err){
                                callback(200, mealObject)
                            } else {
                                callback(500, 'Error creating meal: ', err)
                            }
                        })

                    }
                })
            } else {
                callback(403, {
                    "Error": "Missing required token in header, or token is invalid."
                });
            }
        });
    } else {
        callback(err, data.payload)
    }

};

//Meals GET:
//Required data: meal id (query)
//Optional data: NONE
handlers._meals.get = function(data, callback){
    //Check for valid id in query params:
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 11 ? data.queryStringObject.id.trim() : false;
    //Error if no id is present:
    if(id){
        
        //Search for meal:
        _data.read('meals', id, function(err, mealObject){
            if (!err && mealObject){
                
                //Get token from headers:
                var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
                //Check for valid and active token:
                handlers._tokens.verifyToken(token, mealObject.userPhone, function (tokenIsValid) {
                    if (tokenIsValid) {
                        
                        callback(200, mealObject)
                    } else {
                        callback(403, {
                            "Error": "Missing required token in header, or token is invalid."
                        })
                    }
                });
              
            } else {
                callback(400,'Unable to locate meal through provided id')
            }
        })


    }else {
        callback(400,'Missing query parameters')
    }
}

//Meals put:
//Required data: meal id (query)
//Optional data: mealName, description, ingredients, portions, price, tags

handlers._meals.put = function(data, callback){
     //Check for valid id in query params:
     
     var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 11 ? data.queryStringObject.id.trim() : false;
    //Check for optional data:
    var mealName = typeof (data.payload.mealName) == 'string' && data.payload.mealName.trim().length > 0 ? data.payload.mealName.trim() : false;
    var description = typeof (data.payload.description) == 'string' && data.payload.description.trim().length > 0 ? data.payload.description.trim() : false;
    var ingredients = typeof (data.payload.ingredients) == 'object' && data.payload.ingredients instanceof Array && data.payload.ingredients.length > 0 ? data.payload.ingredients : false;
    var portions = typeof (data.payload.portions) == 'number' && data.payload.portions > 0 ? data.payload.portions : false;
    var price = typeof (data.payload.price) == 'number' && data.payload.price > 0 ? data.payload.price : false;
    var tags = typeof (data.payload.tags) == 'object' && data.payload.tags instanceof Array && data.payload.tags.length > 0 ? data.payload.tags : false;


     //Error if no id is present:
     if(id){
         //Search for meal:
         _data.read('meals', id, function(err, mealData){
             if (!err && mealData){
                 
                 //Get token from headers:
                 var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
                 //Check for valid and active token:
                 handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
                     if (tokenIsValid) {
                         //Error if no data is provided for update:
                         if(mealName || description || ingredients || portions || price || tags){
                             if (mealName){
                                 mealData.name = mealName;                
                             }
                             if(description){
                                 mealData.description = description;
                             }
                             if(ingredients){
                                 mealData.ingredients = ingredients;
                             }
                             if(portions){
                                 mealData.portions = portions;
                             }
                             if(price){
                                 mealData.price = price;
                             }
                             if(tags){
                                 mealData.tags = tags
                             }
                             //Update meal:
                             _data.update('meals', mealData.id, mealData, function(err){
                                 if(!err){
                                     callback(200, "MEAL UPDATED")
                                 }
                             })
                
                         } else {
                             callback (400, {'Error':'Missing fields to update'})
                         }
                         
                         
                     } else {
                         callback(403, {
                             "Error": "Missing required token in header, or token is invalid."
                         })
                     }
                 });
    
             } else {
                 callback(400,'Unable to locate meal through provided id')
             }
         })

         
 
 
     }else {
         callback(400,'Missing query parameters')
     }
    
}


// Export the handlers
module.exports = handlers;