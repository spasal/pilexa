/**
 * Created by stijn on 16-Jan-17.
 */
var iotModule = (function (){
    function jsonGenerator(topic, OnOff, write){
        return '{"topic" : "' + topic + '", "value" : "' + OnOff + '", "write" : "'+ write +'"}';
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

    function groupToPlace(lights){
        switch(lights){
            case "2/1/0":
                return "kitchen";
            case "2/1/1":
                return "bathroom";
            default:
                return -1;
        }
    }

    return{
        jsonGenerator: jsonGenerator,
        getPlaceGroup: getPlaceGroup,
        groupToPlace: groupToPlace
    }

})();

module.exports = iotModule;