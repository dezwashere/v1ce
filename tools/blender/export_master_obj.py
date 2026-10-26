"""Export the reusable V1CE master to SceneKit-compatible OBJ/MTL."""
import bpy
import os

output = os.environ.get("V1CE_MASTER_OBJ_PATH")
if not output:
    raise RuntimeError("V1CE_MASTER_OBJ_PATH is required")
bpy.ops.wm.obj_export(
    filepath=output,
    export_materials=True,
    export_normals=True,
    export_uv=True,
    path_mode="RELATIVE",
    apply_modifiers=True,
)
print(f"EXPORTED_OBJ={output}")
