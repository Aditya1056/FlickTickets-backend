const { rateLimit } = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 2000,
    statusCode: 429,
    skip: req => req.method.toUpperCase() === 'OPTIONS',
    message: 'Too many requests to backend. Try after some time!',
    handler: (req, res, next) => {

        res.status(429).json({message: 'Server is busy. Try after some time!', data: {}});
    }
});

module.exports = limiter;