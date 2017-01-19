/**
 * Created by stijn on 16-Jan-17.
 */
var iotModule = require('./iotModule');

module.exports = function(io, device, iotData){

    io.on('connection', function(socket){
        console.log("socket connected");

        iotData.getThingShadow({thingName: 'Pilexa-KNXBridge'}, function (err, data) {
            socket.emit("cShadow", data.payload.toString());
        });

        device
            .on('message', function(topic, payload) {
                console.log('message', topic, payload.toString());
                socket.emit("cChange", payload.toString());
            });

        socket.on("sOnOff", function(place, value){
            var i = iotModule.getPlaceGroup(place);
            var topic = "2/1/" + i;
            var json = iotModule.jsonGenerator(topic, value, 1);
            console.log(json);
            device.publish('knx', json);
            socket.emit("cPublished", place);
        });

        socket.setMaxListeners(10);
    });



};

