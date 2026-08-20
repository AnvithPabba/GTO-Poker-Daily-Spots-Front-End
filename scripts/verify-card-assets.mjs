import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const cardDirectory = join(process.cwd(), "public", "cards");
const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
const suits = ["c", "d", "h", "s"];
const expectedFiles = [
  ...ranks.flatMap((rank) => suits.map((suit) => `${rank}${suit}.png`)),
  "back-blue.png",
  "back-red.png",
  "LICENSE-OPENDECKS.txt",
];

const missing = expectedFiles.filter((file) => !existsSync(join(cardDirectory, file)));
if (missing.length > 0) {
  console.error(`missing card assets: ${missing.join(", ")}`);
  process.exitCode = 1;
} else {
  const license = readFileSync(join(cardDirectory, "LICENSE-OPENDECKS.txt"), "utf8");
  if (!license.includes("CC0 1.0 Universal")) {
    console.error("card asset license is not the expected CC0 notice");
    process.exitCode = 1;
  } else {
    console.log(`card assets ok: ${ranks.length * suits.length} faces, 2 backs, CC0 license`);
  }
}
