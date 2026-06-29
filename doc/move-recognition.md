# Punch And Move Recognition

Box4Fit recognizes movements from ml5.js BodyPose keypoints. The game watches the player's `nose`, `left_wrist`, and `right_wrist`, scales those coordinates from the pose model's `640x480` input space into the current canvas, and compares them against calibrated target zones.

## Required Pose Points

The app needs these points before a game can start:

- `nose`
- `left_wrist`
- `right_wrist`

A point is considered usable when its confidence is greater than `0.1`.

## Guard Readiness

Most moves only count after both hands have recently returned to guard.

Each hand is in guard when its wrist is inside a square around the calibrated guard target:

- Left guard center: `left_init_pose_x`, `left_init_pose_y`
- Right guard center: `right_init_pose_x`, `right_init_pose_y`
- Guard radius: `objectPoseSize`

The app records the last time each hand was inside guard. A hand move is considered ready only when both hands were in guard within the current timing window.

## Timing Window

The base timing window comes from difficulty:

```text
50 - level * 10
```

Mode code multiplies that value by `10` when matching live gestures, so the effective window is:

| Difficulty | Stored Level | Effective Window |
| --- | --- | --- |
| Easy | `0` | 500 ms |
| Medium | `1` | 400 ms |
| Hard | `2` | 300 ms |

A punch must happen within this window after guard readiness, and it must return to guard within the same window before it scores.

## Calibration Lines

Calibration controls the thresholds used by recognition:

| Key | Used For |
| --- | --- |
| `init_jab_y` | Jabs, when the wrist moves above this y position |
| `init_uppercut_y` | Uppercuts and down dodges, when the wrist or nose moves below this y position |
| `left_init_hook_x` | Left hooks, when the left wrist moves left of this x position |
| `right_init_hook_x` | Right hooks, when the right wrist moves right of this x position |
| `left_init_pose_x` / `left_init_pose_y` | Left guard target |
| `right_init_pose_x` / `right_init_pose_y` | Right guard target |

Use the Configuration calibration screen to drag these targets and thresholds when detection feels too strict or too loose.

## Punch Recognition

Punches are recognized in three phases:

1. Both hands are recently in guard.
2. The punching wrist crosses the calibrated threshold.
3. The punching hand returns to guard before the timing window expires.

The recognized punches are:

| Move | Recognition Rule |
| --- | --- |
| Left jab | Left wrist moves above `init_jab_y`, then returns to left guard. |
| Right jab | Right wrist moves above `init_jab_y`, then returns to right guard. |
| Left hook | Left wrist moves left of `left_init_hook_x`, then returns to left guard. |
| Right hook | Right wrist moves right of `right_init_hook_x`, then returns to right guard. |
| Left uppercut | Left wrist moves below `init_uppercut_y`, then returns to left guard. |
| Right uppercut | Right wrist moves below `init_uppercut_y`, then returns to right guard. |

Returning to guard matters. A wrist crossing a threshold without coming back to guard is not enough for Shadow and Fight prompt scoring.

## Dodge Recognition

Dodges use the nose position and require both hands to be recently in guard.

| Move | Recognition Rule |
| --- | --- |
| Left dodge | Nose moves left of `left_init_pose_x - objectPoseSize / 2`. |
| Right dodge | Nose moves right of `right_init_pose_x + objectPoseSize / 2`. |
| Down dodge | Nose moves below `init_uppercut_y`. |

Left and right dodges use the same timing-window rule as other timed gestures. Down dodge is recognized when the recent down-dodge timestamp is still inside the timing window.

## Shadow Mode Matching

Shadow mode generates falling prompts. A prompt scores when:

- The prompt is currently overlapping the calibrated target area.
- The player performs the matching move within the timing window.
- Punches also return to guard in time.

Switch guard prompts use move id `10`. When a switch prompt overlaps the left guard line, Box4Fit swaps the left and right guard y values and changes stance. Switch guard is not a scoring move.

## Train Pad Matching

Train Pad does not require the same punch-threshold crossing as Shadow and Fight. It checks whether the active wrist physically reaches the current pad target while that hand was recently in guard.

Punch target rules:

- A target on the left side asks for the left hand.
- A target on the right side asks for the right hand.
- The wrist must overlap the target's y band and be within `objectPoseSize` horizontally.
- The hand must have been in guard within the timing window.

Down dodge pad targets use a two-step duck:

1. Nose moves below `init_uppercut_y`.
2. Nose moves back above `init_uppercut_y`.

The target scores after the duck-and-return sequence completes inside the timing window.

## Fight Mode Matching

Fight mode uses the same recent-gesture matching as Shadow for prompted punches and dodges.

On a successful punch prompt:

- The prompt is marked successful.
- The opponent loses stamina unless the opponent blocks.
- Calories are added for non-blocked scoring punches.
- Hit or block reaction animation plays.

On a successful dodge prompt:

- The prompt is marked successful.
- Dodge feedback is shown.
- The player's stamina is protected from that prompt.

## Scoring And Calories

When a move scores, the app marks that move as hit and records hit feedback.

Calories are added per move:

| Move Type | Calories |
| --- | --- |
| Punches, ids `1`-`6` | `0.1` |
| Dodges and switch guard, ids `7`-`10` | `0.2` |
| Rest, id `0` | `0` |

Combos can trigger random positive audio feedback after multiple successful recent moves.

## Troubleshooting

If punches are not detected:

- Make sure both wrists and your nose are visible.
- Return the punching hand to guard after each punch.
- Recalibrate guard targets so the resting glove positions match your stance.
- Move `init_jab_y`, `init_uppercut_y`, and hook thresholds closer if punches feel too hard to trigger.
- Lower the difficulty for a wider timing window.

If dodges are not detected:

- Keep both hands near guard before dodging.
- Recalibrate the guard x positions for left/right dodge thresholds.
- Recalibrate `init_uppercut_y` for down dodges.
