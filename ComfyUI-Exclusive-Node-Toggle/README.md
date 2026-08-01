# Exclusive Node Toggle

Choose any two ComfyUI nodes and keep exactly one active with a single toggle. It does not use groups.

## Install and use

Copy this folder into ComfyUI's `custom_nodes` folder, restart ComfyUI, and refresh its browser page. Add **Exclusive Node Toggle** from `utils`, choose the two nodes, then use its toggle.

The selected node is set to **Always** and the other to **Never**. The canvas title shows the actual active node name.

This disables the selected node itself; it does not automatically rewire the graph. For a node in the middle of a linear chain, use a switch/bypass-capable node or control the branch's final output node instead.
