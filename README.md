# Upscaler Stack (4 Stage)

A compact, sequential four-stage ComfyUI upscaler. Each stage has its own model selection and resize options, and provides an image output for a Preview Image node.

## Install

Copy the `ComfyUI-Upscaler-Stack` folder into ComfyUI's `custom_nodes` directory, then restart ComfyUI.

## Stage modes

- **bypass**: passes the incoming image through without loading a model.
- **model only**: uses the model at its native scale.
- **model then scale by**: model upscale, then multiply the output size by a factor.
- **model then fixed resolution**: model upscale, then resize to width/height. Set one dimension to `0` to retain the aspect ratio.
- **resize only by / fixed resolution**: resize without loading an upscaler model.

Choose **none** for the resample method when you want to skip the resize portion of a stage. When a stage is set to **bypass**, its other controls are dimmed and it passes the incoming image through without loading a model.

Every stage output is a preview point. A bypassed stage outputs the unchanged incoming image. The `image` output is the result after stage four.

## Notes

- Models are drawn from `models/upscale_models`, exactly like ComfyUI's core Load Upscale Model node.
- The model step uses the same tiled model-upscaling approach as ComfyUI's `Upscale Image (using Model)` node, including automatic tile reduction when VRAM is tight.
- Start with one enabled stage and add stages only when you need them: chained model upscales multiply dimensions quickly.
