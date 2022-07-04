const DELAY = 100;
const key = localStorage.getItem('key')
if (key === null) window.location.replace("/login.html");
var config = JSON.parse(localStorage.getItem('config'))

if (config === null) {
  config = {
    ay: {
      x:true,
      y:true,
      z:true
    },
    r: {
      a:true,
      b:true,
      g:true
    },
    a: {
      x:true,
      y:true,
      z:true
    },
    o: {
      x:true,
      y:true,
      z:true
    }
  }
  localStorage.setItem('config', JSON.stringify(config))
}

$.ajax({
  url: "/api/login?key=" + key
}).done(function (result) {
  if (result.status !== "success") {
    window.location.replace("/login.html");
  }
});

const socket = io({
  query: {
    "from": "home"
  }
});

const AccelerationStates = {
  Stationary: 'Stationary',
  Accelerate: 'Accelerate',
  Decelerate: 'Decelerate'
};

const AccelerationThreshold = 1;
const DecelerationThreshold = AccelerationThreshold / 3;
const AccelerationMax = AccelerationThreshold * 2;
const AccelerationThresholdCount = 3;

const Direction = {
  Undefined: 'Undefined',
  Forwards: 'Forwards',
  Backwards: 'Backwards',
};

var accelerationState = AccelerationStates.Stationary;
var currentDirection = Direction.Undefined;

var aymericChart = null;
var aymericSeries1 = new TimeSeries();
var aymericSeries2 = new TimeSeries();
var aymericSeries3 = new TimeSeries();

var rotationRateChart = null;
var rotationRateSeries1 = new TimeSeries();
var rotationRateSeries2 = new TimeSeries();
var rotationRateSeries3 = new TimeSeries();

var accelerationChart = null;
var accelerationSeries1 = new TimeSeries();
var accelerationSeries2 = new TimeSeries();
var accelerationSeries3 = new TimeSeries();

var orientationChart = null;
var orientationSeries1 = new TimeSeries();
var orientationSeries2 = new TimeSeries();
var orientationSeries3 = new TimeSeries();

function init() {
  aymericChart = new SmoothieChart({
    tooltip: true,
    responsive: true,
    scrollBackwards: false
  });
  aymericChart.addTimeSeries(aymericSeries1, {
    strokeStyle: 'rgba(255, 0, 0, 1)',
    fillStyle: 'rgba(255, 0, 0, 0.2)',
    lineWidth: 3
  });
  aymericChart.addTimeSeries(aymericSeries2, {
    strokeStyle: 'rgba(0, 255, 0, 1)',
    fillStyle: 'rgba(0, 255, 0, 0.2)',
    lineWidth: 3
  });
  aymericChart.addTimeSeries(aymericSeries3, {
    strokeStyle: 'rgba(0, 0, 255, 1)',
    fillStyle: 'rgba(0, 0, 255, 0.2)',
    lineWidth: 3
  });

  rotationRateChart = new SmoothieChart({
    tooltip: true,
    responsive: true,
    scrollBackwards: false
  });
  rotationRateChart.addTimeSeries(rotationRateSeries1, {
    strokeStyle: 'rgba(255, 0, 0, 1)',
    fillStyle: 'rgba(255, 0, 0, 0.2)',
    lineWidth: 3
  });
  rotationRateChart.addTimeSeries(rotationRateSeries2, {
    strokeStyle: 'rgba(0, 255, 0, 1)',
    fillStyle: 'rgba(0, 255, 0, 0.2)',
    lineWidth: 3
  });
  rotationRateChart.addTimeSeries(rotationRateSeries3, {
    strokeStyle: 'rgba(0, 0, 255, 1)',
    fillStyle: 'rgba(0, 0, 255, 0.2)',
    lineWidth: 3
  });

  accelerationChart = new SmoothieChart({
    tooltip: true,
    responsive: true,
    scrollBackwards: false
  });
  accelerationChart.addTimeSeries(accelerationSeries1, {
    strokeStyle: 'rgba(255, 0, 0, 1)',
    fillStyle: 'rgba(255, 0, 0, 0.2)',
    lineWidth: 3
  });
  accelerationChart.addTimeSeries(accelerationSeries2, {
    strokeStyle: 'rgba(0, 255, 0, 1)',
    fillStyle: 'rgba(0, 255, 0, 0.2)',
    lineWidth: 3
  });
  accelerationChart.addTimeSeries(accelerationSeries3, {
    strokeStyle: 'rgba(0, 0, 255, 1)',
    fillStyle: 'rgba(0, 0, 255, 0.2)',
    lineWidth: 3
  });

  orientationChart = new SmoothieChart({
    tooltip: true,
    maxValue: 9.81,
    minValue: -9.81,
    responsive: true,
    scrollBackwards: false
  });
  orientationChart.addTimeSeries(orientationSeries1, {
    strokeStyle: 'rgba(255, 0, 0, 1)',
    fillStyle: 'rgba(255, 0, 0, 0.2)',
    lineWidth: 3
  });
  orientationChart.addTimeSeries(orientationSeries2, {
    strokeStyle: 'rgba(0, 255, 0, 1)',
    fillStyle: 'rgba(0, 255, 0, 0.2)',
    lineWidth: 3
  });
  orientationChart.addTimeSeries(orientationSeries3, {
    strokeStyle: 'rgba(0, 0, 255, 1)',
    fillStyle: 'rgba(0, 0, 255, 0.2)',
    lineWidth: 3
  });
}

