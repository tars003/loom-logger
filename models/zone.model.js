const mongoose = require('mongoose');

const Zone = mongoose.Schema({
    name: String,
    stations: [
        {
            stationName: String,
            data: [
                {
                    _id: String,  // Time
                    tags : [
                        {
                            _id: String,  // Tag id
                            rssi: Number
                        }
                    ]
                }, 
            ]
        },
    ],
});

module.exports = mongoose.model("zone", Zone);

// {
//     "stationId" : "STATION1",
//     "time": "12-11-2021-11:24:12",
//     "tags": [
//         {
//             "tagId": "TAG 1",
//             "rssi": 81
//         },
//     ]
// }