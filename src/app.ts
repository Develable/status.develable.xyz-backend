// Modules
import Discord from 'discord.js';
import express from 'express';
import axios from 'axios';
export const Recaptcha = require('recaptcha-v2').Recaptcha;
export const firebase = require('firebase-admin');
export const cors = require('cors');
export const bodyParser = require('body-parser');

import _Discord, {_MessageType} from './Discord';

export const app: express.Express = express();
export const client: Discord.Client = new Discord.Client();

const _client = new _Discord('Token', `${process.env.SendChannel_id}` || 'Channel_id');

// Variables
let reCAPTCHA_KEY = {
    Public: "Public_Key",
    Private: "Private_Key"
};

//const GOOGLE_APPLICATION_CREDENTIALS = require('./../develable-status-firebase-adminsdk-ox32r-86fcf8c4db.json');
const GOOGLE_APPLICATION_CREDENTIALS = {
    // TODO: From Firebase
};
const allowlist = ['https://status.develable.xyz', 'https://develable-status.firebaseapp.com', 'https://develable-status.web.app'];
const corsOptionsDelegate = (req: any, callback: any): void => {
  let corsOptions;
  if (allowlist.indexOf(req.header('Origin')) !== -1) {
    corsOptions = { origin: true }; // reflect (enable) the requested origin in the CORS response
  } else {
    corsOptions = { origin: false }; // disable CORS for this request
  }
  callback(null, corsOptions); // callback expects two parameters: error and options
};

// Functions
app.use(bodyParser.urlencoded({extended: true})); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json

firebase.initializeApp({credential: firebase.credential.cert(GOOGLE_APPLICATION_CREDENTIALS), databaseURL: 'https://develable-status.firebaseio.com'});

const response_client = (res: express.Response, data: any): void => {
    console.log(data);
    res.send(data);
};

/* --------------- Express.js --------------- */

/* ----- API v1 : Duplicate ----- */

// Page Access Permission Check
app.get('/:Category/api/v1/Access/Permission/:Page', cors(corsOptionsDelegate), (req, res) => {
    firebase.database().ref(`/Access/${req.params.Category}`).once('value').then((snapshot: { val: () => void; }): void => {
        // snapshot.val() -> Object
        let Lists = JSON.parse(JSON.stringify(snapshot.val()));
        if (Lists[`${req.params.Page}PG`] === undefined) response_client(res, {'request': 'fail', 'code': 'Not Found'});
        response_client(res, {request: 'success', Allow: Lists[`${req.params.Page}PG`], code: "FB_remote"});
    });
});

/* ----- API v1 : Public ----- */

// reCAPTCHA ValidCheck
app.post('/Main/api/v1/Auth/reCAPTCHA/validCheck', cors(corsOptionsDelegate), (req, res): void => {
    let KEY = req.body.key;
    let data = {
        remoteip:  req.connection.remoteAddress,
        response:  KEY,
        secret: reCAPTCHA_KEY['Private']
    };
    let recaptcha = new Recaptcha(reCAPTCHA_KEY['Public'], reCAPTCHA_KEY['Private'], data);

    recaptcha.verify((success: any, error_code: any): void => {
        firebase.database().ref('/Session').once('value').then((snapshot: { val: () => void; }): void => {
            // snapshot.val() -> Object
            let PastLists = JSON.stringify(snapshot.val());
            let Lists = JSON.parse(PastLists.replace('}', '') + `, "${KEY}" : ${success}}`);
            if (!(JSON.parse(PastLists)['UseCaptcha'])) response_client(res, {request: 'success', 'reCAPTCHA': {success: true, code: 'DISABLED (FB_remote)'}, 'Firebase': {success: false, code: 'DISABLED (FB_remote)'}});

            firebase.database().ref('/Session').set(Lists, (error: any): void => {
                let fb_success:boolean = false;
                let fb_error_code:string = 'UNDEFINED';
                if (error != null) {
                    fb_success = false;
                    fb_error_code = error;
                } else {
                    fb_success = true;
                    fb_error_code = '';
                }
                response_client(res, {request: 'success', 'reCAPTCHA': {success: success, code: error_code}, 'Firebase': {success: fb_success, code: fb_error_code}});
            });
        });
    });
});

