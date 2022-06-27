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
    datas.push(data)

    if (is_debug && socket) {
        socket.emit('data', data);
    }

    if (Math.abs(data.a.x) > 2 && Math.abs(data.a.y) < 2) {
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

    if (datas.length > 7) datas.shift();
}

$(document).ready(function () {
    $('#device_id').html(device_id);
    $('#device_type').val(device_type);

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