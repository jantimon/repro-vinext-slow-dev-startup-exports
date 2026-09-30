/** A module with `count` named exports and no `*` character */
export function moduleSource(m, count) {
  let source = "";
  for (let e = 0; e < count; e++) {
    source += `export const label_${m}_${e} = "module ${m}, entry ${e}";\n`;
  }
  return source;
}
