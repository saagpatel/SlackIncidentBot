import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const maxRssMb = Number(process.env.MEMORY_MAX_RSS_MB || 160);
const timeArgs =
  process.platform === "darwin"
    ? ["-l", "cargo", "test", "--lib", "--no-run"]
    : ["-v", "cargo", "test", "--lib", "--no-run"];
const result = spawnSync("/usr/bin/time", timeArgs, {
  encoding: "utf8",
});

const combined = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
const macRssMatch = combined.match(/(\d+)\s+maximum resident set size/);
const linuxRssMatch = combined.match(/Maximum resident set size \(kbytes\):\s+(\d+)/);
const rssBytes = macRssMatch
  ? Number(macRssMatch[1])
  : linuxRssMatch
    ? Number(linuxRssMatch[1]) * 1024
    : null;
const rssMb = rssBytes === null ? null : Number((rssBytes / (1024 * 1024)).toFixed(2));

mkdirSync(".perf-results", { recursive: true });
writeFileSync(
  ".perf-results/memory.json",
  JSON.stringify(
    {
      rssBytes,
      rssMb,
      maxRssMb,
      status: rssMb !== null && rssMb <= maxRssMb ? "pass" : "fail",
      capturedAt: new Date().toISOString(),
      command: `/usr/bin/time ${timeArgs.join(" ")}`,
    },
    null,
    2,
  ),
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

if (rssMb === null) {
  console.error("Could not determine maximum resident set size.");
  process.exit(1);
}

if (rssMb > maxRssMb) {
  console.error(`Memory usage too high: ${rssMb}MB > ${maxRssMb}MB`);
  process.exit(1);
}
