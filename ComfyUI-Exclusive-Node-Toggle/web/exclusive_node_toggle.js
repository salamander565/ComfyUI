import { app } from "../../scripts/app.js";

const ACTIVE = 0;
const DISABLED = 2;
const MARKER = "[Exclusive Node Toggle]";

function candidates(controller) {
  return (app.graph?._nodes ?? [])
    .filter((node) => node !== controller && node.type !== "ExclusiveNodeToggle")
    .map((node) => `${node.id} | ${node.title || node.type}`);
}

function selectedId(node, name) {
  const value = node.widgets?.find((widget) => widget.name === name)?.value;
  const match = String(value || "").match(/^\s*(\d+)\s*\|/);
  return match ? Number(match[1]) : null;
}

function setMode(node, mode) {
  if (!node || node.mode === mode) return;
  node.mode = mode;
  node.setDirtyCanvas?.(true, true);
}

function status(node, message) {
  node.title = `${MARKER} ${message}`;
  node.setDirtyCanvas?.(true, true);
}

function refreshToggleLabel(node) {
  const toggle = node.widgets?.find((widget) => widget.name === "use_node_b");
  if (!toggle) return;
  const a = app.graph?.getNodeById?.(selectedId(node, "node_a"));
  const b = app.graph?.getNodeById?.(selectedId(node, "node_b"));
  const active = toggle.value === true ? b : a;
  toggle.label = active ? `Active: ${active.title || active.type}` : "Choose two nodes";
}

function enforce(node) {
  const useB = node.widgets?.find((widget) => widget.name === "use_node_b")?.value === true;
  const aId = selectedId(node, "node_a");
  const bId = selectedId(node, "node_b");
  if (aId == null || bId == null) return status(node, "choose Node A and Node B");
  if (aId === bId) return status(node, "choose two different nodes");

  const a = app.graph?.getNodeById?.(aId);
  const b = app.graph?.getNodeById?.(bId);
  if (!a || !b) return status(node, "selected node not found — reselect it");

  setMode(a, useB ? DISABLED : ACTIVE);
  setMode(b, useB ? ACTIVE : DISABLED);
  app.graph?.setDirtyCanvas?.(true, true);
  const activeNode = useB ? b : a;
  status(node, `${activeNode.title || activeNode.type} active`);
  refreshToggleLabel(node);
}

app.registerExtension({
  name: "exclusive-node-toggle",
  beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData.name !== "ExclusiveNodeToggle") return;
    const created = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function () {
      created?.apply(this, arguments);
      this.title = `${MARKER} configure nodes`;
      for (const name of ["node_a", "node_b"]) {
        const widget = this.widgets?.find((item) => item.name === name);
        if (!widget) continue;
        widget.options = widget.options || {};
        widget.options.values = () => candidates(this);
        const previous = widget.callback;
        widget.callback = (...args) => { previous?.apply(widget, args); enforce(this); };
      }
      const toggle = this.widgets?.find((widget) => widget.name === "use_node_b");
      if (toggle) {
        const previous = toggle.callback;
        toggle.callback = (...args) => { previous?.apply(toggle, args); enforce(this); };
      }
    };
    const configured = nodeType.prototype.onConfigure;
    nodeType.prototype.onConfigure = function () {
      configured?.apply(this, arguments);
      queueMicrotask(() => { enforce(this); refreshToggleLabel(this); });
    };
  },
});
