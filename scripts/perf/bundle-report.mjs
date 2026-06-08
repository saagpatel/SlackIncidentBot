import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

function resolveTargetDir() {
  const cargoConfigPath = ".cargo/config.toml";
  if (!existsSync(cargoConfigPath)) return "target";
  const config = readFileSync(cargoConfigPath, "utf8");
  const match = config.match(/target-dir\s*=\s*"([^"]+)"/);
  return match?.[1] ?? "target";
}

function resolveReleaseBinaryName() {
  const cargoTomlPath = "Cargo.toml";
  if (!existsSync(cargoTomlPath)) return "incident-bot";
  const cargoToml = readFileSync(cargoTomlPath, "utf8");
  const match = cargoToml.match(/release-binary\s*=\s*"([^"]+)"/);
  return match?.[1] ?? "incident-bot";
}

const run = async () => {
  const targetDir = resolveTargetDir();
  const binaryName = resolveReleaseBinaryName();
  const binaryPath = path.join(targetDir, "release", binaryName);
  const report = { source: "cargo-release", totalBytes: 0, assets: {}, binaryPath };

  if (existsSync(binaryPath)) {
    const size = statSync(binaryPath).size;
    report.assets[binaryName] = size;
    report.totalBytes = size;
  }

  mkdirSync(".perf-results", { recursive: true });
  writeFileSync(
    ".perf-results/bundle.json",
    JSON.stringify({ ...report, capturedAt: new Date().toISOString() }, null, 2),
  );
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
