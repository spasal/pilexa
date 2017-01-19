/**
 * Created by stijn on 16-Jan-17.
 */
(function () {
    var socket = io();
    var btnKitchen, btnBathroom, bKitchen, bBathroom, sKitchen, sBathroom, temperature;

    function addEventListeners(){
        btnKitchen.addEventListener('click', function(){buttonClick("kitchen", bKitchen)});
        btnBathroom.addEventListener('click', function () {buttonClick("bathroom", bBathroom)});
    }

    function buttonClick(place, value){
        if(value == 0)
            value = 1;
        else if(value == 1)
            value = 0;
        socket.emit("sOnOff", place, value);
    }

    socket.on("cShadow", function(data){
        var text = JSON.parse(data);
        var items = text.state.reported.items;
        if(items != undefined) {
            for (var prop in items) {
                updateLight(prop, items[prop]);
            }
        }
    });

    socket.on("cPublished", function(place){
        if(place =="kitchen"){
            sKitchen.innerText = "publishing...";
        }else if(place == "bathroom")
            sBathroom.innerText = "publishing...";
    });

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

    function updateLight(address, value){
        switch(address){
            case "2/1/0":
                bKitchen = value;
                sKitchen.innerText = getValue(value);
                btnKitchen.className = "";
                if(value > 0)
                    btnKitchen.classList.add("panel", "panel-light");
                else
                    btnKitchen.classList.add("panel", "panel-light-off");
                break;
            case "2/1/1":
                bBathroom = value;
                sBathroom.innerText = getValue(value);
                btnBathroom.className = "";
                if(value > 0)
                    btnBathroom.classList.add("panel","panel-light");
                else
                    btnBathroom.classList.add("panel", "panel-light-off");
                break;
            case "5/0/0":
                temperature.innerText = value + " C°";
                break;
            default:
                return -1;
        }
    }

    function init(){
        btnKitchen = document.getElementById("kitchen-light");
        btnBathroom = document.getElementById("bathroom-light");
        sKitchen = document.getElementById("kitchen-status");
        sBathroom = document.getElementById("bathroom-status");
        temperature = document.getElementById("temperature-status");
        addEventListeners();
    }

    init();

})();