var express = require('express');
var router = express.Router();
var db = require('../db')
var fs = require('fs')

/* GET Templates page. */
router.get('/', function(req, res, next) {
    var currLetterTemplate = __dirname + '/uploads/' + 'letterTemplate';
    if (!fs.existsSync(currLetterTemplate)) {
        currLetterTemplate = '';
    }

    req.user.getForms((err, forms) => {
        if (err) {
            console.log(err);
            return;
        }

        var templates = req.user.getTemplates().toObject();
        var tmp_metric = {};
        var last_used = {};
        for (var i = 0; i < forms.length; i++) {
            if (forms[i].template) {
                var tmp_id = forms[i].template._id;
                if (!tmp_metric[tmp_id]) {
                    tmp_metric[tmp_id] = 0;
                }
                tmp_metric[tmp_id]++;
                last_used[tmp_id] = forms[i]._id.getTimestamp();
            }
        }
        for (var i = 0; i < templates.length; i++) {
            var tmp_id = templates[i]._id;
            let creation_date = templates[i]._id.getTimestamp();
            templates[i].creation_date = creation_date;
            templates[i].metric = tmp_metric[tmp_id.toString()] ?
                tmp_metric[tmp_id.toString()] :
                0;
            templates[i].last_used = last_used[tmp_id.toString()] ?
                last_used[tmp_id.toString()] :
                0;
        }

        res.render('pages/template-dashboard', {
            title: 'Templates',
            templates: templates,
            emailtemplates: req.user.getEmailTemplates(),
            letterTemplate: currLetterTemplate,
        });
    });
});

router.post('/delete', function(req, res, next) {
    var user = req.user;
    user.deactivateTemplate(req.body.id, function(err) {
        if (err) {
            console.log(err);
        } else {
            res.render('pages/template-dashboard', {
                title: 'Templates',
                templates: req.user.getTemplates(),
                emailtemplates: req.user.getEmailTemplates(),
            });
        }
    });
});

router.post('/delete-email', function(req, res, next) {
    var user = req.user;
    user.deactivateEmailTemplate(req.body.id, function(err) {
        if (err) {
            console.log(err);
        } else {
            res.render('pages/template-dashboard', {
                title: 'Templates',
                templates: req.user.getTemplates(),
                emailtemplates: req.user.getEmailTemplates(),
            });
        }
    });
});

router.post('/uploadLetterTemplate', function(req, res, next) {
    console.log(req.files.file);
    // console.log(req)
    var file = req.files.file;

    var filePath = __dirname + '/uploads/' + 'letterTemplate';
    file.mv(filePath, function(err) {
        if (err) {
            return res.status(500).send(err);
        }
    });

    console.log("about to print file;::");
    console.log(file);

})

module.exports = router;