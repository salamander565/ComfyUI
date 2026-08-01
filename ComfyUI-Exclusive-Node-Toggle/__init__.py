"""A generic two-node exclusive toggle for ComfyUI workflows."""

WEB_DIRECTORY = "./web"


class ExclusiveNodeToggle:
    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {
            "use_node_b": ("BOOLEAN", {"default": False, "label_on": "Node B active", "label_off": "Node A active"}),
            "node_a": ([""], {"default": ""}),
            "node_b": ([""], {"default": ""}),
        }}

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("status",)
    FUNCTION = "status"
    CATEGORY = "utils"

    def status(self, use_node_b, node_a, node_b):
        return ("Exclusive Node Toggle: Node B" if use_node_b else "Exclusive Node Toggle: Node A",)


NODE_CLASS_MAPPINGS = {"ExclusiveNodeToggle": ExclusiveNodeToggle}
NODE_DISPLAY_NAME_MAPPINGS = {"ExclusiveNodeToggle": "Exclusive Node Toggle"}
__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
