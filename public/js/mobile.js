//const { brotliCompress } = require('zlib');

//const { checkPadOnDimRoundingMode } = require("@tensorflow/tfjs-core/dist/ops/conv_util");


var is_running = false;
var is_debug = false;
var datas = [];
var speed = [{ x:0, y:0, z:0 }];
var pos = [{ x:0, y:0, z:0 }];
var move = 0;
var count = 0;
var moves = [];
var orient = {};
var popover = false;
var lastEmit = Date.now()
var data = null;
var so = null;
var running = null;
var data_size = 32;
var current=0;

var thresholdx=10;
var thresholdy=10;
var thresholdz=10; //à voir à combien je les mets , pour l'instant empiriquement, je veux éviter les faux negatifs
var done1=false;
var done2=false;
var detection=false;
var beginpunch=false;
var beginindex=0;
var endindex=0;
var nb_frame=0;
var ref=[];
var threshold_detection=5;


$.get("/records/ref.txt", function(data, status){
        data.split(/\r?\n/).forEach(line =>  {
        ref.push(JSON.parse(line));
      });
      //choper la premiere orientation les premiers points sont souvent à 0
      var j=0;
      while((ref[j].o.a==0)&&(ref[j].o.b==0)&&(ref[j].o.g==0)){
            j=j+1;
      }
    
      soa=ref[j].o.a;
      sob=ref[j].o.b;
      sog=-ref[j].o.g;

      //done1 check si on a accumulé la punch de reference
      done1=false;
      beginpunch=false;
      for (var i=0; i<ref.length;i++){
          ref[i].ac=aymeric(ref[i].a.x, ref[i].a.y, ref[i].a.z, ref[i].o.a - soa, ref[i].o.b - sob, ref[i].o.g - sog)
          mag=magnitude(ref[i].ac);
          mag2=magnitude(ref[i].a);
          console.log(mag,mag2);
          if ((mag>threshold_detection) && (beginpunch==false) && (done1==false)){
            console.log('begin',i)
            beginpunch=true;
            beginindex=i;
          }
          if ((beginpunch==true)&& (mag<threshold_detection) && (done1==false)){
            console.log('end',i)
            endindex=i;
            beginpunch=false;
            i=ref.length;
            done1=true;
          }
        
      }
      nb_frame=endindex-beginindex+1;
    });



//mettre un bip à chaque frame 
/*const audio=newb(window.AudioContext || window.webkitAudioContext)();
const bruit=audio.createOscillator();
bruit.frenquency.value=440;
bruit.connect(audio.destination);
*/
var incr_t = 0;

var device_id = localStorage.getItem('device_id') || (Math.random() + 1).toString(36).substring(2)
var device_type = localStorage.getItem('device_type') || 'unknown'
var record_move = localStorage.getItem('record_move') || 'unknown'
localStorage.setItem('device_id', device_id)

const socket = io({
    query: {
        "id": device_id,
        "from": device_type,
        "record": record_move,
        "type": "device"
    }
});

function magnitude(acceleration){
    return Math.sqrt(
        acceleration.x * acceleration.x +
        acceleration.y * acceleration.y +
        acceleration.z * acceleration.z
      );
}

function sr(angle) {
    return Math.sin((Math.PI) / 180 * angle)
}

function cr(angle) {
    return Math.cos((Math.PI / 180) * angle)
}

function aymeric(ax, ay, az, a, b, g) {
    let x = ax * cr(g) * cr(a) + ay * (sr(b) * sr(g) * cr(a) - cr(b) * sr(a)) + az * (cr(b) * sr(g) * cr(a) + sr(b) * sr(a));
    let y = ax * cr(g) * sr(a) + ay * (sr(b) * sr(g) * sr(a) + cr(b) * cr(a)) + az * (cr(b) * sr(g) * sr(a) - sr(b) * cr(a));
    let z = -ax * sr(g) + ay * sr(b) * cr(g) + az * cr(b) * cr(g);
    return {
        x: x,
        y: y,
        z: z
    }
}

