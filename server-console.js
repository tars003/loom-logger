const express = require('express');
const http = require('http');
const cors = require('cors');
const app = express();
const server = http.createServer(app);
const moment = require('moment');
var mqtt = require('mqtt');

// IMPORTING MODELS
const currentZone = require('./models/currentZone.model');
const Zone = require('./models/zone.model');

// GENERAL SERVER CONFIG
app.use(cors());
app.use(express.json());
const connectDB = require('./utils/db');
connectDB();


// MQTT CLIENT CONFIG
// const host = '192.168.43.60'
const host = '192.168.1.102';
const port = '1883'
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
const connectUrl = `mqtt://${host}:${port}`;
const topicMain = '/nodejs/mqtt'
const client = mqtt.connect(connectUrl, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    username: 'emqx',
    password: 'public',
    reconnectPeriod: 1000, 
    properties: {
        maximumPacketSize: 4000
    }
});

// MAIN MQTT CODE
client.on('connect', () => {
    console.log('Connected');

    client.subscribe([topicMain], () => {
        console.log(`Subscribe to topic '${topicMain}'`)
    })
})
client.on('message', async (topic, payload) => {
    let inStr =  payload.toString();
    // console.log('inStr', inStr, typeof(inStr));
    // inStr = inStr.replaceAll("'", "\"");
    inStr = [...inStr].map(w => {if(w == "'") return ("\""); else return (w)}).join("")
    console.log('inStr 2', inStr);
    console.log('Received Message:', topic, JSON.parse(inStr));

    // console.log('Received string:', topic, payload.toString());
    
    if (topic == topicMain) {
    // if (topic == 'aa') {
        let currZone = await currentZone.find();
        currZone = currZone[0];
        // NO ZONE EXISTS IN CURR ZONE | meaning do not log anything
        if (!currZone) {
            // DO NOTHING
        }
        // THERE EXISTS A ZONE IN currentZone | meaning a zone object for it has already been created 
        else {
            const zone = await Zone.findOne({ name: currZone.name });
            const { time, stationId, tags } = JSON.parse(inStr);
            let zoneStations = zone.stations;
            
            let zoneTags = tags.map((tagObj) => {
                return ({
                    _id: tagObj.tagId,
                    rssi: tagObj.rssi
                })
            });
            let timeObj = {
                _id: time,
                tags: zoneTags
            } 
            

            let stationNames = zoneStations.map((station) =>  station.stationName);
            // STATION ALREADY HAS PREVIOUS DATA | meaning above timeObj is to be appended to it
            if(stationNames.includes(stationId)) {
                let stationObj = zoneStations[stationNames.indexOf(stationId)];
                console.log('zoneStations', zoneStations);
                console.log('stationObj', stationObj);
                console.log('index', stationNames.indexOf(stationId))
                stationObj.data.push(timeObj);
                
            }
            // STATION DOES NOT HAVE PREVIOUS DATA | meaning station object does not exist till now in the stations array
            else {
                let stationObj = {
                    stationName : stationId,
                    data: [
                        timeObj
                    ]
                };
                zoneStations.push(stationObj);
            }

            console.log(zoneStations);
            zone['stations'] = zoneStations;
            await zone.save();

            // res.send(`<h1>Logging already going on for zone ${currZone.name} </h1>`);
        }
    }
});


// MAIN HTTP CODE
app.get('/', async (req, res) => {
    res.send('<h1>Hello world</h1>');
});

app.get('/start/:zoneId', async (req, res) => {
    try {
        const zoneId = req.params.zoneId;
        let currZone = await currentZone.find();
        console.log('currZone 1', currZone);
        currZone = currZone[0];

        console.log('currZone', currZone);
        // // IF CURRENT ZONE ALREADY HAS A OBJECT IN IT | meaning do nothing as a logging session is already going on
        if (!currZone) {
            console.log('inside if 1')
            currZone = await currentZone.create({ name: zoneId });
            // currZone['name'] = zoneId;
            // await currZone.save();

            const newZone = await Zone.create({ name: zoneId, stations: [] });

            res.send(`<h1>Logging started for zone ${zoneId} </h1>`);
        }

        else {
            res.send(`<h1>Logging already going on for zone ${currZone.name} </h1>`);
        }

    } catch (err) {
        return res.status(503).json({
            success: false,
            message: 'Server error'
        })
    }
});

app.get('/stop', async (req, res) => {
    try {
        let currZone = await currentZone.find();
        currZone = currZone[0];
        const name = currZone.name;
        await currentZone.deleteOne({ name: name });
        res.send(`<h1>Logging stopped for zone ${currZone.name} </h1>`);
    } catch (err) {
        console.log(err);
        res.send(`<h1>${err}</h1>`);
    }
});

app.get('/getStatus', async (req, res) => {
    try {
        let currZone = await currentZone.find();
        currZone = currZone[0];

        const zone = await Zone.findOne({ name: currZone.name });
        let result = `<p>Online Stations </p><br>`;

        zone.stations.map((station) => {
            result += `<h2>${station.stationName}</h2><br>`
        })

        const name = currZone.name;
        await currentZone.deleteOne({ name: name });
        res.send(result);
    } catch (err) {
        console.log(err);
        res.send(`<h1>${err}</h1>`);
    }
});

server.listen(process.env.PORT || 3000, () => {
    console.log('listening on *:3000');
});
