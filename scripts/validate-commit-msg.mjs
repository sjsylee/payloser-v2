#!/usr/bin/env node

import { readFileSync } from "node:fs";

const messagePath = process.argv[2];

if (!messagePath) {
  console.error("Missing commit message file path.");
  process.exit(1);
}

const rawMessage = readFileSync(messagePath, "utf8");
const header = rawMessage
  .split(/\r?\n/)
  .map((line) => line.trim())
  .find((line) => line && !line.startsWith("#"));

const conventionalCommitPattern =
  /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9._/-]+\))?!?: [^\s].{0,99}$/;
const bypassPattern = /^(Merge|Revert|fixup!|squash!)/;

if (!header || (!conventionalCommitPattern.test(header) && !bypassPattern.test(header))) {
  console.error("\nInvalid commit message.");
  console.error("Use Conventional Commits:");
  console.error("  <type>[optional scope][optional !]: <description>");
  console.error("\nExamples:");
  console.error("  feat: add settlement history");
  console.error("  fix(api): validate join request owner");
  console.error("\nAllowed types:");
  console.error("  feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert\n");
  process.exit(1);
}
