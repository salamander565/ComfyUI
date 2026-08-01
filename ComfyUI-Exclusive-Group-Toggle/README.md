# Exclusive Group Toggle

Select two ComfyUI groups and choose between them using one saved toggle. The active group is enabled; the other group is bypassed. This is ideal for two alternative workflow paths, such as a standard prompt path and an LLM prompt-enhanced path.

## Install

Copy the `ComfyUI-Exclusive-Group-Toggle` folder into ComfyUI's `custom_nodes` folder. Restart ComfyUI and refresh its browser page.

## Use

1. Create and name the two path groups first.
2. Add **Exclusive Group Toggle** from `utils` somewhere outside those groups.
3. Choose the standard-prompt group as **group_a** and the LLM-enhanced group as **group_b**.
4. Use the **Group A active / Group B active** toggle.

The selected choice is retained in the workflow. When you reopen it, the node re-applies the same choice, so you do not have to remember which path was last intended to be active.

## Notes

- The entire inactive group is set to **Bypass** (the same behaviour as a group bypasser), and the active group is set to **Always**.
- Keep this toggle node outside both controlled groups; otherwise bypassing the inactive group could disable the controller itself.
- Do not use overlapping groups for the two selected paths. Nodes shared between the paths should remain outside both groups, as you have already arranged your models, LoRAs, and latent setup.
