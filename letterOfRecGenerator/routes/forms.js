var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
    const email = req.query.email;
    console.log({email})
    req.user.getForms(email, function(err, forms) {
        if (err) {
            console.log(`error: ${err}`);
        } else {
            res.json({forms});
        }
    });
});

module.exports = router;