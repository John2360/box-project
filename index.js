var express = require('express');
var cors = require('cors');
var app = express();
var path = require('path');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
const fs = require('fs');
const { encode } = require('punycode');
var nodemailer = require('nodemailer');
require('dotenv').config();


var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});


app.use(cors());
app.options('*', cors());  // enable pre-flight
app.use('/', express.static(path.join(__dirname, 'public'), {
  setHeaders: function setHeaders(res, path, stat) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
  }
}));
app.use(express.json());

box_id_list = {'VQeGGCPJAd': 'McKenzie', 'QF0FkoUOA6': 'Ellie'}

app.get("/box/:id", (req, res, next) => {
    let box_id = req.params.id;
    if (box_id in box_id_list){
        let rawdata = fs.readFileSync('data.json');
        let database = JSON.parse(rawdata);

        let data = database[box_id];
        let json = JSON.stringify(data);

        res.send(json);
    } else {
        response = {'error': 'box does not exist'}
        let json = JSON.stringify(response);
        res.send(json);
    }
});

app.post("/box/:id/post", (req, res, next) => {
    let box_id = req.params.id;
    if (box_id in box_id_list){
        let rawdata = fs.readFileSync('data.json');
        let database = JSON.parse(rawdata);
        
        let message = req.body.message;

        database[box_id]['message'] = message;
        database[box_id]['timestamp'] = new Date().toISOString();
        database[box_id]['beeps'] = convert_to_morse_code(message);


        let new_data = JSON.stringify(database);
        fs.writeFileSync('data.json', new_data);

        response = {'status': 'success'}
        let json = JSON.stringify(response);
        res.send(json);
    } else {
        response = {'error': 'box does not exist'}
        let json = JSON.stringify(response);
        res.send(json);
    }
});

app.post("/box/:id/wifi", (req, res, next) => {
    let box_id = req.params.id;
    if (box_id in box_id_list){
        let rawdata = fs.readFileSync('data.json');
        let database = JSON.parse(rawdata);
        
        let ssid = req.body.ssid;
        let password = req.body.password;

        database[box_id]['ssid'] = ssid;
        database[box_id]['password'] = password;

        let new_data = JSON.stringify(database);
        fs.writeFileSync('data.json', new_data);

        response = {'status': 'success'}
        let json = JSON.stringify(response);
        res.send(json);
    } else {
        response = {'error': 'box does not exist'}
        let json = JSON.stringify(response);
        res.send(json);
    }
});

app.post("/box/:id/checkin", (req, res, next) => {
    let box_id = req.params.id;
    if (box_id in box_id_list){
        let rawdata = fs.readFileSync('data.json');
        let database = JSON.parse(rawdata);
        
        let last_read = req.body.last_read;
        let last_report = new Date().toISOString();;

        database[box_id]['last_read'] = last_read;
        database[box_id]['last_report'] = last_report;

        let new_data = JSON.stringify(database);
        fs.writeFileSync('data.json', new_data);

        response = {'status': 'success'}
        let json = JSON.stringify(response);
        res.send(json);
    } else {
        response = {'error': 'box does not exist'}
        let json = JSON.stringify(response);
        res.send(json);
    }
});

app.post("/box/:id/message", (req, res, next) => {
    let box_id = req.params.id;
    if (box_id in box_id_list){
        let text = req.body.message;
        let rawdata = fs.readFileSync('data.json');
        let database = JSON.parse(rawdata);
        
        let timestamp = new Date().toISOString();;

        if (text == '<3'){
            text = 'McKenzie sends a <3';
        } else if (text == 'ping'){
            text = 'Lil Cheese Burger desires your immediate attention!';
        }

        database['messages'][box_id]['message'] = text;
        database['messages'][box_id]['timestamp'] = timestamp;

        let new_data = JSON.stringify(database);
        fs.writeFileSync('data.json', new_data);

        var mailOptions = {
            from: process.env.EMAIL,
            to: process.env.TO,
            text: text
        };

        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        response = {'status': 'success'}
        let json = JSON.stringify(response);
        res.send(json);
    } else {
        response = {'error': 'box does not exist'}
        let json = JSON.stringify(response);
        res.send(json);
    }
});

function convert_to_morse_code(incoming_message){
    let message = incoming_message.toUpperCase();
    let morse_dict = { 'A':'.-', 'B':'-...',
                    'C':'-.-.', 'D':'-..', 'E':'.',
                    'F':'..-.', 'G':'--.', 'H':'....',
                    'I':'..', 'J':'.---', 'K':'-.-',
                    'L':'.-..', 'M':'--', 'N':'-.',
                    'O':'---', 'P':'.--.', 'Q':'--.-',
                    'R':'.-.', 'S':'...', 'T':'-',
                    'U':'..-', 'V':'...-', 'W':'.--',
                    'X':'-..-', 'Y':'-.--', 'Z':'--..',
                    '1':'.----', '2':'..---', '3':'...--',
                    '4':'....-', '5':'.....', '6':'-....',
                    '7':'--...', '8':'---..', '9':'----.',
                    '0':'-----', ', ':'--..--', '.':'.-.-.-',
                    '?':'..--..', '/':'-..-.', '-':'-....-',
                    '(':'-.--.', ')':'-.--.-', ' ': '/', '!': '-.-.--'};

    let encoded = '';
    for (let i = 0; i < message.length; i++) {
        let c = message[i];
        encoded += morse_dict[c];

        if (i < message.length-1){
            encoded += ' ';
        }
    }
    return encoded;
}

app.listen(8080);
console.log('http://127.0.0.1:8080')