function handleMotion(event) {

  var now = Date.now();
  if ($("#aymericCheckX").is(':checked')) aymericSeries1.append(now, event.ac.x);
  if ($("#aymericCheckY").is(':checked')) aymericSeries2.append(now, event.ac.y);
  if ($("#aymericCheckZ").is(':checked')) aymericSeries3.append(now, event.ac.z);

  rotationRateSeries1.append(now, event.r.a);
  rotationRateSeries2.append(now, event.r.b);
  rotationRateSeries3.append(now, event.r.g);

  accelerationSeries1.append(now, event.a.x);
  accelerationSeries2.append(now, event.a.y);
  accelerationSeries3.append(now, event.a.z);

  orientationSeries1.append(now, event.awg.x - event.a.x);
  orientationSeries2.append(now, event.awg.y - event.a.y);
  orientationSeries3.append(now, event.awg.z - event.a.z);
  updateState(event);

}

function updateState(event) {

  var newValue = event.a.z;

  switch (accelerationState) {

    case AccelerationStates.Stationary:

      if (Math.abs(newValue) >= AccelerationThreshold) {
        newValue = newValue >= 0 ? AccelerationMax : -AccelerationMax;
      } else {
        newValue = 0;
      }

      if (Math.abs(newValue) == AccelerationMax) {
        currentDirection = newValue < 0 ? Direction.Forwards : Direction.Backwards;
        accelerationState = AccelerationStates.Accelerate;
        console.log(event.a.z, 'STATIONARY -> ACCELERATE', currentDirection);
      }
      break;

    case AccelerationStates.Accelerate:

      if (Math.abs(newValue) >= DecelerationThreshold) {
        newValue = newValue >= 0 ? AccelerationMax : -AccelerationMax;
      } else {
        newValue = 0;
      }
      if (Math.abs(newValue) == AccelerationMax) {
        if (currentDirection == Direction.Forwards && newValue > 0) {
          accelerationState = AccelerationStates.Decelerate;
          console.log(event.a.z, 'ACCELERATE -> DECELERATE');
        } else if (currentDirection == Direction.Backwards && newValue < 0) {
          accelerationState = AccelerationStates.Decelerate;
          console.log(event.a.z, 'ACCELERATE -> DECELERATE');
        }
      }
      break;

    case AccelerationStates.Decelerate:

      if (Math.abs(newValue) >= DecelerationThreshold) {
        newValue = newValue >= 0 ? AccelerationMax : -AccelerationMax;
      } else {
        newValue = 0;
      }

      if (newValue == 0) {
        accelerationState = AccelerationStates.Stationary;
        console.log(event.a.z, 'DECELERATE -> STATIONARY');
      }
      break;
  }
}
$(document).ready(function () {

  socket.on("data", (msg) => {
    handleMotion(msg)
  })

  init();
  $("#aymericCheckX").attr("checked", config.ay.x)
  $("#aymericCheckY").attr("checked", config.ay.y)
  $("#aymericCheckZ").attr("checked", config.ay.z)
  $("#rotationCheckA").attr("checked", config.r.a)
  $("#rotationCheckB").attr("checked", config.r.b)
  $("#rotationCheckG").attr("checked", config.r.g)
  $("#accelerationCheckX").attr("checked", config.a.x)
  $("#accelerationCheckY").attr("checked", config.a.y)
  $("#accelerationCheckZ").attr("checked", config.a.z)
  $("#orientationCheckX").attr("checked", config.o.x)
  $("#orientationCheckY").attr("checked", config.o.y)
  $("#orientationCheckZ").attr("checked", config.o.z)

  
  aymericChart.streamTo(document.getElementById("aymeric-chart"), DELAY);
  rotationRateChart.streamTo(document.getElementById("rotation-rate-chart"), DELAY);
  accelerationChart.streamTo(document.getElementById("acceleration-chart"), DELAY);
  orientationChart.streamTo(document.getElementById("orientation-chart"), DELAY);

  $("#aymericCheckX").on("change", function(){
    config.ay.x = $("#aymericCheckX").is(":checked");
    localStorage.setItem('config', JSON.stringify(config))
  })
  $("#aymericCheckY").on("change", function(){
    config.ay.y = $("#aymericCheckY").is(":checked");
    localStorage.setItem('config', JSON.stringify(config))
  })
  $("#aymericCheckZ").on("change", function(){
    config.ay.z = $("#aymericCheckZ").is(":checked");
    localStorage.setItem('config', JSON.stringify(config))
  })
  
  $("#rotationCheckA").on("change", function(){
    config.r.a = $("#rotationCheckA").is(":checked");
    localStorage.setItem('config', JSON.stringify(config))
  })
  $("#rotationCheckB").on("change", function(){
    config.r.b = $("#rotationCheckB").is(":checked");
    localStorage.setItem('config', JSON.stringify(config))
  })
  $("#rotationCheckC").on("change", function(){
    config.r.g = $("#rotationCheckC").is(":checked");
    localStorage.setItem('config', JSON.stringify(config))
  })

  $("#accelerationCheckX").on("change", function(){
    config.a.x = $("#accelerationCheckX").is(":checked");
    localStorage.setItem('config', JSON.stringify(config))
  })
  $("#accelerationCheckY").on("change", function(){
    config.a.y = $("#accelerationCheckY").is(":checked");
    localStorage.setItem('config', JSON.stringify(config))
  })
  $("#accelerationCheckZ").on("change", function(){
    config.a.z = $("#accelerationCheckZ").is(":checked");
    localStorage.setItem('config', JSON.stringify(config))
  })

  $("#orientationCheckX").on("change", function(){
    config.o.x = $("#orientationCheckX").is(":checked");
    localStorage.setItem('config', JSON.stringify(config))
  })
  $("#orientationCheckY").on("change", function(){
    config.o.y = $("#orientationCheckY").is(":checked");
    localStorage.setItem('config', JSON.stringify(config))
  })
  $("#orientationCheckZ").on("change", function(){
    config.o.z = $("#orientationCheckZ").is(":checked");
    localStorage.setItem('config', JSON.stringify(config))
  })
})