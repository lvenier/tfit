var is_running = false;
var is_debug = false;
var datas = [];
var speed = [{ x: 0, y: 0, z: 0 }];
var pos = [{ x: 0, y: 0, z: 0 }];
var move = 0;
var count = 0;
var moves = [];
var orient = {};
var popover = false;
var lastEmit = Date.now()
var dat = [];
var data = null;
var so = null;
var running = null;
var data_size = 32;
var current = 0;

var incr_t = 0;

var min_frame = 40;
var thresholdx = 6;
var thresholdy = 8;
var thresholdz = 9;
var thresholdx2 = 8;
var thresholdy2 = 10;
var thresholdz2 = 12; //à voir à combien je les mets , pour l'instant empiriquement, je veux éviter les faux negatifs

//limites pour les upgrades de niveau
var min_th_x = 5;
var min_th_y = 5;
var min_th_z = 7;

var max_th_x = 11;
var max_th_y = 11;
var max_th_z = 12;

var a = 0.6;
var b = 1.8;

var done1 = false;
var done2 = false;
var detection = false;
var ref = [];
var threshold_detection = 1.0;
var ref_length = 15;
var nb_coups = 0;
var mean_x = null;
var mean_y = null;
var mean_z = null;
var mag = [];
var w_x = null;
var w_y = null;
var w_z = null;
var good_consecutive = 0;
var bad_consecutive = 0;
var punch = false;
var file_name = null;
var which = "jab";
var acquisiton = false;
var begin = false;

var score_opt_x = 10000;
var score_opt_y = 10000;
var score_opt_z = 10000;

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

//SI BESOIN REDEFINIR LES THRESHOLD DANS LES IF CI DESSOUS


//MINIMUM ENTRE A ET B
function min(a, b) {
    if (a < b) {
        //console.log('min',a);
        return a;
    }
    if (b <= a) {
        //console.log('min',b)
        return b;
    }

}

//NORM DE V1-V2
function Euclid_norm_diff(v1, v2) {
    var L = min(v1.length, v2.length);
    let N = 0;
    for (let k = 0; k < L; k++) {
        N = N + (v1[k] - v2[k]) ** 2;
        //console.log('norm',(v2[k]));
    }
    N = Math.sqrt(N);
    return N;
}
//NORME DU VECTEUR V
function Norm2(v) {
    var N = 0;
    for (let k = 0; k < v.length; k++) {
        N = N + (2 * v[k]) ** 2;
    }
    N = Math.sqrt(N);
    return N;
}
//NORME DE V1-V2 PONDERE PAR LES POIDS CALCULEES LORS DE L'ACQUISITION DE DONNEES
function Weighted_Euclid_norm_diff(v1, v2, w) {
    var L = min(v1.length, v2.length, w.length);
    let N = 0;
    for (let k = 0; k < L; k++) {
        N = N + w[k] * (v1[k] - v2[k]) ** 2;
        //console.log('norm',(v2[k]));
    }
    N = Math.sqrt(N);
    return N;
}

function filtre3(dat) {

    var dat2 = dat;
    console.log('avant', dat[1])
    for (let i = 1; i < dat.length - 1; i++) {

        dat2[i].x = (dat[i - 1].x + dat[i].x + dat[i + 1].x) * 1 / 3;
        dat2[i].y = (dat[i - 1].y + dat[i].y + dat[i + 1].y) * 1 / 3;
        dat2[i].z = (dat[i - 1].z + dat[i].z + dat[i + 1].z) * 1 / 3;

    }
    console.log('après', dat2[1])
    return dat2;
}

function filtre5(dat) {

    var dat2 = dat;
    for (let i = 2; i < dat.length - 2; i++) {

        dat2[i].x = (dat[i - 2].x + dat[i - 1].x + dat[i].x + dat[i + 1].x + dat[i + 2].x) * 1 / 5;
        dat2[i].y = (dat[i - 2].y + dat[i - 1].y + dat[i].y + dat[i + 1].y + dat[i + 2].y) * 1 / 5;
        dat2[i].z = (dat[i - 2].z + dat[i - 1].z + dat[i].z + dat[i + 1].z + dat[i + 2].z) * 1 / 5;

    }
    // console.log('après',dat2[1])
    return dat2;
}



