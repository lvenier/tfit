var is_running = false;
var is_debug = false;
var datas = [];
var move = 0;
var count = 0;
var moves = [];

var device_id = localStorage.getItem('device_id') || (Math.random() + 1).toString(36).substring(2)
var device_type = localStorage.getItem('device_type') || 'unknown'
localStorage.setItem('device_id', device_id)

const socket = io({
    query: {
        "id": device_id,
        "from": device_type,
        "type": "device"
    }
});

function aymeric(ax, ay, az, gx, gy, gz) {
    let x = ax * Math.cos(Math.PI / 180 * gy) + ay * Math.sin(Math.PI / 180 * gz) - az * Math.sin(Math.PI / 180 * gy)
    let y = ax * Math.sin(Math.PI / 180 * gz) + ay * Math.cos(Math.PI / 180 * gz) - az * Math.sin(Math.PI / 180 * gx)
    let z = ax * Math.sin(Math.PI / 180 * gy) + ay * Math.sin(Math.PI / 180 * gx) - az * Math.cos(Math.PI / 180 * gx)
    return {
        x: x,
        y: y,
        z: z
    }
}

function handleOrientation(event) {
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
    let data = {
        id: device_id,
        t: device_type,
        i: event.interval,
        ts: event.timeStamp,
        awg: {
            x: event.accelerationIncludingGravity.x,
            y: event.accelerationIncludingGravity.y,
            z: event.accelerationIncludingGravity.z
        },
        a: {
            x: event.acceleration.x,
            y: event.acceleration.y,
            z: event.acceleration.z
        },
        r: {
            a: event.rotationRate.alpha,
            b: event.rotationRate.beta,
            g: event.rotationRate.gamma
        }
    };
    data.ac = aymeric(data.a.x, data.a.y, data.a.z, data.r.a, data.r.b, data.r.g)
    updateFieldIfNotNull('Accelerometer_calc_x', data.ac.x);
    updateFieldIfNotNull('Accelerometer_calc_y', data.ac.y);
    updateFieldIfNotNull('Accelerometer_calc_z', data.ac.z);
    datas.push(data)

    //if (Math.abs(data.ac.x) > 1 && Math.abs(data.ac.y) > 1) {
    if (Math.abs(data.ac.x) > 2) {
        if (is_debug && socket) {
            socket.emit('data', data);
        }
        count++;
        if (count === 7) {
            if (socket) socket.emit('action', {
                id: device_id,
                type: "device",
                position: device_type,
                name: "straight"
            });
            $("#notification").html((device_type + " STRAIGHT").toUpperCase()).addClass("text-success");
            count = 0;
            setTimeout(function () {
                $("#notification").html("N/A").removeClass("text-success");
            }, 800);
        }
    } else count = 0;

    if (datas.length > 32) datas.shift();
}

$(document).ready(function () {
    $('#device_id').html(device_id);
    $('#device_type').val(device_type);
    if (device_type !== "unknown") $("#start").attr("disabled",false);

    navigator.getBattery().then(battery => {
        updateFieldIfNotNull('battery', battery.level * 100, 2);
    })

    $("#device_type").change(function (e) {
        device_type = $("#device_type").val();
        localStorage.setItem('device_type', device_type);
        if (socket) socket.emit('action', {
            id: device_id,
            type: "device",
            position: device_type,
            name: "changetype"
        })
        if (device_type === "unknown") $("#start").attr("disabled",true);
        else $("#start").attr("disabled",false);
    })

    $("#debug").on("click", function (e) {
        is_debug = !is_debug;
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
                name: "stop"
            })
            $("#start").html("Start");
            $("#start").addClass('btn-success');
            $("#start").removeClass('btn-danger');
            navigator.vibrate(200);
            is_running = false;
        } else {
            window.addEventListener("devicemotion", handleMotion);
            window.addEventListener("deviceorientation", handleOrientation);
            if (socket) socket.emit('action', {
                id: device_id,
                type: "device",
                position: device_type,
                name: "start"
            })
            $("#start").html("Stop");
            $("#start").removeClass('btn-success');
            $("#start").addClass('btn-danger');
            navigator.vibrate(200);
            is_running = true;
        }
    });
})