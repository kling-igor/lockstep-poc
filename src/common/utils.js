export function clap(value, min, max) {
  return value < min ? min : value > max ? max : value
}

export function pointInRect(point, rectangle) {
  return (
    point.x >= rectangle.x &&
    point.x <= rectangle.x + rectangle.w &&
    point.y >= rectangle.y &&
    point.y <= rectangle.y + rectangle.h
  )
}

export function rectInRect(inner, outer) {
  return (
    inner.x >= outer.x &&
    inner.w + inner.x <= outer.x + outer.w &&
    inner.y >= outer.y &&
    inner.h + inner.y <= outer.y + outer.h
  )
}

function partialRectInRect(inner, outer) {}

// Wrap value of direction so that it lies between 0 and directions-1
export function wrapDirection(direction, directions) {
  if (direction < 0) {
    direction += directions
  }
  if (direction >= directions) {
    direction -= directions
  }
  return direction
}

// Finds the angle between two objects in terms of a direction (where 0 <= angle < directions)
export function findAngle(objectPosition, targetPosition, directions) {
  let dy = objectPosition.y - targetPosition.y,
    dx = objectPosition.x - targetPosition.x
  //Convert Arctan to value between (0 - directions)
  // 0 - N
  // 1 - NE
  // and so on clockwise
  return wrapDirection(directions - (Math.atan2(dx, dy) / (2 * Math.PI)) * directions, directions)
}

// returns the smallest difference (value ranging between -directions/2 to +directions/2)
// between two angles (where 0 <= angle < directions)
export function angleDiff(angle1, angle2, directions) {
  if (angle1 >= directions / 2) {
    angle1 = angle1 - directions
  }
  if (angle2 >= directions / 2) {
    angle2 = angle2 - directions
  }
  let diff = angle2 - angle1
  if (diff < -directions / 2) {
    diff += directions
  }
  if (diff > directions / 2) {
    diff -= directions
  }
  return diff
}

export const CELL_SIZE = 32
