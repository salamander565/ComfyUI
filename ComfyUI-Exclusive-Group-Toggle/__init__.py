WEB_DIRECTORY = "./web"

class ExclusiveGroupToggle:
    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {
            "use_group_b": ("BOOLEAN", {"default": False, "label_on": "Group B active", "label_off": "Group A active"}),
            "group_a": ([""], {"default": ""}),
            "group_b": ([""], {"default": ""}),
        }}
    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("status",)
    FUNCTION = "status"
    CATEGORY = "utils"
    def status(self, use_group_b, group_a, group_b):
        return ("Exclusive Group Toggle",)

NODE_CLASS_MAPPINGS = {"ExclusiveGroupToggle": ExclusiveGroupToggle}
NODE_DISPLAY_NAME_MAPPINGS = {"ExclusiveGroupToggle": "Exclusive Group Toggle"}
__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
