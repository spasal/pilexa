/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * This simple sample has no external dependencies or session management, and shows the most basic
 * example of how to create a Lambda function for handling Alexa Skill requests.
 *
 * Examples:
 * One-shot model:
 *  User: "Alexa, tell Hello World to say hello"
 *  Alexa: "Hello World!"
 */


//Environment Configuration
var config = {};

// config.IOT_BROKER_ENDPOINT      = "XXXXXX.iot.us-east-1.amazonaws.com".toLowerCase();
config.IOT_BROKER_ENDPOINT      = "a3o1ied5wjxghu.iot.us-east-1.amazonaws.com".toLowerCase();
config.IOT_BROKER_REGION        = "us-east-1";
config.IOT_THING_NAME           = "Pilexa-KNXBridge",
config.AWS_KEY                  = "AKIAJLFCH4JPKLBS7SCQ",
config.AWS_SECRET               = "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",
config.SNS_REGION               = "us-east-1",
config.thingName                = "Pilexa-KNXBridge";

//Loading AWS SDK libraries
var AWS = require('aws-sdk');

//Initializing client for IoT
var iotData = new AWS.IotData({endpoint: config.IOT_BROKER_ENDPOINT});

function activateLight (json, callback) {
                 
    var params = {
        topic: 'knx',
        payload: json,
        qos: 0
        };


    iotData.publish(params, function(err, data){
        if(err){
            console.log(err);
            callback(err);
        }
        else{
            callback(null, "success");
        }
    });
}

function updateShadow(update, callback){
    console.log("update shadow");
    params = {
        topic: '$aws/things/Pilexa-KNXBridge/shadow/update',
        payload: update,
        qos: 0
    };
    iotData.publish(params, function(err, data){
        if(err)
        console.log("update err: " + err);
        else
        console.log("update success: " + data);
    });
}

function getShadow (callback){
    iotData.getThingShadow({
        thingName: config.thingName
    }, function(err, data) {
        console.log("Get thing shadow (stijn)");
        if (err) {
            console.log(err);
            callback(err, null);
        } else {
            console.log(data);
            callback(null, data);
        }
    });
}

function getPlaceGroup(place){
    switch(place){
        case "kitchen":
            return 0;
        case "bathroom":
            return 1;
        default:
            return -1;
    }
}

function GroupToPlace(lights){
    switch(lights){
        case "2/1/0":
            return "kitchen";
        case "2/1/1":
            return "bathroom";
        default:
            return -1;
    }
}

function getValue(value){
    switch(value){
        case "0":
            return "off";
        case "1":
            return "on";
        default:
            return -1;
    }
}

function jsonGenerator(topic, OnOff, write){
        return '{"topic" : "' + topic + '", "value" : "' + OnOff + '", "write" : "'+ write +'"}';
}

/**
 * App ID for the skill
 */
var APP_ID = "amzn1.ask.skill.0146f3c9-3cde-4510-9fad-25adb05cd837"; //replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";
//var APP_ID = undefined;

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * HelloWorld is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var HelloWorld = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
HelloWorld.prototype = Object.create(AlexaSkill.prototype);
HelloWorld.prototype.constructor = HelloWorld;

HelloWorld.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("HelloWorld onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

HelloWorld.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("HelloWorld onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var speechOutput = "Welcome to the Alexa Skills Kit, you can say hello";
    var repromptText = "You can say hello";
    response.ask(speechOutput, repromptText);
};

HelloWorld.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("HelloWorld onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

HelloWorld.prototype.intentHandlers = {
    // register custom intent handlers
    "LightPlaceIntent" : function(intent, session, response){
        var place = intent.slots.placeSlot.value;
        var value = intent.slots.valueSlot.value;
        var sendValue;
        
        console.log('plaats: ' + place);
        
        if(value == 'on')
        sendValue = 1;
        if(value == 'off')
        sendValue = 0;
        
        var i = getPlaceGroup(place);
        var topic = "2/1/" + i;
        var text = jsonGenerator(topic, sendValue, 1);
        
        activateLight(text, function(err, success){
            if(err){
                response.tellWithCard("Error in the publish");
            }if(success == "success"){
                response.tellWithCard("Okay, I will turn " + value + " the lights in the " + place);
            }
        });

    },
    "AllLightsIntent" : function(intent, session, response){
        var value = intent.slots.valueSlot.value;
        
        if(value == 'on')
        newValue = 1;
        if(value == 'off')
        newValue = 0;
        
        var topic = "2/1/2";
        var text = jsonGenerator(topic, newValue, 1);
        
        activateLight(text, function(err, success){
            if(err){
                response.tellWithCard("Error in the publish");
            }
            else{
                response.tellWithCard("Okay, I will turn " + value + " all the lights in your house");
            }
        });
    },
    "PlaceIntent" : function(intent, session, response){
        var value = session.attributes['switch'];
        var place = intent.slots.placeSlot.value;
        var newValue;
        
        if(value == 'on')
        newValue = 1;
        if(value == 'off')
        newValue = 0;

        var i = getPlaceGroup(place);
        var topic = "2/1/" + i;
        var text = jsonGenerator(topic, newValue, 1);

        activateLight(text, function(err, success){
            if(err){
                response.tellWithCard("Error in the publish");
            }if(success == "success" && place != undefined){
                response.tellWithCard("Okay, I will turn " + value + " the lights in the " + place);
            }if(success == "success" && place == undefined)
            response.tellWithCard("There is no connected light in that location.");
        });
    },
    "LightIntent" : function(intent, session, response){
        var value = intent.slots.valueSlot.value
        session.attributes['switch'] = value;
        response.ask("Where do you want me to turn "+ value +" the lights?", "In witch room do you want to turn "+ value +" the lights?");
    },
    "AllLightStatusIntent" : function(intent, session, response){
        //code
    },
    "LightStatusIntent" : function(intent, session, response){
        var place = intent.slots.placeSlot.value;
        var i = getPlaceGroup(place);
        var topic = "2/1/" + i;
        var json = jsonGenerator(topic, -1, 0);

         getShadow(function(err, data){
            if(err){
                response.tellWithCard("Error: " + err);
                console.log("Error: " + err);
            }
            else{
                text = JSON.parse(data.payload);
                var item = text.state.reported.items[topic];
                var value = getValue(item);
                console.log("light value: " + value);

                console.log("lights: " + item);
                if(place != undefined)
                response.tellWithCard("Your " + place + " light is " + value);
                else
                response.tellWithCard("I didn't understand your light location.");
            }
                
        });
    },
    "TemperatureIntent" : function(intent, session, response){
        getShadow(function(err, data){
            if(err){
                console.log("Error: " + err);
            }else{
                text = JSON.parse(data.payload);
                var item = text.state.reported.items["5/0/0"];
                console.log('succes: ' + item);
                if(item != undefined)
                response.tellWithCard("The temperature is " + item + " degrees celcius");
            }
        });
    }
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    var helloWorld = new HelloWorld();
    helloWorld.execute(event, context);
};

