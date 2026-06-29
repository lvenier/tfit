# Rules And Configuration

This document explains the gameplay rules, player controls, configurable values, and local storage keys used by Box4Fit.

## Startup Rules

Box4Fit starts by loading local assets, creating a p5.js canvas, starting the webcam runtime, and waiting for ml5.js BodyPose to detect the player.

The game becomes ready when the camera can see:

- Nose
- Left wrist
- Right wrist

Each part must have confidence greater than `0.1`. If the app cannot detect the required parts after the readiness window, it shows a detection error.

## Main Modes

The main menu has five destinations:

- `Shadow`: generated combo prompts fall through the guard targets.
- `Train Pad`: a moving pad target asks for left punches, right punches, or down dodges.
- `Fight`: the player fights a ladder of configured opponents.
- `Configuration`: round settings, difficulty, frame rate, and calibration.
- `Profile`: current player name and profile statistics.

## Controls

### Main Menu

| Key | Action |
| --- | --- |
| `S` | Open Shadow |
| `T` | Open Train Pad |
| `F` or `I` | Open Fight |
| `C` | Open Configuration |
| `P` | Open Profile |

### Shared Mode Controls

| Key | Action |
| --- | --- |
| `F` | Start the selected game mode |
| `B` | Go back to the main menu when a game is not running |
| `S` | Stop the current game when already inside a game mode |

The same actions are available with the on-screen buttons.

### Configuration Controls

| Key | Action |
| --- | --- |
| `S` | Cycle series count |
| `T` or `D` | Cycle round duration |
| `L` | Cycle difficulty |
| `F` | Cycle frame rate |
| `C` | Start calibration |
| `R` | Reset calibration defaults while calibrating |

During calibration, drag the on-screen guard and threshold markers to tune punch and dodge detection.

### Profile Controls

| Key | Action |
| --- | --- |
| `E` | Edit the selected profile name |
| `V` | View selected profile stats |
| `Enter` | Save the profile name while editing |
| `Backspace` or `Delete` | Delete one character while editing |
| `Escape` | Cancel profile-name editing |

Profile names accept letters, numbers, spaces, underscores, and hyphens up to 24 characters.

## Moves

The generated move ids are defined in `js/game-config.js`.

| Id | Move |
| --- | --- |
| `0` | Rest / no scoring move |
| `1` | Left jab |
| `2` | Right jab |
| `3` | Left hook |
| `4` | Right hook |
| `5` | Left uppercut |
| `6` | Right uppercut |
| `7` | Left dodge |
| `8` | Right dodge |
| `9` | Down dodge |
| `10` | Switch guard |

Jabs, hooks, uppercuts, and dodges are scoring moves. Switch guard changes stance and does not count toward the scoring-move total.

## Difficulty

Difficulty is stored as `level` in `localStorage`.

| Value | Label | Rule Effect |
| --- | --- | --- |
| `0` | Easy | Wider hit timing window; Shadow inserts frequent rest moves; Fight has fewer opponents and slower prompts. |
| `1` | Medium | Standard hit timing; Shadow inserts occasional rest moves; Fight uses a medium opponent ladder. |
| `2` | Hard | Tightest hit timing; Shadow does not insert difficulty rests; Fight uses the full opponent ladder. |

The base timing window is calculated as `50 - level * 10`, then used by modes as a gesture-matching window.

## Round Length

Round duration is stored as `length` in `localStorage`. The stored value is an index, not seconds.

| Stored Index | Seconds |
| --- | --- |
| `1` | 30 |
| `2` | 60 |
| `3` | 120 |
| `4` | 180 |
| `5` | 300 |

The default index is `2`, which means 60 seconds.

## Series

Series count is stored as `series` in `localStorage`.

- Allowed range: `1` through `5`
- Default: `1`
- Applies to Shadow and Train Pad multi-round sessions
- Fight mode manages its own stage and round ladder

## Frame Rate

Frame rate is stored as `frame_rate` in `localStorage`.

Allowed values:

```text
20, 40, 60, 80, 100, 120
```

The default is `60`. Cycling frame rate wraps from `120` back to `20`.

## Shadow Rules

Shadow mode generates a move list for the selected round length.

Generation rules:

- The first two slots are rests.
- The final five slots are rests.
- Easy adds a rest every second generated slot.
- Medium adds a rest every fifth generated slot.
- Hard does not add difficulty rests.
- Shadow mode inserts one `SWITCH_GUARD` move halfway through the round.

Shadow focus is stored as `shadow_focus` in `localStorage`.

| Value | Label | Generated Moves |
| --- | --- | --- |
| `0` | All | Jabs, hooks, uppercuts, and dodges |
| `1` | Jab | Left and right jabs |
| `2` | Hook | Left and right hooks |
| `3` | Ucut | Left and right uppercuts |
| `4` | Dodge | Left, right, and down dodges |
| `5` | Punches | Jabs, hooks, and uppercuts |

A prompt is successful when the matching recent gesture occurs while the prompt overlaps the calibrated target area.

