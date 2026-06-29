# Face Recognition

Box4Fit can recognize a registered player locally before a workout starts. It complements the ml5.js BodyPose flow: pose detection owns punch and dodge detection, while face recognition identifies the current player on the main menu.

The feature uses:

- SCRFD ONNX for face detection.
- ONNX Runtime Web for local inference.
- A local ONNX face embedding model.
- `localStorage` for averaged face embeddings and profile links.

No face images are stored. No backend or cloud API is used.

## Model Files

Place the model files here:

```text
assets/models/face-recognition/500m.onnx
assets/models/face-recognition/w600k_mbf.onnx
```

Expected files:

- `500m.onnx`: SCRFD detector, preferably `1x3x640x640` RGB input.
- `w600k_mbf.onnx`: embedding model, preferably `1x3x112x112` RGB input.

The app reads ONNX input metadata when available, so compatible square input sizes can be used with config fallbacks.

## Startup Behavior

Face recognition initializes after the camera starts. Recognition runs when Box4Fit is idle on the main menu after the initial pose readiness check has completed.

The panel shows recognition status and then the matched player name, registration progress, or `Unknown player`.

## Registration

When no face profiles are stored, Box4Fit registers the currently selected player by default. Keep your face visible for a few seconds while samples are captured.

If a detected face does not match an existing profile, Box4Fit shows `Unknown player` by default. Unknown-face auto-registration is available only when explicitly enabled with `autoRegisterUnknown: true`.

To re-register faces, clear:

```text
localStorage.box4fit_face_profiles
```

## Player Profiles

A successful match sets `selected_player` to the stored profile key and shows the player name. Stored face profiles contain averaged embeddings, profile keys, and display names.

Use `P` on the main menu to open the profile screen. The profile screen supports:

- `E`: edit the selected player name.
- `V`: view selected profile stats.
- `Enter`: save while editing.
- `Backspace` or `Delete`: remove one character while editing.
- `Escape`: cancel editing.

Updating the player name updates both the selected player profile and the stored face-profile name.

## Default Configuration

| Key | Default | Meaning |
| --- | --- | --- |
| `autoRegisterWhenEmpty` | `true` | Register the selected player when no face profiles exist. |
| `autoRegisterUnknown` | `false` | Automatically create/register a new player for unknown faces. |
| `detectorModelPath` | `assets/models/face-recognition/500m.onnx` | Detector model path. |
| `detectorInputSize` | `640` | Detector input size fallback. |
| `embeddingModelPath` | `assets/models/face-recognition/w600k_mbf.onnx` | Embedding model path. |
| `embeddingInputSize` | `112` | Embedding input size fallback. |
| `faceConfidenceThreshold` | `0.5` | Minimum detector confidence. |
| `maxProfiles` | `12` | Maximum stored face profiles. |
| `minSamples` | `5` | Minimum samples required to register. |
| `mainMenuPollMs` | `250` | Poll interval while waiting for main menu readiness. |
| `nmsThreshold` | `0.4` | Non-maximum suppression threshold. |
| `recognitionRetryDelayMs` | `250` | Delay between recognition retries. |
| `recognitionSampleCount` | `3` | Samples used for recognition. |
| `recognitionSampleDelayMs` | `120` | Delay between recognition samples. |
| `recognitionTimeoutMs` | `5000` | Maximum recognition window on the main menu. |
| `sampleCount` | `8` | Samples captured during registration. |
| `sampleDelayMs` | `260` | Delay between registration samples. |
| `scoreThreshold` | `0.72` | Minimum embedding match score. |
| `storageKey` | `box4fit_face_profiles` | `localStorage` key for face embeddings. |

Override face-recognition options before app startup:

```html
<script>
  window.__TFIT_FACE_RECOGNITION_CONFIG__ = {
    scoreThreshold: 0.68,
    recognitionTimeoutMs: 8000,
    autoRegisterWhenEmpty: false
  };
</script>
```

## Test Flag

Set this flag before startup to disable face recognition in deterministic browser tests:

```js
window.__TFIT_DISABLE_FACE_RECOGNITION_FOR_E2E = true;
```
