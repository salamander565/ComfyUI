# Custom ComfyUI Nodes (experimental)


## Installation:

Copy the folders into ComfyUI's `custom_nodes` folder. Restart ComfyUI and refresh its browser page.


# Upscaler Stack (4 Stage)

A compact, sequential four-stage ComfyUI upscaler node. Each stage has its own model selection and resize options, and provides an image output for a Preview Image node.

<img width="238" height="632" alt="Upscaler" src="https://github.com/user-attachments/assets/c3de83ac-c8c0-4b1a-b659-4d243d700dcd" />


# Exclusive Node Toggle & Exclusive Group Toggle

Select two ComfyUI nodes or groups and choose between them using one saved toggle. The active node/group is enabled; the other node/group is bypassed. An example would be a normal Save Image node and a Save Image w/ Metadata node, or a group containing a standard prompt path and another group with an LLM-enhanced prompt path.

<img width="541" height="391" alt="Screenshot 2026-08-01 at 13 44 15" src="https://github.com/user-attachments/assets/1c0e109a-a165-412d-8b55-cb88df02d942" />