//NORMALISATION DE LA DATA
function norm(dat) {
    dat.x = dat.map(({ x }) => x);
    dat.y = dat.map(({ y }) => y);
    dat.z = dat.map(({ z }) => z);
    //console.log('in f',dat)
    var mean_x = mean(dat.x);
    var mean_y = mean(dat.y);
    var mean_z = mean(dat.z);

    var std_x = std(dat.x, mean_x);
    var std_y = std(dat.y, mean_y);
    var std_z = std(dat.z, mean_z);

    //.log(S2_x,dat[0].x,mean_x);
    for (let i = 0; i < dat.length; i++) {

        dat[i].x = (dat[i].x - mean_x) / std_x;
        dat[i].y = (dat[i].x - mean_y) / std_y;
        dat[i].z = (dat[i].z - mean_z) / std_z;
    }
    dat.x = dat.map(({ x }) => x);
    dat.y = dat.map(({ y }) => y);
    dat.z = dat.map(({ z }) => z);
    //console.log(dat.x,dat.y,dat.z);
    return dat;
};
//OBTENUR LA MOYENNE
function mean(vect) {
    var M = 0;
    for (let j = 0; j < vect.length; j++) {
        M = M + vect[j];
    }
    M = (1 / vect.length) * M;
    return M;
}
//STANDARD DEVIATION
function std(vector, M) {
    var SD = 0;
    for (let j = 0; j < vector.length; j++) {
        SD = SD + (vector[j] - M) ** 2;
    }
    SD = Math.sqrt((1 / vector.length) * SD);
    return SD;

}
//NORME DE L ACCEL
function magnitude(acceleration) {
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

    ns.x = speed[speed.length - 1].x + (da.ac.x) * (16) * 1e-3
    ns.y = speed[speed.length - 1].y + (da.ac.y) * (16) * 1e-3
    ns.z = speed[speed.length - 1].z + (da.ac.z) * (16) * 1e-3

    if (incr_t < 125) {
        speed.push({ x: ns.x, y: ns.y, z: ns.z })
        incr_t += 1

    }
    else {
        speed.push({ x: 0, y: 0, z: 0 })
        incr_t = 0
    }

    /*
        let np = {}
        np.x = pos[pos.length-1].x + (speed[speed.length-1].x)*(16)*1e-3
        np.y = pos[pos.length-1].y + (speed[speed.length-1].y)*(16)*1e-3
        np.z = pos[pos.length-1].z + (speed[speed.length-1].z)*(16)*1e-3
        pos.push({ x: np.x, y: np.y, z: np.z })
    */
    return { x: speed[speed.length - 1].x, y: speed[speed.length - 1].y, z: speed[speed.length - 1].z }
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

//MIS A JOUR DE LA DIFFICULTE
function UpdateThreshold(good_consecutive, bad_consecutive) {
    if ((good_consecutive == 4) && (thresholdx > min_th_x) && (thresholdy > min_th_y) && (thresholdz > min_th_z)) {
        thresholdx = thresholdx - 0.5;
        thresholdy = thresholdy - 0.5;
        thresholdz = thresholdz - 0.5;
        console.log('difficulté augmentée')
        return true;
    }
    if ((bad_consecutive == 4) && (thresholdx < max_th_x) && (thresholdy < max_th_y) && (thresholdz < max_th_z)) {
        thresholdx = thresholdx + 0.5;
        thresholdy = thresholdy + 0.5;
        thresholdz = thresholdz + 0.5;
        console.log('difficulté diminuée')
        return true;
    }
    return false;
}
//DETERMINE SI C'EST UN BON COUP
function IsPunch(dat, mean_x, mean_y, mean_z) {
    dat.x = dat.map(({ x }) => x);
    dat.y = dat.map(({ y }) => y);
    dat.z = dat.map(({ z }) => z);
    console.log(dat.x)
    console.log(mean_x)
    //pour le score norm_ref_x
    norm_ref_x = Norm2(mean_x);
    norm_ref_y = Norm2(mean_y);
    norm_ref_z = Norm2(mean_z);

    diff_x_w = Weighted_Euclid_norm_diff(mean_x, dat.x, w_x);
    diff_y_w = Weighted_Euclid_norm_diff(mean_y, dat.y, w_y)
    diff_z_w = Weighted_Euclid_norm_diff(mean_z, dat.z, w_z)
    console.log(diff_x_w, diff_y_w, diff_z_w);
    //diff_x=Euclid_norm_diff(mean_x,dat.x);
    //diff_y=Euclid_norm_diff(mean_y,dat.y);
    //diff_z=Euclid_norm_diff(mean_z,dat.z);
    //console.log(diff_x,diff_y,diff_z);
    var score = [(1 - (diff_x_w - score_opt_x) / norm_ref_x) * 100, (1 - (diff_y_w - score_opt_y) / norm_ref_y) * 100, (1 - (diff_z_w - score_opt_z) / norm_ref_z) * 100];
    console.log(score);

    if ((diff_x_w < thresholdx) && (diff_y_w < thresholdy) && (diff_z_w < thresholdz)) {
        console.log('point faible: trop fort');
        bad_consecutive = 0;
        good_consecutive = good_consecutive + 1;
        punch = true;


        if (lastEmit + 500 < Date.now()) {
            lastEmit = Date.now();
            if (socket) socket.emit('action', {
                id: device_id,
                type: "device",
                position: device_type,
                record: record_move,
                name: "J",
                date: lastEmit
            });
            $("#notification").html((device_type + " Jab").toUpperCase()).addClass("text-success");
            count = 0;
            setTimeout(function () {
                $("#notification").html("N/A").removeClass("text-success");
            }, 800);
        }


    } else if ((diff_x_w < thresholdx2) && (diff_y_w < thresholdy2) && (diff_z_w < thresholdz2)) {
        console.log('vraiment pas loin, continue')
    } else {
        console.log("Nan c'est pas bon ça")
        bad_consecutive = bad_consecutive + 1;
        good_consecutive = 0;
        punch = false;
    }
    if (UpdateThreshold(good_consecutive, bad_consecutive)) {
        bad_consecutive = 0;
        good_consecutive = 0;
    }

    return punch;
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

        if (record_move == "jab") {
            console.log(record_move)
            file_name = "/records/ref-Jab-Left.txt";
            console.log(file_name);
        } else if (record_move = "cross") {
            thresholdz = 7;
            thresholdz2 = 10;
            min_th_z = 5;
            max_th_z = 12;
            console.log('ok cross')
            file_name = "/records/ref-Cross-Right.txt";
        } else if (record_move == "uppercut") {
            thresholdy = 5;
            min_th_y = 3;
            max_th_y = 6.5;
            thresholdz = 14;//refaire les mesures ??
            min_th_z = 12;
            max_th_x = 16;
            threshold_detection = 3.0;
            file_name = "/records/ref-upp-left.txt";

        } else if (record_move == "hook") {
            file_name = "/records/ref-hook-Left.txt";
        }
        $.get(file_name, function (data, status) {
            console.log(file_name);
            data.split(/\r?\n/).forEach(line => {
                console.log('ok')
                ref.push(JSON.parse(line));
            });
            console.log(file_name);
            var j = 0;
            while ((ref[j].o.a == 0) && (ref[j].o.b == 0) && (ref[j].o.g == 0)) {
                j = j + 1;
            }

            soa = ref[j].o.a;
            sob = ref[j].o.b;
            sog = ref[j].o.g;


            for (let i = 0; i < ref.length; i++) {
                ref[i].ac = aymeric(ref[i].a.x, ref[i].a.y, ref[i].a.z, ref[i].o.a - soa, ref[i].o.b - sob, ref[i].o.g - sog)
                ref[i].mag = magnitude(ref[i].ac);//magnitude ne depend par du repere donc on calcule celle avec a
            }
            ref.mag = ref.map(({ mag }) => mag);
            console.log(ref.mag);
            for (let i = 1; i < ref.length - 1; i++) {
                //ref[i].ac=aymeric(ref[i].a.x, ref[i].a.y, ref[i].a.z, ref[i].o.a - soa, ref[i].o.b - sob, ref[i].o.g - sog)
                ref[i].magfilt = 1 / 3 * (ref[i - 1].mag + ref[i].mag + ref[i + 1].mag);//magnitude ne depend par du repere donc on calcule celle avec a
            }

            for (let i = 0; i < ref.length; i++) {
                if (ref[i].magfilt > threshold_detection) {
                    //ref[i].ac=aymeric(ref[i].a.x, ref[i].a.y, ref[i].a.z, ref[i].o.a - soa, ref[i].o.b - sob, ref[i].o.g - sog);
                    current = current + 1;
                    dat.push(JSON.parse(JSON.stringify(ref[i].ac)));
                } else if (current != 0) {
                    if (current > min_frame) {

                        dat.x = dat.map(({ x }) => x);
                        dat.y = dat.map(({ y }) => y);
                        dat.z = dat.map(({ z }) => z);
                        if (nb_coups == 0) {
                            dat = filtre5(dat);
                            dat.x = dat.map(({ x }) => x);
                            dat.y = dat.map(({ y }) => y);
                            dat.z = dat.map(({ z }) => z);
                            dat = norm(dat);
                            dat.x = dat.map(({ x }) => x);
                            dat.y = dat.map(({ y }) => y);
                            dat.z = dat.map(({ z }) => z);

                            //console.log(dat.x,dat.y,dat.z);
                            console.log(i - dat.length);
                            datas.push(dat);
                            dat = [];


                        } else {

                            datas.push([]);
                            //console.log(dat);
                            //console.log('avant',dat.x,dat.y,dat.z);
                            dat = filtre5(dat);
                            dat.x = dat.map(({ x }) => x);
                            dat.y = dat.map(({ y }) => y);
                            dat.z = dat.map(({ z }) => z);
                            dat = norm(dat);
                            dat.x = dat.map(({ x }) => x);
                            dat.y = dat.map(({ y }) => y);
                            dat.z = dat.map(({ z }) => z);
                            //console.log(dat)

                            //console.log(dat)
                            datas[datas.length - 1] = dat;
                            dat = [];
                        }
                        if (current < ref_length) { ref_length = current }
                        current = 0;
                        nb_coups = nb_coups + 1;
                    } else {
                        dat = [];
                        current = 0;
                    }

                }
            };
            ref_length = datas[0].length;
            for (let i = 1; i < datas.length; i++) {
                if (datas[i].length < ref_length) { ref_length = datas[i].length }
            }
            //datas.pop()


            mean_x = new Array(ref_length);
            mean_y = new Array(ref_length);
            mean_z = new Array(ref_length);

            w_x = new Array(ref_length);
            w_y = new Array(ref_length);
            w_z = new Array(ref_length);

            var var_totx = new Array(ref_length);
            var var_toty = new Array(ref_length);
            var var_totz = new Array(ref_length);

            for (let j = 0; j < ref_length; j++) {
                mean_x[j] = 0;
                mean_y[j] = 0;
                mean_z[j] = 0;
                //je prends pas la première obs
                for (let k = 1; k < datas.length; k++) {
                    console.log(1)
                    mean_x[j] = mean_x[j] + datas[k].x[j];
                    mean_y[j] = mean_y[j] + datas[k].y[j];
                    mean_z[j] = mean_z[j] + datas[k].z[j];
                }
                mean_x[j] = (1 / (datas.length - 1)) * mean_x[j];
                mean_y[j] = (1 / (datas.length - 1)) * mean_y[j];
                mean_z[j] = (1 / (datas.length - 1)) * mean_z[j];
            }
            for (let j = 0; j < ref_length; j++) {
                var_totx[j] = 0;
                var_toty[j] = 0;
                var_totz[j] = 0;
                for (let k = 1; k < datas.length; k++) {
                    var_totx[j] = var_totx[j] + (mean_x[j] - datas[k].x[j]) ** 2;
                    var_toty[j] = var_toty[j] + (mean_y[j] - datas[k].y[j]) ** 2;
                    var_totz[j] = var_totz[j] + (mean_z[j] - datas[k].z[j]) ** 2;
                }
                var_totx[j] = (1 / (datas.length - 1)) * var_totx[j];
                var_totx[j] = (1 / (datas.length - 1)) * var_totx[j];
                var_totx[j] = (1 / (datas.length - 1)) * var_totx[j];
                //SEE PERFORMANCE IF YOU WANT TO INCLUDE OR NOT
                /*
                var_totx[j]=Math.sqrt(var_totx[j])
                var_toty[j]=Math.sqrt(var_toty[j])
                var_totz[j]=Math.sqrt(var_totz[j])
                */

                w_x[j] = 1 / (1 + var_totx[j]);
                w_y[j] = 1 / (1 + var_toty[j]);
                w_z[j] = 1 / (1 + var_totz[j]);
            }
            //les valeurs de score correspondent donc le meilleur coup possible
            for (let k = 1; k < datas.length; k++) {
                score_opt_x = min(score_opt_x, Weighted_Euclid_norm_diff(mean_x, datas[k].x, w_x));
                score_opt_y = min(score_opt_y, Weighted_Euclid_norm_diff(mean_y, datas[k].y, w_y));
                score_opt_z = min(score_opt_z, Weighted_Euclid_norm_diff(mean_z, datas[k].z, w_z));
            }
            console.log(score_opt_x, score_opt_y, score_opt_z)
            dat = [];


            //CONSOLE LOG DE CONTROLE POUR PLOT
            console.log('nombre de coupq', nb_coups, datas.length)
            console.log(w_x, w_y, w_z);
            console.log(ref_length)
            console.log(mean_x);
            console.log(mean_y);
            console.log(mean_z);
            console.log(datas[2].x);
            console.log(datas[1].x);
            console.log(datas[0].z);
            console.log(datas[1].z);
        })
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
        console.log(file_name);
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






    running = setInterval(function () {
        //if ('ts' in data) data.ts = data.ts + 16;
        if (is_running) {
            if (so) {
                //so reste la même
                data.ac = aymeric(data.a.x, data.a.y, data.a.z, data.o.a - so.a, data.o.b - so.b, data.o.g - so.g)
                data.s = aymericSpeed(data, datas);
                const mag = Math.sqrt(
                    data.ac.x * data.ac.x +
                    data.ac.y * data.ac.y +
                    data.ac.z * data.ac.z
                );

                if (mag > threshold_detection) {
                    if (detection == false) { detection = true; }
                    if (detection == true) {
                        dat.push(JSON.parse(JSON.stringify(data.ac)));
                    }
                } else if (detection == true) {
                    if (dat.length < ref_length * a) {
                        console.log('tu as frappé trop vite ou alors tu n as pas fais de mouvement franche')
                        dat = [];
                        detection = false;
                    } else if (dat.length > ref_length * b) {
                        console.log('tu as frappé trop lentement recommence')
                        dat = [];
                        detection = false;
                    } else {
                        dat.x = dat.map(({ x }) => x);
                        dat.y = dat.map(({ y }) => y);
                        dat.z = dat.map(({ z }) => z);
                        dat = filtre5(dat);
                        dat.x = dat.map(({ x }) => x);
                        dat.y = dat.map(({ y }) => y);
                        dat.z = dat.map(({ z }) => z);
                        dat = norm(dat);
                        dat.x = dat.map(({ x }) => x);
                        dat.y = dat.map(({ y }) => y);
                        dat.z = dat.map(({ z }) => z);
                        IsPunch(dat, mean_x, mean_y, mean_z);
                        dat = [];
                        detection = false;
                    }

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
                if ('ac' in data && 'x' in data.ac && Math.abs(data.ac.x) > 2) {
                    count++;

                }
            } else count = 0;

            if (datas.length > data_size) datas.shift();
            if (is_debug && socket && data) {
                socket.emit('data', data);
                socket.emit('punch', punch);

            }
        }
    }, 16); //toute les 16 millisecs
})



