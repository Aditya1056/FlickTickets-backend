const jwt = require('jsonwebtoken');

const HttpError = require('../util/httpError');

const checkAuth = (req, res, next) => {

    try{

        const authHeader = req.get('Authorization');

        if(!authHeader){
            throw new HttpError("Authentication failed", 401);
        }
        
        const token = authHeader.split(' ')[1];
        
        if(!token){
            throw new HttpError("Authentication failed", 401);
        }

        const decodedToken = jwt.verify(token, process.env.JWT_KEY);

        req.userId = decodedToken.userId;
        req.userRole = decodedToken.userRole;

        next();
    }
    catch(err){
        return next(err);
    }
}

module.exports = checkAuth;