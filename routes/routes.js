const {RemoteAuth, Client} = require('whatsapp-web.js/');
const express = require('express');
const Instance = require('../models/instance');
const Message = require('../models/message');
const qrcode = require('qrcode-terminal');
const v4 = require('uuid');
const mongoose = require('mongoose');
const {MongoStore} = require('wwebjs-mongo');

const store = new MongoStore({mongoose: mongoose});
const router = express.Router();
const clients = new Map();

function connectClient(instance) {
    console.log('instance to connect ::', instance);

    if (!instance.uuid) {
        console.log('instance with out UUID, return!');
        return;
    }

    const client = new Client({
        authStrategy: new RemoteAuth({
            clientId: instance.uuid,
            store: store,
            backupSyncIntervalMs: cçç,
            dataPath: process.env.BOT_DATAPATH ? process.env.BOT_DATAPATH : './data/',
        }),
        restartOnAuthFail: false, // optional
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                // other node args
            ],
        },
    });

    client.on('qr', (qr) => {
        console.log('QR RECEIVED', qr);
        qrcode.generate(qr, {small: true});
    });

    client.on('auth_failure', (message) => {
        console.log('auth_failure', message);
    });

    client.on('disconnected', (reason) => {
        console.log('disconnected', reason);
        Instance.deleteOne({uuid: instance.uuid});
    });

    client.on('change_state', (state) => {
        console.log('change_state', state);
    });

    client.on('authenticated', (session) => {
        console.log('AUTHENTICATED', session);
    });

    client.on('ready', () => {
        console.log('Client is ready!');

        Message.find({instance: instance.uuid, delivered: false}).exec().then(value => {
            console.log("Achou essas mensagens sem enviar .... ", value);
           for(const message of value){
                sendMessage(client, message);
            }
        });
    });

    client.on('remote_session_saved', () => {
        // Do Stuff...
        console.log('SESSION IS SAVED!!!!');
    });

    client.initialize().then(() => {
        clients.set(instance.uuid, client);
        console.log('clients is now ::', clients.size);
    });


}

router.post('/create', async (req, res) => {
    const data = new Instance({
        name: req.body.name
    })
    data.uuid = v4.v4();
    try {
        let saved = await data.save();
        connectClient(saved);
        res.status(200).json(saved);
    } catch (error) {
        res.status(400).json({message: error.message})
    }
});

router.post('/reconect', async (req, res) => {
    const data = new Instance({
        uui: req.body.uuid
    })
    try {
        const instance = await Instance.findOne({uui: data.uuid}).exec();
        connectClient(instance);
        res.status(200).json(instance);
    } catch (error) {
        res.status(400).json({message: error.message})
    }
});


function sendMessage(client, dataToSave) {
    client.sendMessage(dataToSave.phone + "@c.us", dataToSave.message).then(value => {
        console.log("Mandou a mensagem ", value);
        Message.findOne({uuid: dataToSave.uuid}).exec().then(one => {
            console.log("acheou a mensagem ", one);
            one.delivered = true;
            one.save();
        })
    });
}

//Post Method
router.post('/send', async (req, res) => {

    const message = new Message({
        message: req.body.message,
        delivered: false,
        instance: req.body.clientId,
        phone: req.body.phone
    });
    message.uuid = v4.v4();
    const dataToSave = await message.save();
    let client = clients.get(req.body.clientId);

    if (!client) {
        console.log("Não tem o cliente no mapa, vai reconectar")
        const instance = await Instance.findOne({uuid: req.body.clientId}).exec();
        console.log("VOltou do mongo :: ", instance);
        if (instance) {
            connectClient(instance);
            res.status(200).json(dataToSave)
        } else {
            console.log("Não tem o cliente no mongo, já era")
            res.status(400).json({message: "Instancia não encontrada"})
        }
    } else {
        try {
            console.log('vai mandar a msg ::', message);
            sendMessage(client, dataToSave);
            res.status(200).json(dataToSave)
        } catch (error) {
            console.error("Iiiih", error);
            res.status(400).json({message: error.message})
        }
    }
})


router.get('/reconect-all', function (req, res) {
    console.log("Vai reconectar TODOS!");
    Instance.find().then(all => {
            console.log("Total de instancias ", all.length);
            for (const element of all) {
                connectClient(element);
            }
        }
    )
});


module.exports = router;
