
//Interpolation quadratique
function removeNoiseQuad(accelerometerData, threshold) {
  const filteredData = [];
  let previousAcceleration = null;

  for (let i = 0; i < accelerometerData.length; i++) {
    const acceleration = accelerometerData[i];
    const magnitude = Math.sqrt(
      acceleration.x * acceleration.x +
      acceleration.y * acceleration.y +
      acceleration.z * acceleration.z
    );

    if (magnitude > threshold) {
      filteredData.push(acceleration);
      previousAcceleration = acceleration;
    } else if (previousAcceleration !== null && i < accelerometerData.length - 1) {
      const nextAcceleration = accelerometerData[i + 1];
      const nextMagnitude = Math.sqrt(
        nextAcceleration.x * nextAcceleration.x +
        nextAcceleration.y * nextAcceleration.y +
        nextAcceleration.z * nextAcceleration.z
      );

      // Perform quadratic interpolation
      const t1 = (threshold - magnitude) / (previousAcceleration.magnitude - magnitude);
      const t2 = (threshold - magnitude) / (nextMagnitude - magnitude);
      const interpolatedAcceleration = {
        x: previousAcceleration.x * t1 * t2 + acceleration.x * (1 - t1) * t2 + nextAcceleration.x * (1 - t2) * t1,
        y: previousAcceleration.y * t1 * t2 + acceleration.y * (1 - t1) * t2 + nextAcceleration.y * (1 - t2) * t1,
        z: previousAcceleration.z * t1 * t2 + acceleration.z * (1 - t1) * t2 + nextAcceleration.z * (1 - t2) * t1
      };
      filteredData.push(interpolatedAcceleration);
    }
  }
  return filteredData;
}
//interpolation linéaire
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
  