const display = document.getElementById("display");
const form = document.getElementById("calc-form");
const statusBox = document.getElementById("status");
const keys = document.querySelector(".keys");
const historyList = document.getElementById("historyList");
const emptyMsg = document.getElementById("emptyMsg");
const filterSelect = document.getElementById("filter");
const clearHistoryBtn = document.getElementById("clearHistory");
const STORAGE_KEY = "digital_calculator_history";
function loadHistory() {
try {
const raw = localStorage.getItem(STORAGE_KEY);
if (!raw) { return []; }
const parsed = JSON.parse(raw);
if (Array.isArray(parsed)) { return parsed; }
return [];
} catch (e) {
return [];
}
}
function saveHistory(items) {
localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
function showError(msg) {
statusBox.textContent = msg;
statusBox.className = "error";
}
function showSuccess(msg) {
statusBox.textContent = msg;
statusBox.className = "success";
}
function clearStatus() {
statusBox.textContent = "";
statusBox.className = "";
}
function isOperator(ch) {
return ch === "+" || ch === "-" || ch === "*" || ch === "/" || ch === "%";
}
function precedence(op) {
if (op === "+" || op === "-") { return 1; }
if (op === "*" || op === "/" || op === "%") { return 2; }
return 0;
}
function isDigit(ch) {
return ch >= "0" && ch <= "9";
}
function tokenize(expr) {
const tokens = [];
let num = "";
for (let i = 0; i < expr.length; i++) {
const ch = expr[i];
if (ch === " ") { continue; }
if (isDigit(ch) || ch === ".") {
num += ch;
} else if (isOperator(ch)) {
if (num !== "") { tokens.push(num); num = ""; }
tokens.push(ch);
} else {
throw new Error("Invalid character");
}
}
if (num !== "") { tokens.push(num); }
return tokens;
}
function toRPN(tokens) {
const out = [];
const stack = [];
for (let i = 0; i < tokens.length; i++) {
const t = tokens[i];
if (!isNaN(Number(t))) {
out.push(t);
} else if (isOperator(t)) {
while (stack.length > 0 && isOperator(stack[stack.length - 1]) && precedence(stack[stack.length - 1]) >= precedence(t)) {
out.push(stack.pop());
}
stack.push(t);
}
}
while (stack.length > 0) {
out.push(stack.pop());
}
return out;
}
function evalRPN(rpn) {
const stack = [];
for (let i = 0; i < rpn.length; i++) {
const t = rpn[i];
if (!isNaN(Number(t))) {
stack.push(Number(t));
} else if (isOperator(t)) {
if (stack.length < 2) { throw new Error("Invalid expression"); }
const b = stack.pop();
const a = stack.pop();
let r = 0;
if (t === "+") { r = a + b; }
if (t === "-") { r = a - b; }
if (t === "*") { r = a * b; }
if (t === "/") {
if (b === 0) { throw new Error("Cannot divide by zero"); }
r = a / b;
}
if (t === "%") {
if (b === 0) { throw new Error("Cannot divide by zero"); }
r = a % b;
}
stack.push(r);
}
}
if (stack.length !== 1) { throw new Error("Invalid expression"); }
return stack[0];
}
function evaluateExpression(expr) {
const clean = expr.trim();
if (clean === "") { throw new Error("Enter an expression first"); }
const tokens = tokenize(clean);
if (tokens.length === 0) { throw new Error("Enter an expression first"); }
const rpn = toRPN(tokens);
const value = evalRPN(rpn);
if (typeof value !== "number" || !isFinite(value)) { throw new Error("Invalid result"); }
return Math.round(value * 100000000) / 100000000;
}
function getFilter() {
return filterSelect.value;
}
function renderHistory() {
const items = loadHistory();
const f = getFilter();
let visible = items;
if (f !== "all") {
visible = items.filter(function (e) { return e.expr.includes(f); });
}
historyList.innerHTML = "";
if (visible.length === 0) {
emptyMsg.style.display = "block";
if (items.length === 0) { emptyMsg.textContent = "No calculations yet."; }
else { emptyMsg.textContent = "No matches for filter."; }
} else {
emptyMsg.style.display = "none";
}
for (let i = 0; i < visible.length; i++) {
const e = visible[i];
const li = document.createElement("li");
const span = document.createElement("span");
span.textContent = e.expr + " = " + e.result;
const box = document.createElement("div");
const useBtn = document.createElement("button");
useBtn.type = "button";
useBtn.textContent = "Use";
useBtn.className = "use-btn";
useBtn.setAttribute("data-use", String(e.id));
const delBtn = document.createElement("button");
delBtn.type = "button";
delBtn.textContent = "X";
delBtn.className = "del-btn";
delBtn.setAttribute("data-del", String(e.id));
box.appendChild(useBtn);
box.appendChild(delBtn);
li.appendChild(span);
li.appendChild(box);
historyList.appendChild(li);
}
}
function addEntry(expr, result) {
const items = loadHistory();
const entry = { id: Date.now(), expr: expr, result: String(result) };
items.unshift(entry);
saveHistory(items);
renderHistory();
}
function removeEntry(id) {
const items = loadHistory();
const next = items.filter(function (e) { return e.id !== id; });
saveHistory(next);
renderHistory();
}
function clearAllHistory() {
saveHistory([]);
renderHistory();
showSuccess("History cleared");
}
function appendChar(ch) {
clearStatus();
if (display.value === "0" && isDigit(ch)) {
display.value = ch;
} else {
display.value += ch;
}
display.focus();
}
function clearInput() {
display.value = "";
clearStatus();
display.focus();
}
function deleteLast() {
display.value = display.value.slice(0, -1);
clearStatus();
}
function runEquals() {
try {
const expr = display.value;
const result = evaluateExpression(expr);
display.value = String(result);
showSuccess("Result: " + result);
addEntry(expr, result);
} catch (e) {
showError(e.message);
}
}
keys.addEventListener("click", function (ev) {
const btn = ev.target.closest("button");
if (!btn) { return; }
if (btn.dataset.action === "clear") { clearInput(); return; }
if (btn.dataset.action === "delete") { deleteLast(); return; }
if (btn.dataset.action === "equals") { return; }
if (btn.dataset.value) { appendChar(btn.dataset.value); }
});
form.addEventListener("submit", function (ev) {
ev.preventDefault();
runEquals();
});
document.addEventListener("keydown", function (ev) {
if (document.activeElement === display) {
if (ev.key === "Enter") {
ev.preventDefault();
runEquals();
} else if (ev.key === "Escape") {
clearInput();
}
return;
}
if (ev.key >= "0" && ev.key <= "9") { appendChar(ev.key); }
else if (ev.key === "+" || ev.key === "-" || ev.key === "*" || ev.key === "/" || ev.key === "%") { appendChar(ev.key); }
else if (ev.key === ".") { appendChar(ev.key); }
else if (ev.key === "Enter" || ev.key === "=") { runEquals(); }
else if (ev.key === "Backspace") { deleteLast(); }
else if (ev.key === "Escape") { clearInput(); }
});
filterSelect.addEventListener("change", renderHistory);
clearHistoryBtn.addEventListener("click", clearAllHistory);
historyList.addEventListener("click", function (ev) {
const useBtn = ev.target.closest("[data-use]");
const delBtn = ev.target.closest("[data-del]");
if (useBtn) {
const id = Number(useBtn.getAttribute("data-use"));
const items = loadHistory();
for (let i = 0; i < items.length; i++) {
if (items[i].id === id) {
display.value = items[i].result;
clearStatus();
display.focus();
break;
}
}
}
if (delBtn) {
const id = Number(delBtn.getAttribute("data-del"));
removeEntry(id);
}
});
renderHistory();