function aymericSpeed(da) {
        let ns = {}
        
        ns.x = speed[speed.length-1].x + (da.ac.x)*(16)*1e-3
        ns.y = speed[speed.length-1].y + (da.ac.y)*(16)*1e-3
        ns.z = speed[speed.length-1].z + (da.ac.z)*(16)*1e-3

   if(incr_t < 125 ){
        speed.push({  x: ns.x, y: ns.y, z: ns.z })
        incr_t += 1
        
    }
    else{
       speed.push({x : 0, y : 0, z : 0})
        incr_t = 0
    }

/*
    let np = {}
    np.x = pos[pos.length-1].x + (speed[speed.length-1].x)*(16)*1e-3
    np.y = pos[pos.length-1].y + (speed[speed.length-1].y)*(16)*1e-3
    np.z = pos[pos.length-1].z + (speed[speed.length-1].z)*(16)*1e-3
    pos.push({ x: np.x, y: np.y, z: np.z })
*/
    return { x: speed[speed.length-1].x, y: speed[speed.length-1].y, z: speed[speed.length-1].z }
}

function handleOrientation(event) {
    if (so === null) {
        so = {
            a: event.alpha,
            b: event.beta,
            g: event.gamma
        }
    }
    if (data) data.o = {
        a: event.alpha,
        b: event.beta,
        g: event.gamma
    }
    updateFieldIfNotNull('Orientation_a', event.alpha);
    updateFieldIfNotNull('Orientation_b', event.beta);
    updateFieldIfNotNull('Orientation_g', event.gamma);
    incrementEventCount();
}

function incrementEventCount() {
    let counterElement = $("#num-observed-events")
    let eventCount = parseInt(counterElement.html())
    counterElement.html(eventCount + 1);
}

function updateFieldIfNotNull(fieldName, value, precision = 10) {
    if (value != null)
        $("#" + fieldName).html(value.toFixed(precision));
}

function handleMotion(event) {
    updateFieldIfNotNull('Accelerometer_gx', event.accelerationIncludingGravity.x);
    updateFieldIfNotNull('Accelerometer_gy', event.accelerationIncludingGravity.y);
    updateFieldIfNotNull('Accelerometer_gz', event.accelerationIncludingGravity.z);
    updateFieldIfNotNull('Accelerometer_x', event.acceleration.x);
    updateFieldIfNotNull('Accelerometer_y', event.acceleration.y);
    updateFieldIfNotNull('Accelerometer_z', event.acceleration.z);
    updateFieldIfNotNull('Accelerometer_i', event.interval, 2);
    updateFieldIfNotNull('Timestamp', event.timeStamp, 2);
    updateFieldIfNotNull('Gyroscope_z', event.rotationRate.alpha);
    updateFieldIfNotNull('Gyroscope_x', event.rotationRate.beta);
    updateFieldIfNotNull('Gyroscope_y', event.rotationRate.gamma);
    incrementEventCount();

    data.ts = event.timeStamp,
        data.awg = {
            x: event.accelerationIncludingGravity.x,
            y: event.accelerationIncludingGravity.y,
            z: event.accelerationIncludingGravity.z
        }
    data.a = {
        x: event.acceleration.x,
        y: event.acceleration.y,
        z: event.acceleration.z
    }
    data.r = {
        a: event.rotationRate.alpha,
        b: event.rotationRate.beta,
        g: event.rotationRate.gamma
    }

}

