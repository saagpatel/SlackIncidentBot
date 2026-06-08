import { readFileSync } from "node:fs";

const [baselinePath, currentPath, metric, maxRatio, maxAbsoluteDelta] = process.argv.slice(2);
if (!baselinePath || !currentPath || !metric || !maxRatio) {
  console.error(
    "usage: node compare-metric.mjs <baseline.json> <current.json> <metric> <max_ratio> [max_absolute_delta]",
  );
  process.exit(2);
}

const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
const current = JSON.parse(readFileSync(currentPath, "utf8"));
const b = baseline[metric];
const c = current[metric];

if (typeof b !== "number" || typeof c !== "number") {
  console.error(`Metric ${metric} missing or not numeric.`);
  process.exit(2);
}

if (b === 0) {
  if (c === 0) {
    console.log(JSON.stringify({ metric, baseline: b, current: c, ratio: 0 }, null, 2));
    process.exit(0);
  }
  console.error(`Baseline for ${metric} is 0; capture a real baseline before enforcing regressions.`);
  process.exit(1);
}

const ratio = (c - b) / b;
const absoluteDelta = c - b;
const allowedAbsoluteDelta =
  maxAbsoluteDelta === undefined ? null : Number(maxAbsoluteDelta);

console.log(
  JSON.stringify(
    { metric, baseline: b, current: c, ratio, absoluteDelta, allowedAbsoluteDelta },
    null,
    2,
  ),
);

if (
  ratio > Number(maxRatio) &&
  (allowedAbsoluteDelta === null || absoluteDelta > allowedAbsoluteDelta)
) {
  console.error(
    `Regression on ${metric}: ${(ratio * 100).toFixed(2)}% > ${(Number(maxRatio) * 100).toFixed(2)}%`,
  );
  process.exit(1);
}
