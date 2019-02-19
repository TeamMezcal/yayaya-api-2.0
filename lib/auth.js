
const tokens  = require('./tokens')
const helpers = require ('./helpers')

const verifyUser = (email, token, callback) => {

    const _email = typeof(email) == 'string'  && email.trim().length   > 0 ? email.trim() : false
    const _token = typeof(token) == 'string' ? token : false

    if (_email && _token) {
        const userId = helpers.md5hash(_email)

        tokens.verifyToken(userId, token, err => {
            if (!err) {
                callback(true)
            } else {
                callback(false)
            }
        })
    } else {
        callback(false)
    }
}

module.exports = lib = {
    verifyUser: verifyUser,
}