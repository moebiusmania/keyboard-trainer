// Renders the PNG app icons (PWA manifest, iOS home screen) from the SVG sources.
// Run with `deno task icons` after changing an SVG in src/icons/.
import { Resvg } from "npm:@resvg/resvg-wasm@2.6.2";
import { initWasm } from "npm:@resvg/resvg-wasm@2.6.2";

await initWasm(fetch("https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm"));

const icons: [source: string, size: number, output: string][] = [
  ["icon.svg", 192, "icon-192.png"],
  ["icon.svg", 512, "icon-512.png"],
  ["icon-maskable.svg", 192, "icon-maskable-192.png"],
  ["icon-maskable.svg", 512, "icon-maskable-512.png"],
  ["apple-touch-icon.svg", 180, "apple-touch-icon.png"],
];

const dir = new URL("../src/icons/", import.meta.url);

for (const [source, size, output] of icons) {
  const svg = await Deno.readTextFile(new URL(source, dir));
  const png = new Resvg(svg, { fitTo: { mode: "width", value: size } }).render().asPng();
  await Deno.writeFile(new URL(output, dir), png);
  console.log(`${output} (${size}×${size})`);
}
