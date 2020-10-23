var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
    req.user.getForms("scottmai@usc.edu",function(err, forms) {
        if (err) {
            console.log(`error: ${err}`);
        } else {
            res.json({forms});
        }
    });
});

module.exports = router;