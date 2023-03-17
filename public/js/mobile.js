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

var incr_t = 0;

let condition = false
let nb_point = 0
let calcul = false


let Avg = {}
let Var = {}
let mean_x = 0
let mean_y = 0
let mean_z = 0
let var_x = 0
let var_y = 0
let var_z = 0
let sum_x = 0
let sum_y = 0
let sum_z = 0

let sum_x_sqrt = 0
let sum_y_sqrt = 0
let sum_z_sqrt = 0


let condition_comparaison = false
let iter = 0
let data_load = false
let data_x = {}
let data_y = {}
let data_z = {}
let nb_coup = 0


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


    $.get("/records/Mean.json", function(data, status){ //on le fait
        Avg = JSON.parse(data)
        $("#notification").html(data);
    });
    $.get("/records/Var.json", function(data, status){
        Var = JSON.parse(data)
    });
    data_load = true //on enregistre le fait qu'on a load la data
    

    if (device_type !== "unknown") $("#start").attr("disabled", false);
    else {
        $('html, body').animate({
            scrollTop: $("#device_type").offset().top
        }, 200);
        $("#popover-btn").trigger("click");
        popover = true;
    }

    navigator.getBattery().then(battery => {
        updateFieldIfNotNull('battery', battery.level * 100, 2);
    })

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
            navigator.vibrate(200);
            clearInterval(running);
            running = null;
            is_running = false;
        } else {
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
            navigator.vibrate(200);
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

    running = setInterval(function () {
        //if ('ts' in data) data.ts = data.ts + 16;
        if (is_running) {
            if (so) {
                data.ac = aymeric(data.a.x, data.a.y, data.a.z, data.o.a - so.a, data.o.b - so.b, data.o.g - so.g)
                data.s = aymericSpeed(data, datas);
                datas.push(JSON.parse(JSON.stringify(data)))
            }
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
            /*if ('ac' in data && 'x' in data.ac && Math.abs(data.ac.x) > 2) {
                count++;
                if (count === 7 && lastEmit + 500 < Date.now()) {
                    lastEmit = Date.now();
                    if (socket) socket.emit('action', {
                        id: device_id,
                        type: "device",
                        position: device_type,
                        record: record_move,
                        name: "S",
                        date: lastEmit
                    });
                    //$("#notification").html((device_type + " STRAIGHT").toUpperCase()).addClass("text-success");
                    count = 0;
                    setTimeout(function () {
                        //$("#notification").html("N/A").removeClass("text-success");
                    }, 800);
                }
            } else count = 0;*/

            if (datas.length > data_size) datas.shift();
                if (is_debug && socket && data) {
                    //$("#notification").html((calcul).toString()) 
                    
                    data.ac = aymeric(data.a.x, data.a.y, data.a.z, data.o.a - so.a, data.o.b - so.b, data.o.g - so.g) //projette
                    data.s = aymericSpeed(data, datas); //calcul la vitesse


                    if (data.rec == 'punch') //si selection sur punch
                    {   
                        calcul = false //Il faudra refaire le calcul
                        
                        if (((data.ac.x**2) +( data.ac.y**2) + (data.ac.z**2)) >9 && !condition) //Si l'acc dépasse une valeur et si on n'est pas en mode d'enregistrement
                        {
                            
                            condition = true //on passe en mode enregistrement
                            nb_point = 0 //on réinitilaise le nombre d'incrément
                            nb_coup +=1
                        }
                        
                        if (condition && (nb_point< 88)){ //si on est en mode enregistrement et qu'on enregistre depuis moins de 1.4s et que on a pas dépassé 88 points
                            
                            //$("#notification").html((nb_point).toString())

                            if  (data_x[(nb_point).toString()]){
                                $("#notification").html('0' + (nb_coup).toString())
                                data_x[(nb_point).toString()].push(data.s.x) //on push les valeurs
                                data_y[(nb_point).toString()].push(data.s.y)
                                data_z[(nb_point).toString()].push(data.s.z)
                            }
                            else{
                                $("#notification").html('1'+ (nb_coup).toString())
                                data_x[(nb_point).toString()] = [data.s.x]
                                data_y[(nb_point).toString()] = [data.s.y]
                                data_z[(nb_point).toString()] = [data.s.z]
                            }
                            
                            nb_point = nb_point+1; //on augmente l'incrément de 1
                        }
                        else //Si on a dépassé 1.4s ou le nb de point 
                        {
                            condition = false //on sort du mode enregistrement
                        }
                    }
                    else if (!calcul){ //Si on a pas fait le calcul
                        calcul = true
                        
                        for (let itera=0; itera<88; itera++){
                            
                            
                            len = data_x[(itera).toString()].length
                            
                            for(var i = 0; i < len; i++) {//calcul de la mean et var de chaque point
                                sum_x += data_x[(itera).toString()][i];
                                sum_y += data_y[(itera).toString()][i];
                                sum_z += data_z[(itera).toString()][i];

                                sum_x_sqrt += data_x[(itera).toString()][i]**2;
                                sum_y_sqrt += data_y[(itera).toString()][i]**2;
                                sum_z_sqrt += data_z[(itera).toString()][i]**2;
                            }

                            mean_x = sum_x/len
                            mean_y = sum_y/len
                            mean_z = sum_z/len

                            var_x = sum_x_sqrt/len - mean_x**2
                            var_y = sum_y_sqrt/len - mean_y**2
                            var_z = sum_z_sqrt/len - mean_z**2

                            Mean[(itera).toString()] = {'x':0,'y':0,'z':0}
                            Var[(itera).toString()] = {'x':0,'y':0,'z':0}

                            Mean[(itera).toString()]['x'] = mean_x
                            Mean[(itera).toString()]['y'] = mean_y
                            Mean[(itera).toString()]['z'] = mean_z

                            
                            Var[(itera).toString()]['x'] = var_x
                            Var[(itera).toString()]['y'] = var_y
                            Var[(itera).toString()]['z'] = var_z
                        }
                        //$("#notification").html('ok')
                        Mean_L = {axe :'Mean', data_rec: Mean}
                        Var_L = {axe :'Var', data_rec: Var}

                        socket.emit('data',Mean_L );
                        socket.emit('data', Var_L);
                        
                    }
                    if (data.rec == 'unknown'){ //Si on est en mode reconaissance
                        

                        if((data.ac.x**2) +( data.ac.y**2) + (data.ac.z**2) >9 || condition_comparaison) //Si l'acc dépasse un seil et que on est en mode enregistrement
                            {    
                                //on compte un point de plus
                                
                                condition_comparaison = true //on passe en mode enregistrement
                                ecart_x = data.s.x-Avg[(iter).toString()]['x'] //on calcul les écarts à la moyenne
                                ecart_y = data.s.y-Avg[(iter).toString()]['y']
                                ecart_z = data.s.z-Avg[(iter).toString()]['z']

                                if ((ecart_x < 2.1544*Var[(iter).toString()]['x']) &&
                                        (ecart_y < 2.1544*Var[(iter).toString()]['y']) &&
                                        (ecart_z < 2.1544*Var[(iter).toString()]['z'])) { //Si on est dans la tolérance on compte +1 dans le score
                                    
                                    score +=1
                                }
                                
                                iter += 1;
                            }

                            if(iter>86){ //Si on dépasse le nombre de point 
                                condition_comparaison = false //on sort du mode enregistrement
                                

                                if (score/iter >0.8){ //Si le score dépasse un seil
                                $("#notification").html("coup_droit"); //On affiche que c'est un coup
                                }
                                else { //Sinon
                                    $("#notification").html("N/A"); //On affiche rien
                                }
                                iter = 0 //on réinitialise le nombre de point à 0
                                score = 0 //On réinitialise le score
                            }

                            
                    

                    }
                }
        }
    }, 16);

})