## Train Pad Rules

Train Pad mode creates one target at a time.

- Punch targets appear as circles.
- Left-side circles ask for a left punch.
- Right-side circles ask for a right punch.
- Dodge targets appear as a horizontal bar and ask for a down dodge.
- Hitting or dodging the current target immediately creates the next target.

Targets are placed inside the canvas while avoiding the calibrated guard area where possible.

## Fight Rules

Fight mode pits the player against configured opponents from `OPPONENTS`.

Fight flow:

- A fight starts at stage 1 with the first opponent.
- Landing punch prompts reduces opponent stamina unless the opponent blocks.
- Missing or failing opponent prompts can reduce player stamina.
- If the opponent reaches `0` stamina, the player wins the stage.
- If the player reaches `0` stamina, the player loses the fight.
- If time expires without a stamina knockout, the same stage restarts and the opponent recovers some stamina.
- Winning the final available stage completes the fight ladder.

Difficulty controls how many opponents are available:

- Easy: first 2 opponents
- Medium: first 3 opponents
- Hard: full roster

## Opponent Configuration

Opponents are configured in `js/game-config.js`.

| Id | Name | Wait Frames | Stamina | Recovery | Block Chance |
| --- | --- | --- | --- | --- | --- |
| `0` | Raja | 120 | 6 | 2 | 0.16 |
| `1` | Theo | 120 | 8 | 3 | 0.24 |
| `2` | Vehbo | 120 | 10 | 2 | 0.32 |
| `3` | Cyril | 110 | 12 | 3 | 0.40 |
| `4` | Lav | 100 | 14 | 4 | 0.48 |

Other opponent fields:

- `renderer`: renderer key used by opponent sprite/animation code.
- `scale`: visual scale.
- `xRatio`: horizontal placement ratio.
- `yRatio`: vertical placement ratio.

## Calibration

Calibration values are persisted in `localStorage` and restored on startup.

| Key | Meaning |
| --- | --- |
| `left_init_pose_x` | Left guard target x position |
| `left_init_pose_y` | Left guard target y position |
| `right_init_pose_x` | Right guard target x position |
| `right_init_pose_y` | Right guard target y position |
| `init_jab_y` | Upper y threshold for jab detection |
| `init_uppercut_y` | Lower y threshold for uppercut and duck detection |
| `left_init_hook_x` | Left hook x threshold |
| `right_init_hook_x` | Right hook x threshold |

Reset calibration uses these defaults based on the current canvas:

- Left guard: `3 * width / 7`, `height / 3`
- Right guard: `4 * width / 7`, `height / 3`
- Jab threshold: `height / 3 - objectPoseSize * coef / 1.4`
- Uppercut threshold: `height / 3 + objectPoseSize * coef / 1.4`
- Left hook threshold: `3 * width / 7 - objectPoseSize * coef`
- Right hook threshold: `4 * width / 7 + objectPoseSize * coef`

## Player Profiles

The selected profile key is stored as `selected_player`. The profile itself is stored as JSON under that key.

Profile fields include:

- `name`
- `caloriesBurned`
- `lastCaloriesBurned`
- `gameCounts.fight`
- `gameCounts.shadow`
- `gameCounts.trainPad`
- `scoreSummary.hits`
- `scoreSummary.misses`
- `scoreSummary.scoringMoves`
- `scoreSummary.shadowCombos`
- `scoreSummary.fightWins`
- `scoreSummary.fightLosses`
- `dailyStats.YYYY-MM-DD`

Stats are updated when a round or fight finishes. Manual stops do not count the same way as completed games.

## Face Recognition

Face recognition is optional and local-only. Setup, model files, profile behavior, and tuning options are documented in [face-recognition.md](face-recognition.md).

## Test And E2E Flags

The app includes browser-test flags for deterministic tests:

| Flag | Effect |
| --- | --- |
| `window.__TFIT_DISABLE_FACE_RECOGNITION_FOR_E2E` | Disables face recognition startup. |
| `window.__TFIT_DISABLE_POSE_DETECTION_FOR_E2E` | Disables pose detection startup. |
| `window.__TFIT_DISABLE_SW_RELOAD_FOR_E2E` | Prevents service-worker reload behavior in e2e runs. |

These flags are intended for tests, not normal gameplay.

## Static And Desktop Configuration

The browser app is served by `npm run serve`, which runs:

```bash
npm run generate-version && http-server . -p 8000 -c-1
```

The Electron app uses `main.js`:

- Fullscreen window
- Hidden menu bar
- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- Loads local `index.html`

The PWA manifest requests landscape orientation and standalone display.

## Build Configuration

Desktop builds use `electron-builder`.

Important package settings:

- `appId`: `app.box4.fit`
- `productName`: `Box4Fit`
- Linux targets: `AppImage`, `deb`
- Windows target: `nsis`
- Unpacked assets: face-recognition models and ONNX Runtime Web vendor files

The unpacked asset rule is required because ONNX model/runtime files must be readable outside Electron's packed ASAR archive.
