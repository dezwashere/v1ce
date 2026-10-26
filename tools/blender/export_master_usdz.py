"""Export the reusable V1CE master to Apple's package-friendly USDZ extension.

Blender's USD exporter writes the USD scene payload. The .usdz extension keeps
the runtime handoff explicit; Xcode/Model I/O validation remains required.
"""
import bpy
import os

output = os.environ.get("V1CE_MASTER_USD_PATH")
if not output:
    raise RuntimeError("V1CE_MASTER_USD_PATH is required")

bpy.ops.wm.usd_export(
    filepath=output,
    selected_objects_only=False,
    export_materials=True,
    export_textures_mode="NEW",
    export_cameras=False,
    export_lights=False,
)
print(f"EXPORTED_USD={output}")
