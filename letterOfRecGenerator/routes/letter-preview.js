var express = require('express');
var router = express.Router();
var Form = require('../models/form');
var nodemailer = require('nodemailer');
var credentials = require('../config/auth');
var googleAuth = require('google-auth-library');
var { google } = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var letterParser = require('./letter-parser');
//const HummusRecipe = require('hummus-recipe');
var PizZip = require('pizzip');
var Docxtemplater = require('docxtemplater');

var fs = require('fs');
var path = require('path');
var User = require('../models/user');


//const Readable = require('stream').Readable;
//const fileUpload = require('express-fileupload');
//const opn = require('opn')
//const downloadsFolder = require('downloads-folder');

//docx stuff
const docx = require('docx');
const request = require('request');
const { Document, Paragraph, Packer } = docx;


router.get('/', function (req, res, next) {
    req.user.getForm(req.query.id, function (err, form) {
        if (err) {
            console.log("get /  error in letter-preivew: " + err );
        } else {
            res.render('pages/letter-preview', {
                title: form.email,
                id: req.query.id,
                form: form,
            });
        }
    });
});

router.get('/form', function (req, res, next) {
    req.user.getForm(req.query.id, function (err, form) {
        if (err) {
            console.log(err);
        } else {
            res.json(form);
        }
    });
});


router.post('/save', function (req, res, next) {
    Form.completeForm(req.body.id, req.body.letter, function (err, form) {
        if (err) {
            console.log(err);
        } else {
            res.render('pages/letter-preview', {
                title: form.email,
                id: req.query.id,
                form: form,
            });
        }
    });
});

router.post('/templateUpload', function (req,res, next) {
      const filePath = __dirname + '/uploads/' + 'letterTemplate';
      try {
        if (fs.existsSync(filePath)){
            console.log("Template uploaded!");

            var pulled_text; //text that were getting and moving to docxtemplater
            //console.log(req.query.id);
            //console.log(req);

            req.user.getForm(req.body.formID, function (err, form) {
                if (err) {
                    console.log(err);
                } else {

                    //console.log(form);
                    pulled_text = form.letter;
                    res.json(form);

                    console.log(pulled_text);
                    var formatted_text = letterParser.htmlstuff(pulled_text);

                    var content = fs.readFileSync(filePath, 'binary');

                    var zip = new PizZip(content);

                    var doc = new Docxtemplater();
                    doc.loadZip(zip);
                    //enable linebreaks
                    doc.setOptions({linebreaks:true});

                    console.log("2");
                    //set the templateVariables
                    var date_raw = req.body.date;
                    var actual_date = letterParser.getDate(date_raw);
                    doc.setData({

                        //text with the line breaks included
                        date: actual_date,
                        description: formatted_text
                    });

                    try {
                        // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
                        doc.render()
                    }
                    catch (error) {
                        var e = {
                            message: error.message,
                            name: error.name,
                            stack: error.stack,
                            properties: error.properties,
                        }
                        console.log(JSON.stringify({error: e}));
                        // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
                        throw error;
                    }
                    var buf = doc.getZip()
                    .generate({type: 'nodebuffer'});

                    // buf is a nodejs buffer, you can either write it to a file or do anything else with it.
                    fs.writeFileSync(path.resolve('./routes/uploads', 'output.docx'), buf);

                    console.log("4");
                }
            });
        }
        else {
            //it doesnt exist
            //create file using blank page
            console.log("Template not uploaded");
            console.log(req.body.formID);
            console.log("user:**********************");
            console.log(req.user._id);

            var pulled_text; //text that were getting and moving to docxtemplater

            req.user.getForm(req.body.formID, function (err, form) {
                if (err) {
                    console.log(err);
                } else {

                    pulled_text = form.letter;
                    res.json(form);

                    console.log(pulled_text);
                    var formatted_text = letterParser.htmlstuff(pulled_text);

                    var content = fs
                            .readFileSync(path.resolve('./routes/uploads', 'input.docx'), 'binary');

                    var zip = new PizZip(content);

                    var doc = new Docxtemplater();
                    doc.loadZip(zip);
                    //enable linebreaks
                    doc.setOptions({linebreaks:true});

                    console.log("2");
                    //set the templateVariables
                    doc.setData({

                        //text with the line breaks included
                        description: formatted_text
                    });

                    try {
                        // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
                        doc.render()
                    }
                    catch (error) {
                        var e = {
                            message: error.message,
                            name: error.name,
                            stack: error.stack,
                            properties: error.properties,
                        }
                        console.log(JSON.stringify({error: e}));
                        // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
                        throw error;
                    }
                    var buf = doc.getZip()
                    .generate({type: 'nodebuffer'});

                    // buf is a nodejs buffer, you can either write it to a file or do anything else with it.
                    fs.writeFileSync(path.resolve('./routes/uploads', 'output.docx'), buf);
                }
            });
        }
    } catch(err){
        console.log(err);
    }
});

router.post('/drive', function(req,res,next) {
    req.user.getForm(req.body.id, function(err, form) {
        if(err){
            console.log(err)
        } else {
            var break_lines = "<br><br>";
            var smaller_break_lines = "<br><br>";
            var date_raw = req.body.date;
            var actual_date = letterParser.getDate(date_raw);
            var formatted_date = break_lines + actual_date + smaller_break_lines;
            var letter = req.body.letter;
            var formatted_letter = formatted_date + letter;
            var template = form.getTemplate();
            var templateName = template.name;

            var text = letterParser.htmlstuff(formatted_letter);
            var longText = text.replace(/(\r\n|\n|\r)/gm, "<br>");
            var fname = form.responses[0].response;
            var lname = form.responses[1].response;
            var length = longText.length;
        
            var para = longText.split("<br>"); //split para into an array of paragraphs



            //load the docx file as a binary
  			var content = fs
  			    .readFileSync(path.resolve('./routes/uploads', 'input.docx'), 'binary');

  			var zip = new PizZip(content);

  			var doc = new Docxtemplater();
  			doc.loadZip(zip);
  			//enable linebreaks
  			doc.setOptions({linebreaks:true});


  			//set the templateVariables
  			doc.setData({
  			    //text with the line breaks included
  			    description: text
  			});

  			try {
  			    // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
  			    doc.render()
  			}
  			catch (error) {
  			    var e = {
  			        message: error.message,
  			        name: error.name,
  			        stack: error.stack,
  			        properties: error.properties,
  			    }
  			    console.log(JSON.stringify({error: e}));
  			    // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
  			    throw error;
  			}
  			var buf = doc.getZip()
               .generate({type: 'nodebuffer'});

  			// buf is a nodejs buffer, you can either write it to a file or do anything else with it.
  			fs.writeFileSync(path.resolve('./routes/uploads', 'output.docx'), buf);
              res.redirect('/recommender-dashboard');
        }
    });
});

router.get('/downloads', function(req, res) {
    var file = path.resolve('./routes/uploads', 'output.docx');
    res.download(file);
});


module.exports = router;
