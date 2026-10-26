"""Headless validation for the generated reusable V1CE coin asset."""
import argparse
import bpy
import os
import sys


def main():
    raw = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--blend", required=True)
    args = parser.parse_args(raw)
    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(args.blend))
    names = {obj.name for obj in bpy.context.scene.objects}
    required = {
        "v1ce_coin_body", "v1ce_coin_rim", "v1ce_coin_front_inlay",
        "v1ce_coin_back_inlay", "approved_v1ce_wordmark_front",
        "front_milestone", "front_display_name", "back_coin_motto", "back_free_from",
    }
    missing = sorted(required - names)
    if missing:
        raise RuntimeError("Missing required coin objects: " + ", ".join(missing))
    if not os.path.exists(args.blend):
        raise RuntimeError("Blend file does not exist")
    bodies = [bpy.data.objects.get(name) for name in ("v1ce_coin_body", "v1ce_coin_rim")]
    for body in bodies:
        if body is None or len(body.data.vertices) < 128:
            raise RuntimeError("Coin geometry is not high-resolution enough")
    print("V1CE Blender validation passed: " + ", ".join(sorted(required)))


if __name__ == "__main__":
    main()
