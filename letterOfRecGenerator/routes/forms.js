var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
    let template = null;
    template = req.query.template;
    console.log({before: req.query})
    delete req.query.template;
    console.log({after: req.query});
    req.user.getForms(function(err, forms) {
        if (err) {
            console.log(`error: ${err}`);
        } else {
            if (template) {
                console.log({forms});
                console.log({template});
                res.json({forms: forms.filter(form => form.template.name === template)});
            }
            else {
                res.json({forms});  
            }                     
        }
    }, req.query);
});

module.exports = router;