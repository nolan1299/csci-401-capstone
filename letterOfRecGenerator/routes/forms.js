var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
    const email = req.query.email;
    console.log(req.query);
    req.user.getForms(req.query, function(err, forms) {
        if (err) {
            console.log(`error: ${err}`);
        } else {
            res.json({forms});
        }
    });
});

module.exports = router;