$(document).ready(function () {



    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
    /*var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl)
    })*/

    $('#device_id').html(device_id);
    $('#device_type').val(device_type);
    $('#record_move').val(record_move);
    data = {
        id: device_id,
        t: device_type,
        rec: record_move,
        i: 0,
        ts: 0,
        awg: {
            x: 0,
            y: 0,
            z: 0
        },
        a: {
            x: 0,
            y: 0,
            z: 0
        },
        r: {
            a: 0,
            b: 0,
            g: 0
        },
        o: {
            a: 0,
            b: 0,
            g: 0
        }
    };
    if (device_type !== "unknown") $("#start").attr("disabled", false);
    else {
        $('html, body').animate({
            scrollTop: $("#device_type").offset().top
        }, 200);
        $("#popover-btn").trigger("click");
        popover = true;
    }

    /*navigator.getBattery().then(battery => {
        updateFieldIfNotNull('battery', battery.level * 100, 2);
    })*/

    $("#record_move").change(function (e) {
        record_move = $("#record_move").val();
        data.rec = record_move;
    })

    $("#device_type").change(function (e) {
        if (popover) $("#popover-btn").trigger("click");
        device_type = $("#device_type").val();
        localStorage.setItem('device_type', device_type);
        if (socket) socket.emit('action', {
            id: device_id,
            type: "device",
            position: device_type,
            record: record_move,
            name: "changetype"
        })
        if (device_type === "unknown") $("#start").attr("disabled", true);
        else $("#start").attr("disabled", false);
    })

    $("#debug").on("click", function (e) {
        is_debug = !is_debug;
        if (is_debug) data_size = 512;
        else data_size = 32;
        $("#debug").removeClass('btn-danger');
        $("#debug-notif").addClass('d-none');
        if (is_debug) {
            $("#debug").addClass('btn-danger');
            $("#debug-notif").removeClass('d-none');
        }
    })

    $("#start").on("click", function (e) {
        e.preventDefault();
        if (DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === "function") {
            DeviceMotionEvent.requestPermission();
        }
        $("#notification").html("N/A");
        if (is_running) {
            window.removeEventListener("devicemotion", handleMotion);
            window.removeEventListener("deviceorientation", handleOrientation);
            if (socket) socket.emit('action', {
                id: device_id,
                type: "device",
                position: device_type,
                record: record_move,
                name: "stop"
            })
            $("#start").html("Start");
            $("#start").addClass('btn-success');
            $("#start").removeClass('btn-danger');
            //navigator.vibrate(200);
            clearInterval(running);
            running = null;
            is_running = false;
        } else {// start ça s'execute ici si c'est pas running
            window.addEventListener("devicemotion", handleMotion);
            window.addEventListener("deviceorientation", handleOrientation);
            if (socket) socket.emit('action', {
                id: device_id,
                type: "device",
                position: device_type,
                record: record_move,
                name: "start"
            })
            $("#start").html("Stop");
            $("#start").removeClass('btn-success');
            $("#start").addClass('btn-danger');
            //navigator.vibrate(200);
            is_running = true;
        }
    });

    setInterval(function () {
        socket.emit('action', {
            id: device_id,
            type: "device",
            position: device_type,
            record: record_move,
            name: "ping"
        })
    }, 3000);

    function removeNoiseLin(accelerometerData, threshold) {
        const filteredData = [];
        let previousAcceleration = accelerometerData[0];
      
        for (let i = 1; i < accelerometerData.length; i++) {
          const acceleration = accelerometerData[i];
          const magnitude = Math.sqrt(
            acceleration.x * acceleration.x +
            acceleration.y * acceleration.y +
            acceleration.z * acceleration.z
          );
      
          if (magnitude > threshold) {
            filteredData.push(acceleration);
            previousAcceleration = acceleration;
          } else if (previousAcceleration !== null) {
            // Perform linear interpolation
            const t = Math.max(0, Math.min(1, (threshold - magnitude) / (previousAcceleration.magnitude - magnitude)));
            const interpolatedAcceleration = {
              x: previousAcceleration.x * t + acceleration.x * (1 - t),
              y: previousAcceleration.y * t + acceleration.y * (1 - t),
              z: previousAcceleration.z * t + acceleration.z * (1 - t)
            };
            filteredData.push(interpolatedAcceleration);
          }
        }
        return filteredData;
      }







    running = setInterval(function () {
        //if ('ts' in data) data.ts = data.ts + 16;
        if (is_running) {
            if (so) {
                //so reste la même
                data.ac = aymeric(data.a.x, data.a.y, data.a.z, data.o.a - so.a, data.o.b - so.b, data.o.g - so.g)
                data.s = aymericSpeed(data, datas);
                const magnitude = Math.sqrt(
                    data.ac.x * data.ac.x +
                    data.ac.y * data.ac.y +
                    data.ac.z * data.ac.z
                  );

                if ((magnitude>threshold_detection)&&(done2==false)&&(detection==false)){
                    detection=true;   
                }
                

                if ((detection==true) && (current<nb_frame)&&(done2==false)&&(magnitude>=threshold_detection)){
                    datas.push(JSON.parse(JSON.stringify(data)))
                    current=current+1;
                }
                
       
                

                
                if ((detection==true)&& ((current==nb_frame)||(magnitude<threshold_detection))&&(done2==false)&&(current>nb_frame*0.8)){
                    if ((magnitude<threshold_detection)&&(current<nb_frame*0.8)){
                        punch=false;
                        detection=false;
                        done2=false;
                        datas=[];
                        current=0;
                        //on ne considere pas un coup avec trop peu de frames par rapport à la ref sinon on a des positifs avec seulement 3 points
                    }else{
                        console.log(datas.length)
                        for(let i=0;i<datas.length;i++){
                        console.log(Math.abs(datas[i].ac.x-ref[beginindex+i].ac.x),Math.abs(datas[i].ac.y-ref[beginindex+i].ac.y),Math.abs(datas[i].ac.z-ref[beginindex+i].ac.z))
                    if ((Math.abs(datas[i].ac.x-ref[beginindex+i].ac.x)<thresholdx) && (Math.abs(datas[i].ac.y-ref[beginindex+i].ac.y)<thresholdy) && (Math.abs(datas[i].ac.z-ref[beginindex+i].ac.z)<thresholdz)){
                        //jusqu'ici tout va bien
                        punch=true;
                        
                    }else{
                        //premier point ou c'est pas bon on renitialise pour la prochaine acquisition/essai
                        console.log('fail ici')
                        punch=false;
                        i=datas.length;
                        detection=false;
                        done2=false;
                        datas=[];
                        current=0;
                    }
                }
                //quand j'ai finis l'inspection du mouvement si on a detecté c'est fini sinon on repart détecter qqch
                if ((punch==true)&&(done2==false)){
                        
                    //le if qui suit est brut de décofrage du code de laurent j'ai rien modifié
                    if ( lastEmit + 500 < Date.now()) {
                        lastEmit = Date.now();
                        if (socket) socket.emit('action', {
                            id: device_id,
                            type: "device",
                            position: device_type,
                            record: record_move,
                            name: "S",
                            date: lastEmit
                        });
                        $("#notification").html((device_type + " STRAIGHT").toUpperCase()).addClass("text-success");
                        count = 0;
                        setTimeout(function () {
                            $("#notification").html("N/A").removeClass("text-success");
                        }, 800);}
                        done2=true;
                }}
                console.log('resultat du coup',punch);
            
            }   

            

//ask laurent est ce que je degage ce qui suit
            
            if ('ac' in data) {
                if ('x' in data.ac) updateFieldIfNotNull('Accelerometer_calc_x', data.ac.x);
                if ('y' in data.ac) updateFieldIfNotNull('Accelerometer_calc_y', data.ac.y);
                if ('z' in data.ac) updateFieldIfNotNull('Accelerometer_calc_z', data.ac.z);
            }
            if (data.s) {
                if ('x' in data.s) updateFieldIfNotNull('Accelerometer_speed_calc_x', data.s.x);
                if ('y' in data.s) updateFieldIfNotNull('Accelerometer_speed_calc_y', data.s.y);
                if ('z' in data.s) updateFieldIfNotNull('Accelerometer_speed_calc_z', data.s.z);
            }

            //if (Math.abs(data.ac.x) > 1 && Math.abs(data.ac.y) > 1) {
            if ('ac' in data && 'x' in data.ac && Math.abs(data.ac.x) > 2) {
                count++;
                
                }
            } else count = 0;

            if (datas.length > data_size) datas.shift();
            if (is_debug && socket && data) {
                socket.emit('data', data);
            }
        }
    }, 16); //toute les 16 millisecs

})