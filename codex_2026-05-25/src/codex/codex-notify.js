const fs = require("fs");
const path = require("path");

const statePath = path.join(__dirname, "phone-confirm-state.json");

function readState() {
  try {
    return JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch {
    return {
      message: "确认通道已连接。",
      status: "idle",
      updatedAt: new Date().toISOString(),
      history: [],
      progress: [],
    };
  }
}

function writeState(state) {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), "utf8");
}

function arg(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const command = process.argv[2];
const state = readState();
const now = new Date().toISOString();

if (command === "message") {
  state.history = [
    { message: state.message, status: state.status, updatedAt: state.updatedAt },
    ...(state.history || []),
  ].slice(0, 20);
  state.message = arg("text", "需要你确认。");
  state.status = "pending";
  state.updatedAt = now;
  writeState(state);
  console.log("message updated");
  process.exit(0);
}

if (command === "progress") {
  state.progress = [
    {
      title: arg("title", "项目进展"),
      status: arg("status", "更新"),
      body: arg("body", ""),
      updatedAt: now,
    },
    ...(state.progress || []),
  ].slice(0, 30);
  state.updatedAt = now;
  writeState(state);
  console.log("progress updated");
  process.exit(0);
}

if (command === "reset") {
  writeState({
    message: arg("text", "确认通道已连接。后面我需要你确认时，会把提示发到这里。"),
    status: "idle",
    updatedAt: now,
    history: [],
    progress: [],
  });
  console.log("state reset");
  process.exit(0);
}

console.error("Usage: node codex-notify.js message|progress|reset --text ... --title ... --status ... --body ...");
process.exit(1);
