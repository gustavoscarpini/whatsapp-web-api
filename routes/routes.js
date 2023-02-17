const {RemoteAuth, Client} = require('whatsapp-web.js/');
const express = require('express');
const Instance = require('../models/instance');
const Message = require('../models/message');
const qrcode = require('qrcode-terminal');
const v4 = require('uuid');
const mongoose = require('mongoose');
const { MongoStore } = require('wwebjs-mongo');

const store = new MongoStore({ mongoose: mongoose });
const router = express.Router();
const clients = new Map();

async function connectClient(instance) {
    console.log('instance to connect ::', instance);

    if(!instance.uuid){
        console.log('instance with out UUID, return!');
        return;
    }

    const client = new Client({
        authStrategy: new RemoteAuth({
            clientId: instance.uuid,
            store: store,
            backupSyncIntervalMs: 300000
        }),
        restartOnAuthFail: true, // optional
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

    client.on('ready', () => {
        console.log('Client is ready!');
    });

    client.on('remote_session_saved', () => {
        // Do Stuff...
        console.log('SESSION IS SAVED!!!!');
    });

    await client.initialize();
    clients.set(instance.uuid, client);
    console.log('clients is now ::', clients.size);
}

router.post('/create', async (req, res) => {
    const data = new Instance({
        name: req.body.name
    })
    data.uuid = v4.v4();
    try {
        let saved = await data.save();
        await connectClient(saved);
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
        await connectClient(instance);
        res.status(200).json(instance);
    } catch (error) {
        res.status(400).json({message: error.message})
    }
});


//Post Method
router.post('/send', async (req, res) => {
    const message = new Message({
        message: req.body.message,
        phone: req.body.phone
    });
    console.log('vai mandar a msg ::', message);
    let client = clients.get(req.body.clientId);
    if (!client) {
        console.log("Não tem o cliente no mapa, vai reconectar")
        const instance = await Instance.findOne({uuid: req.body.clientId}).exec();
        console.log("VOltou do mongo :: ", instance);
        await connectClient(instance);
        client = clients.get(req.body.clientId);
    }
    if (client) {
        try {
            const dataToSave = await message.save();
            console.log("salvou e vai mandar a msg")
            await client.sendMessage(dataToSave.phone +"@c.us", dataToSave.message);
            res.status(200).json(dataToSave)
        } catch (error) {
            console.error("Iiiih", error);
            res.status(400).json({message: error.message})
        }
    } else {
        console.log("Não tem o cliente no mongo, já era")
        res.status(400).json({message: "Instancia não encontrada"})
    }
})

async function connectAll() {
    const all = Instance.find();
    for (let i = 0; i < all.length; i++) {
        const instance = all[i];
        await connectClient(instance);
    }
}

connectAll(); //TODO não rolou issoaqui

module.exports = router;