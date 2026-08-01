import { app } from "../../scripts/app.js";

const STAGE_FIELDS = ["model", "resample", "scale_by", "width", "height"];
const WIDGET_HEIGHT = 21;

function stageIsBypassed(node, stage) {
  return node.widgets?.find((widget) => widget.name === `stage_${stage}_mode`)?.value === "bypass";
}

function updateStageState(node) {
  for (let stage = 1; stage <= 4; stage++) {
    const bypassed = stageIsBypassed(node, stage);
    for (const field of STAGE_FIELDS) {
      const widget = node.widgets?.find((item) => item.name === `stage_${stage}_${field}`);
      if (!widget) continue;
      // Newer Comfy frontends honour `disabled`; the custom overlay below makes
      // the disabled state equally clear on classic LiteGraph frontends.
      widget.disabled = bypassed;
    }
  }
  node.setDirtyCanvas?.(true, true);
}

app.registerExtension({
  name: "upscaler-stack-ui",
  beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData.name !== "UpscalerStack") return;

    const created = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function () {
      created?.apply(this, arguments);
      for (let stage = 1; stage <= 4; stage++) {
        const mode = this.widgets?.find((widget) => widget.name === `stage_${stage}_mode`);
        if (!mode) continue;
        const previous = mode.callback;
        mode.callback = (...args) => {
          previous?.apply(mode, args);
          updateStageState(this);
        };
      }

      const previousDraw = this.onDrawForeground;
      this.onDrawForeground = (ctx) => {
        previousDraw?.call(this, ctx);
        for (let stage = 1; stage <= 4; stage++) {
          if (!stageIsBypassed(this, stage)) continue;
          for (const field of STAGE_FIELDS) {
            const widget = this.widgets?.find((item) => item.name === `stage_${stage}_${field}`);
            if (!widget || widget.last_y == null) continue;
            ctx.fillStyle = "rgba(20, 20, 20, 0.63)";
            ctx.fillRect(8, widget.last_y - WIDGET_HEIGHT + 2, this.size[0] - 16, WIDGET_HEIGHT - 2);
          }
        }
      };
      queueMicrotask(() => updateStageState(this));
    };

    const configured = nodeType.prototype.onConfigure;
    nodeType.prototype.onConfigure = function () {
      configured?.apply(this, arguments);
      queueMicrotask(() => updateStageState(this));
    };
  },
});
