'''
 * Copyright 2010-2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *  http://aws.amazon.com/apache2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
'''

from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient
from threading import Thread
from random import randint
import tcpclient
import logging
import getopt
import time
import json
import sys


def main():
    def init_AWS_IoT_client():
        # Load parameters //todo
        useWebsocket = False
        host = "a3o1ied5wjxghu.iot.us-east-1.amazonaws.com"
        rootCAPath = "/home/pi/Desktop/pilexa/device_connector/certificates/root-CA.crt"
        certificatePath = "/home/pi/Desktop/pilexa/device_connector/certificates/Pilexa-KNXBridge.cert.pem"
        privateKeyPath = "/home/pi/Desktop/pilexa/device_connector/certificates/Pilexa-KNXBridge.private.key"

        # Configure logging
        logger = logging.getLogger("AWSIoTPythonSDK.core")
        logger.setLevel(logging.DEBUG)
        streamHandler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        streamHandler.setFormatter(formatter)
        logger.addHandler(streamHandler)

        # Init AWSIoTMQTTClient
        myAWSIoTMQTTClient = None
        if useWebsocket:
            myAWSIoTMQTTClient = AWSIoTMQTTClient("basicPubSub", useWebsocket = True)
            myAWSIoTMQTTClient.configureEndpoint(host, 443)
            myAWSIoTMQTTClient.configureCredentials(rootCAPath)
        else :
            myAWSIoTMQTTClient = AWSIoTMQTTClient("basicPubSub")
            myAWSIoTMQTTClient.configureEndpoint(host, 8883)
            myAWSIoTMQTTClient.configureCredentials(rootCAPath, privateKeyPath,
                certificatePath)

        # AWSIoTMQTTClient connection configuration
        myAWSIoTMQTTClient.configureAutoReconnectBackoffTime(1, 32, 20)
        myAWSIoTMQTTClient.configureOfflinePublishQueueing(-1)# Infinite offline Publish queueing
        myAWSIoTMQTTClient.configureDrainingFrequency(2)# Draining: 2 Hz
        myAWSIoTMQTTClient.configureConnectDisconnectTimeout(10)# 10 sec
        myAWSIoTMQTTClient.configureMQTTOperationTimeout(5)# 5 sec

        return myAWSIoTMQTTClient


    myAWSIoTMQTTClient = init_AWS_IoT_client()

    def get_answer_cleaned(answer):
        answer = answer.split('/answer/')
        print("answer: ", answer, "len: ", len(answer))
        if len(answer) >= 2:
            answer = answer[1][1: -1].split(',')
            adress = answer[0].strip()
            value = answer[1].strip()
            return adress, value
        return None, None


    def run_main(): #default MQTT message callback
        def defaultCallback(client, userdata, message):
            print("Received a new message: ")
            print(message.payload)
            print("from topic: ")
            print(message.topic)
            print("--------------\n\n")

        # custom KNX MQTT message callback
        def KNXCallback(client, userdata, message):
            print("\nReceived a new message FROM KNX TOPIC: ")
            print("--------------")
            answer = tcpclient.send_message(message.payload)
            adress, value = get_answer_cleaned(answer)

            if adress != None and value != None:
                if adress != "2/1/2":
                    update = update = { "state" : { "reported": { "items": { adress:value } } } }
                else:
                    update = { "state" : { "reported": { "items": { adress:value, "2/1/0":value, "2/1/1":value } } } }

            update = json.dumps(update)
            print(update)
            print("shadow updated")
            myAWSIoTMQTTClient.publish("$aws/things/Pilexa-KNXBridge/shadow/update", update, 1)
            print("-------------- \n")


        # Connect and subscribe to AWS IoT
        myAWSIoTMQTTClient.connect()
        myAWSIoTMQTTClient.subscribe("knx", 1, KNXCallback)


    # Publish to the same topic in a loop forever
    def check_temperature():
        while True:
            print("checking temperature")
            adress, value = tcpclient.send_message('//todo')
            if value is not None:
                temperature = int(value)
                update_temperature = json.dumps({"temperature": temperature})
                update_shadow = json.dumps({ "state" : { "reported": { "items": { "5/0/0":temperature } } } })

                print("publishing temperature %s" % update_temperature)
                print(update_shadow)
                myAWSIoTMQTTClient.publish("temperature", update_temperature, 1)
                myAWSIoTMQTTClient.publish("$aws/things/Pilexa-KNXBridge/shadow/update", update_shadow, 1)
                time.sleep(20)


    t1 = Thread(target=run_main)
    t1.setDaemon(True)
    t1.start()

    time.sleep(5)

    t2 = Thread(target=check_temperature)
    t2.setDaemon(True)
    t2.start()

    while True:
        pass

if __name__ == "__main__":
    print("running file")