// Discord Test
app.post('/Main/api/v1/Board/SendDiscord', cors(corsOptionsDelegate), async (req, res) => {
    let type: _MessageType = _MessageType.NONE;
    switch (req.body.type) {
        case '0':
            type = _MessageType.ERROR;
            break;
        case '1':
            type = _MessageType.WARN;
            break;
        case '2':
            type = _MessageType.INFO;
            break;
        case '3':
            type = _MessageType.SUCCESS;
            break;
    }
    let result = await _client.sendMessage({
        type,
        ServiceTitle: `${req.body.ServiceTitle}`,
        FieldTitle: `${req.body.FieldTitle}`,
        FieldInfo: `${req.body.FieldInfo}`,
        starttime: `${req.body.starttime}`,
        endtime: `${req.body.endtime}`,
        timestamp: `${req.body.timestamp}`
    });

    if (result) response_client(res, {request: 'success', send: 'success'});
    else response_client(res, {request: 'success', send: 'fail'});
});

/* ----- API v1 : Dev ----- */

// reCAPTCHA ValidCheck
app.post('/Dev/api/v1/Auth/reCAPTCHA/validCheck', cors(corsOptionsDelegate), (req, res): void => {
    let KEY = req.body.key;
    let data = {
        remoteip:  req.connection.remoteAddress,
        response:  KEY,
        secret: reCAPTCHA_KEY['Private']
    };
    let recaptcha = new Recaptcha(reCAPTCHA_KEY['Public'], reCAPTCHA_KEY['Private'], data);

    recaptcha.verify((success: any, error_code: any): void => {
        firebase.database().ref('/Session').once('value').then((snapshot: { val: () => void; }): void => {
            // snapshot.val() -> Object
            let PastLists = JSON.stringify(snapshot.val());
            let Lists = JSON.parse(PastLists.replace('}', '') + `, "${KEY}" : ${success}}`);
            if (!(JSON.parse(PastLists)['UseCaptcha'])) response_client(res, {request: 'success', 'reCAPTCHA': {success: true, code: 'DISABLED (FB_remote)'}, 'Firebase': {success: false, code: 'DISABLED (FB_remote)'}});

            firebase.database().ref('/Session').set(Lists, (error: any): void => {
                let fb_success:boolean = false;
                let fb_error_code:string = 'UNDEFINED';
                if (error != null) {
                    fb_success = false;
                    fb_error_code = error;
                } else {
                    fb_success = true;
                    fb_error_code = '';
                }
                response_client(res, {request: 'success', 'reCAPTCHA': {success: success, code: error_code}, 'Firebase': {success: fb_success, code: fb_error_code}});
            });
        });
    });
});

// Discord Test
app.post('/Dev/api/v1/Board/SendDiscord', cors(corsOptionsDelegate), async (req, res) => {
    let type: _MessageType = _MessageType.NONE;
    switch (req.body.type) {
        case '0':
            type = _MessageType.ERROR;
            break;
        case '1':
            type = _MessageType.WARN;
            break;
        case '2':
            type = _MessageType.INFO;
            break;
        case '3':
            type = _MessageType.SUCCESS;
            break;
    }
    let result = await _client.sendMessage({
        type,
        ServiceTitle: `${req.body.ServiceTitle}`,
        FieldTitle: `${req.body.FieldTitle}`,
        FieldInfo: `${req.body.FieldInfo}`,
        starttime: `${req.body.starttime}`,
        endtime: `${req.body.endtime}`,
        timestamp: `${req.body.timestamp}`
    });

    if (result) response_client(res, {request: 'success', send: 'success'});
    else response_client(res, {request: 'success', send: 'fail'});
});

// Handle 404 - Keep this as a last route
app.use(cors(corsOptionsDelegate), (req, res): void => {
    res.status(404);
    response_client(res, {request: 'fail', code: 'Not Found'});
});

// Run
const PORT = process.env.PORT || 8080;
app.listen(PORT, (): void => {
   console.log(`Express is running on ${PORT}`);
});
