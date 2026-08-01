import { app } from "../../scripts/app.js";

const ACTIVE = 0;
const BYPASS = 4;
const MARKER = "[Exclusive Group Toggle]";
const groups = () => app.graph?._groups ?? [];
const choices = () => groups().map((group, index) => `${index} | ${group.title || "Untitled group"}`);
function groupIndex(node, name) {
  const value = node.widgets?.find((widget) => widget.name === name)?.value;
  const match = String(value || "").match(/^\s*(\d+)\s*\|/);
  return match ? Number(match[1]) : null;
}
function setStatus(node, message) { node.title = `${MARKER} ${message}`; node.setDirtyCanvas?.(true, true); }
function refreshToggleLabel(node) {
  const toggle = node.widgets?.find((widget) => widget.name === "use_group_b");
  if (!toggle) return;
  const a = groups()[groupIndex(node, "group_a")];
  const b = groups()[groupIndex(node, "group_b")];
  const active = toggle.value === true ? b : a;
  toggle.label = active ? `Active: ${active.title || "Untitled group"}` : "Choose two groups";
}
function setGroupMode(group, mode) {
  group?.recomputeInsideNodes?.();
  for (const node of group?._nodes ?? []) {
    node.mode = mode;
    node.setDirtyCanvas?.(true, true);
  }
}
function enforce(node) {
  const useB = node.widgets?.find((widget) => widget.name === "use_group_b")?.value === true;
  const a = groups()[groupIndex(node, "group_a")];
  const b = groups()[groupIndex(node, "group_b")];
  if (!a || !b || a === b) { refreshToggleLabel(node); return setStatus(node, "choose two different groups"); }
  setGroupMode(a, useB ? BYPASS : ACTIVE);
  setGroupMode(b, useB ? ACTIVE : BYPASS);
  app.graph?.setDirtyCanvas?.(true, true);
  const active = useB ? b : a;
  setStatus(node, `${active.title || "Untitled group"} active`);
  refreshToggleLabel(node);
}
app.registerExtension({
  name: "exclusive-group-toggle",
  beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData.name !== "ExclusiveGroupToggle") return;
    const created = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function () {
      created?.apply(this, arguments);
      this.title = `${MARKER} configure groups`;
      for (const name of ["group_a", "group_b"]) {
        const widget = this.widgets?.find((item) => item.name === name);
        if (!widget) continue;
        widget.options = widget.options || {};
        widget.options.values = choices;
        const previous = widget.callback;
        widget.callback = (...args) => { previous?.apply(widget, args); enforce(this); };
      }
      const toggle = this.widgets?.find((widget) => widget.name === "use_group_b");
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
