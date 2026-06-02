const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const host = "127.0.0.1";
const port = Number(process.env.PORT || 8790);
const token = process.env.CONFIRM_TOKEN || crypto.randomBytes(12).toString("hex");
const statePath = path.join(__dirname, "phone-confirm-state.json");

function readState() {
  try {
    const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
    return {
      message: state.message || "确认通道已连接。后面我需要你确认时，会把提示发到这里。",
      status: state.status || "idle",
      updatedAt: state.updatedAt || new Date().toISOString(),
      history: Array.isArray(state.history) ? state.history : [],
      progress: Array.isArray(state.progress) ? state.progress : [],
    };
  } catch {
    return {
      message: "确认通道已连接。后面我需要你确认时，会把提示发到这里。",
      status: "idle",
      updatedAt: new Date().toISOString(),
      history: [],
      progress: [],
    };
  }
}

function writeState(state) {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function send(res, code, type, body) {
  res.writeHead(code, {
    "content-type": type,
    "cache-control": "no-store",
    "referrer-policy": "no-referrer",
    "x-robots-tag": "noindex, nofollow",
    "x-content-type-options": "nosniff",
    "access-control-allow-origin": "*",
  });
  res.end(body);
}

function html() {
  return `<!doctype html>
<html lang="zh-CN">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Codex 确认</title>
<style>
  body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; background: #f6f7f9; color: #111; }
  main { max-width: 680px; margin: 0 auto; padding: 22px; }
  .panel { background: white; border: 1px solid #d9dde3; border-radius: 8px; padding: 20px; }
  .panel + .panel { margin-top: 14px; }
  h1 { font-size: 22px; margin: 0 0 14px; }
  h2 { font-size: 18px; margin: 0 0 12px; }
  #msg { white-space: pre-wrap; font-size: 20px; line-height: 1.45; margin: 18px 0; }
  #time { color: #667085; font-size: 14px; }
  .buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 18px; }
  button { font-size: 22px; padding: 18px 10px; border-radius: 8px; border: 0; color: white; }
  #approve { background: #0f766e; }
  #deny { background: #b42318; }
  button:disabled { background: #98a2b3 !important; color: #eef2f6; }
  button:active { transform: scale(0.98); filter: brightness(0.88); }
  .buttons.done { opacity: 0.75; }
  #notify { width: 100%; margin-top: 12px; background: #344054; font-size: 17px; padding: 13px 10px; }
  #status { margin-top: 14px; color: #344054; font-size: 15px; }
  .item { border-top: 1px solid #eaecf0; padding: 12px 0; }
  .item:first-child { border-top: 0; padding-top: 0; }
  .item-title { font-weight: 700; font-size: 16px; }
  .item-meta { color: #667085; font-size: 13px; margin-top: 4px; }
  .item-body { white-space: pre-wrap; margin-top: 6px; line-height: 1.42; }
</style>
<main>
  <div class="panel">
    <h1>Codex 确认</h1>
    <div id="time"></div>
    <div id="msg">加载中...</div>
    <div class="buttons">
      <button id="approve">同意</button>
      <button id="deny">拒绝</button>
    </div>
    <button id="notify">开启提醒</button>
    <div id="status"></div>
  </div>
  <div class="panel">
    <h2>项目进展</h2>
    <div id="progress">暂无进展更新</div>
  </div>
</main>
<script>
const token = new URLSearchParams(location.search).get("token") || "";
let last = "";
let originalTitle = document.title;
let blinkTimer = null;
async function api(path, options) {
  return fetch(path + (path.includes("?") ? "&" : "?") + "token=" + token, options);
}
function alertUser(s) {
  if (navigator.vibrate) navigator.vibrate([180, 80, 180, 80, 180]);
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.06;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => { osc.stop(); ctx.close(); }, 260);
  } catch {}
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Codex 需要你确认", { body: s.message || "有新的确认消息" });
  }
  clearInterval(blinkTimer);
  let on = false;
  blinkTimer = setInterval(() => {
    document.title = on ? originalTitle : "需要确认 - Codex";
    on = !on;
  }, 900);
}
function renderProgress(items) {
  const root = document.getElementById("progress");
  if (!items || !items.length) {
    root.textContent = "暂无进展更新";
    return;
  }
  root.innerHTML = items.map(item => {
    const title = (item.title || "进展").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const body = (item.body || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    const when = new Date(item.updatedAt || Date.now()).toLocaleString();
    const status = item.status ? " · " + item.status : "";
    return '<div class="item"><div class="item-title">' + title + '</div><div class="item-meta">' + when + status + '</div><div class="item-body">' + body + '</div></div>';
  }).join("");
}
function renderButtons(status) {
  const buttons = document.querySelector(".buttons");
  const approve = document.getElementById("approve");
  const deny = document.getElementById("deny");
  const done = status === "approved" || status === "denied";
  approve.disabled = done;
  deny.disabled = done;
  buttons.classList.toggle("done", done);
  approve.textContent = status === "approved" ? "已同意" : "同意";
  deny.textContent = status === "denied" ? "已拒绝" : "拒绝";
}
async function refresh() {
  const r = await api("/state");
  const s = await r.json();
  document.getElementById("msg").textContent = s.message || "";
  document.getElementById("time").textContent = "更新时间：" + new Date(s.updatedAt).toLocaleString();
  document.getElementById("status").textContent = s.status === "approved" ? "你已同意" : s.status === "denied" ? "你已拒绝" : "等待需要确认的消息";
  renderProgress(s.progress || []);
  renderButtons(s.status);
  if (s.updatedAt !== last && last) {
    alertUser(s);
  }
  last = s.updatedAt;
}
document.getElementById("approve").onclick = async () => {
  if (navigator.vibrate) navigator.vibrate(70);
  renderButtons("approved");
  document.getElementById("status").textContent = "你已同意";
  await api("/approve", { method: "POST" });
  refresh();
};
document.getElementById("deny").onclick = async () => {
  if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
  renderButtons("denied");
  document.getElementById("status").textContent = "你已拒绝";
  await api("/deny", { method: "POST" });
  refresh();
};
document.getElementById("notify").onclick = async () => {
  if ("Notification" in window) {
    const permission = await Notification.requestPermission();
    document.getElementById("status").textContent = permission === "granted" ? "提醒已开启；页面打开时会弹通知" : "浏览器没有允许通知；仍会尝试震动和响铃";
  } else {
    document.getElementById("status").textContent = "当前浏览器不支持网页通知；仍会尝试震动和响铃";
  }
};
refresh();
setInterval(refresh, 2000);
</script>
</html>`;
}

function authorized(reqUrl) {
  return reqUrl.searchParams.get("token") === token;
}

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  if (!authorized(reqUrl)) {
    send(res, 403, "text/plain; charset=utf-8", "Forbidden");
    return;
  }

  if (reqUrl.pathname === "/") {
    send(res, 200, "text/html; charset=utf-8", html());
    return;
  }

  const state = readState();
  if (reqUrl.pathname === "/state") {
    send(res, 200, "application/json; charset=utf-8", JSON.stringify(state));
    return;
  }

  if (reqUrl.pathname === "/message" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const next = JSON.parse(body || "{}");
      const newState = {
        message: String(next.message || ""),
        status: "pending",
        updatedAt: new Date().toISOString(),
        history: [{ message: state.message, status: state.status, updatedAt: state.updatedAt }, ...(state.history || [])].slice(0, 20),
        progress: state.progress || [],
      };
      writeState(newState);
      send(res, 200, "application/json; charset=utf-8", JSON.stringify(newState));
    });
    return;
  }

  if (reqUrl.pathname === "/progress" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const next = JSON.parse(body || "{}");
      const item = {
        title: String(next.title || "项目进展"),
        body: String(next.body || ""),
        status: String(next.status || "更新"),
        updatedAt: new Date().toISOString(),
      };
      state.progress = [item, ...(state.progress || [])].slice(0, 30);
      state.updatedAt = item.updatedAt;
      writeState(state);
      send(res, 200, "application/json; charset=utf-8", JSON.stringify(state));
    });
    return;
  }

  if (reqUrl.pathname === "/approve" && req.method === "POST") {
    state.status = "approved";
    state.updatedAt = new Date().toISOString();
    writeState(state);
    send(res, 200, "application/json; charset=utf-8", JSON.stringify(state));
    return;
  }

  if (reqUrl.pathname === "/deny" && req.method === "POST") {
    state.status = "denied";
    state.updatedAt = new Date().toISOString();
    writeState(state);
    send(res, 200, "application/json; charset=utf-8", JSON.stringify(state));
    return;
  }

  send(res, 404, "text/plain; charset=utf-8", "Not found");
});

writeState(readState());
server.listen(port, host, () => {
  console.log(`Codex phone confirmation server: http://127.0.0.1:${port}/?token=${token}`);
  console.log(`Token: ${token}`);
});
