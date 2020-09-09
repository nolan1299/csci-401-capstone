var express = require('express');
var app = express();
var router = express.Router();
var nodemailer = require('nodemailer');
var Form = require('../models/form');
var Link = require('../models/link');
var credentials = require('../config/auth');
var googleAuth = require('google-auth-library');
var {google} = require('googleapis');
var OAuth2 = google.auth.OAuth2;
const fs = require('fs');
var Docxtemplater = require('docxtemplater');
var DocxMerger = require('docx-merger');
var Readable = require('stream').Readable;
var path = require('path');
var builder = require('docx-builder')
var docx = new builder.Document();
var dt = require('./letter-parser')

"use strict";

router.use(function (req, res, next) {
    res.locals.statusMessage = null;
    next();
});

/**
 * data needed to render recommender-dashboard
 */
router.get('/', function (req, res, next) {
    req.user.getForms(function (err, forms) {
        if (err) {
            console.log(`error: ${err}`);
        } else {
            res.render('pages/recommender-dashboard', {
                title: req.user.displayName,
                templates: req.user.getTemplates(),
                forms: forms,
                subject: req.user.getLinkTemplateSubject(),
                body: req.user.getLinkTemplateBody()
            });
        }
    });
});

router.post('/', function (req, res, next) {
  var currentUser = req.user;
  var userId = currentUser._id;
  var subject = req.body.subject_text;
  var toEmail = req.body.email;
  var body = req.body.body_text;

  if (!toEmail.length) {
      res.render('pages/recommender-dashboard', {
          title: 'Recommendations',
          statusMessage: 'Please provide a valid email'
      });
      return;
  }

  Form.createForm(toEmail, req.user.getTemplate(req.body.templateId), userId, function (err, form) {
    if (err) {
        console.log(`error: ${err}`);
    } else {
        req.user.addForm(form, function (err) {
            if (err) {
                console.log(`error: ${err}`);
                return;
            }
      });

    var url = encodeURI('/form-entry/' + form.getLink());

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
          user: 'letterrecommender@gmail.com', // generated ethereal user
          pass: 'USCPassword123!'  // generated ethereal password
      },
      tls:{
        rejectUnauthorized:false
      }
    });

    // setup email data with unicode symbols
    let mailOptions = {
        from: '"Letter of Recommendation Generator" <letterrecommender@gmail.com>', // sender address
        to: req.body.email, // list of receivers
        subject: req.body.subject_text, // Subject line
        text: req.body.body_text + ' ' + url, // plain text body
        html: '<p>' + req.body.body_text + ' ' + url + '</p>'// html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        res.render('contact', {msg:'Email has been sent'});
    });

    res.redirect('/recommender-dashboard');
    }
  });
});

router.post('/delete', function (req, res, next) {
    var user = req.user;

    user.removeForm(req.body.id, function (err) {
        if (err) {
            console.log(err);
        } else {
            req.user.getForms(function (err, forms) {
                if (err) {
                    console.log(`error: ${err}`);
                } else {
                    res.render('pages/recommender-dashboard', {
                        title: 'Welcome ' + req.user.displayName + '!',
                        templates: req.user.getTemplates(),
                        forms: forms,
                    });
                }
            });
        }
    });
});

router.post('/update', function (req, res, next) {
    var user = req.user;

    user.update_linkTemplate_subject(req.body.subject, function (err) {
        if (err) {
            console.log("error in update_linkTemplate_subject: " + err);
            res.send(err);
        } else {
            user.update_linkTemplate_body(req.body.body, function (err) {
                if (err) {
                    console.log("error in update_linkTemplate_body: " + err);
                    res.send(err);
                } else {
                    res.json({
                        success: "Updated Successfully",
                        status: 200
                    });
                }
            });
        }
    });
});

module.exports = router;
