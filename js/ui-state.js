var error = "";
var errorTimer = 0;
var loading_k = 0;
var loading_m = 0;
var hide_sensor = 0;
var speechString = null;

globalThis.TfitUiState = {
  get error() { return error; },
  get errorTimer() { return errorTimer; },
  get hideSensor() { return hide_sensor; },
  get loadingK() { return loading_k; },
  get loadingM() { return loading_m; },
  get speechString() { return speechString; }
};
