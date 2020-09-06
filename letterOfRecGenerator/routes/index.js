var express = require('express');
var User = require('../models/user');
var router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');

router.use(function (req, res, next) {
    res.locals.userValue = null;
    next();
});

// Get Home Page
router.get('/', function (req, res, next) {
    res.render('pages/index', {
        title: 'Express',
        header: 'Add user'
    });
});

router.post('/', function (req, res) {
    var user = {
        name: {
            first: req.body.fname,
            last: req.body.lname
        }
    };
    User.createUser(user);
    res.render('pages/index', {
        title: 'Express',
        header: 'Add User',
        userValue: user.name,
        user: user
    });
});

module.exports = router;
