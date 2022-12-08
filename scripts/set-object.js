/* eslint-disable */

/**
 * Sets an object based on a path and a value.
 */
export function setObject(obj, path, value) {
  if (Object(obj) !== obj) return obj;
  
  if (!Array.isArray(path)) path = path.toString().match(/[^.[\]]+/g) || []; 
  path.slice(0,-1).reduce((a, c, i) =>
    Object(a[c]) === a[c]
      ? a[c] 
      : a[c] = Math.abs(path[i+1])>>0 === +path[i+1] 
        ? []
        : {},
    obj)[path[path.length-1]] = value;
  return obj;
}