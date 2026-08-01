import torch

import comfy.model_management
import comfy.model_patcher
import comfy.utils
import folder_paths
from spandrel import ImageModelDescriptor, ModelLoader


MAX_RESOLUTION = 16384
RESAMPLE_METHODS = ["none", "nearest-exact", "bilinear", "area", "bicubic", "lanczos"]
STAGE_MODES = [
    "bypass",
    "model only",
    "model then scale by",
    "model then fixed resolution",
    "resize only by",
    "resize only fixed resolution",
]


class UpscalerStack:
    """Four optional, sequential model-upscale and resize stages."""

    def __init__(self):
        self._models = {}

    @classmethod
    def INPUT_TYPES(cls):
        models = folder_paths.get_filename_list("upscale_models") or ["No upscale models found"]
        required = {"image": ("IMAGE",)}
        for number in range(1, 5):
            prefix = f"stage_{number}_"
            required.update({
                f"{prefix}mode": (STAGE_MODES, {"default": "bypass" if number > 1 else "model only"}),
                f"{prefix}model": (models,),
                f"{prefix}resample": (RESAMPLE_METHODS, {"default": "lanczos"}),
                f"{prefix}scale_by": ("FLOAT", {"default": 1.0, "min": 0.01, "max": 8.0, "step": 0.01}),
                f"{prefix}width": ("INT", {"default": 0, "min": 0, "max": MAX_RESOLUTION, "step": 1}),
                f"{prefix}height": ("INT", {"default": 0, "min": 0, "max": MAX_RESOLUTION, "step": 1}),
            })
        return {"required": required}

    RETURN_TYPES = ("IMAGE", "IMAGE", "IMAGE", "IMAGE", "IMAGE")
    RETURN_NAMES = ("stage 1 preview", "stage 2 preview", "stage 3 preview", "stage 4 preview", "image")
    FUNCTION = "upscale"
    CATEGORY = "image/upscaling"
    DESCRIPTION = "A compact four-stage image upscaler. Each stage can use a model, resize, or bypass entirely."

    def _load_model(self, model_name):
        if model_name in self._models:
            return self._models[model_name]
        model_path = folder_paths.get_full_path_or_raise("upscale_models", model_name)
        state_dict = comfy.utils.load_torch_file(model_path, safe_load=True)
        if "module.layers.0.residual_group.blocks.0.norm1.weight" in state_dict:
            state_dict = comfy.utils.state_dict_prefix_replace(state_dict, {"module.": ""})
        descriptor = ModelLoader().load_from_state_dict(state_dict).eval()
        if not isinstance(descriptor, ImageModelDescriptor):
            raise RuntimeError("The selected file is not a single-image upscale model.")
        descriptor.patcher = comfy.model_patcher.CoreModelPatcher(
            descriptor.model,
            load_device=comfy.model_management.get_torch_device(),
            offload_device=comfy.model_management.unet_offload_device(),
        )
        self._models[model_name] = descriptor
        return descriptor

    def _model_upscale(self, image, model_name):
        model = self._load_model(model_name)
        device = model.patcher.load_device
        memory_required = (512 * 512 * 3) * image.element_size() * max(model.scale, 1.0) * 384.0
        memory_required += image.nelement() * image.element_size()
        comfy.model_management.load_models_gpu([model.patcher], memory_required=memory_required)

        source = image.movedim(-1, -3).to(device)
        tile, overlap = 512, 32
        output_device = comfy.model_management.intermediate_device()
        while True:
            try:
                steps = source.shape[0] * comfy.utils.get_tiled_scale_steps(
                    source.shape[3], source.shape[2], tile_x=tile, tile_y=tile, overlap=overlap
                )
                progress = comfy.utils.ProgressBar(steps)
                result = comfy.utils.tiled_scale(
                    source, lambda batch: model(batch.float()), tile_x=tile, tile_y=tile,
                    overlap=overlap, upscale_amount=model.scale, pbar=progress, output_device=output_device,
                )
                return torch.clamp(result.movedim(-3, -1), 0, 1).to(comfy.model_management.intermediate_dtype())
            except Exception as error:
                comfy.model_management.raise_non_oom(error)
                tile //= 2
                if tile < 128:
                    raise

    @staticmethod
    def _resize(image, method, width=0, height=0, scale_by=None):
        if method == "none":
            return image
        samples = image.movedim(-1, 1)
        if scale_by is not None:
            width = max(1, round(samples.shape[3] * scale_by))
            height = max(1, round(samples.shape[2] * scale_by))
        elif width == 0 and height == 0:
            return image
        elif width == 0:
            width = max(1, round(samples.shape[3] * height / samples.shape[2]))
        elif height == 0:
            height = max(1, round(samples.shape[2] * width / samples.shape[3]))
        return comfy.utils.common_upscale(samples, width, height, method, "disabled").movedim(1, -1)

    def _run_stage(self, image, mode, model, resample, scale_by, width, height):
        if mode == "bypass":
            return image
        if mode.startswith("model"):
            image = self._model_upscale(image, model)
        if mode.endswith("scale by") or mode == "resize only by":
            return self._resize(image, resample, scale_by=scale_by)
        if mode.endswith("fixed resolution") or mode == "resize only fixed resolution":
            return self._resize(image, resample, width=width, height=height)
        return image

    def upscale(self, image, **kwargs):
        results = []
        current = image
        for number in range(1, 5):
            prefix = f"stage_{number}_"
            current = self._run_stage(
                current,
                kwargs[f"{prefix}mode"], kwargs[f"{prefix}model"], kwargs[f"{prefix}resample"],
                kwargs[f"{prefix}scale_by"], kwargs[f"{prefix}width"], kwargs[f"{prefix}height"],
            )
            results.append(current)
        return tuple(results + [current])


NODE_CLASS_MAPPINGS = {"UpscalerStack": UpscalerStack}
NODE_DISPLAY_NAME_MAPPINGS = {"UpscalerStack": "Upscaler Stack (4 Stage)"}
WEB_DIRECTORY = "./web"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
