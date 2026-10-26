"""Render review views from the generated V1CE Blender scene."""
import argparse
import math
import os
import sys
import bpy
from mathutils import Vector


def parse_args():
    raw = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--blend", required=True)
    parser.add_argument("--out-dir", required=True)
    return parser.parse_args(raw)


def look_at(obj, target=(0, 0, 0)):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def setup_scene():
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 1024
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = True
    scene.render.image_settings.color_mode = "RGBA"
    scene.world.color = (0.035, 0.035, 0.05)
    camera_data = bpy.data.cameras.new("review_camera")
    camera = bpy.data.objects.new("review_camera", camera_data)
    camera.location = (0, 0, 3.8)
    look_at(camera)
    scene.collection.objects.link(camera)
    scene.camera = camera
    for name, location, energy, size in [
        ("key", (3, -4, 5), 900, 4),
        ("fill", (-4, -2, 2), 500, 3),
        ("rim", (0, 3, 4), 700, 3),
    ]:
        data = bpy.data.lights.new(name, "AREA")
        data.energy = energy
        data.shape = "DISK"
        data.size = size
        light = bpy.data.objects.new(name, data)
        light.location = location
        look_at(light)
        scene.collection.objects.link(light)
    return camera


def render(scene, camera, out_dir, name, location, target=(0, 0, 0), size=1024):
    camera.location = location
    look_at(camera, target)
    scene.render.resolution_x = size
    scene.render.resolution_y = size
    scene.render.filepath = os.path.join(out_dir, name + ".png")
    bpy.ops.render.render(write_still=True)


def main():
    args = parse_args()
    os.makedirs(args.out_dir, exist_ok=True)
    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(args.blend))
    camera = setup_scene()
    scene = bpy.context.scene
    coin = scene.objects.get("v1ce_coin_asset")
    if not coin:
        raise RuntimeError("Generated scene is missing v1ce_coin_asset")
    # Orbit the camera around the fixed assembly. Keeping the asset transform
    # unchanged prevents face parts from separating during review renders.
    coin.rotation_euler = (0, 0, 0)
    render(scene, camera, args.out_dir, "front_normal", (0, 0, 3.8), (0, 0, 0), 1024)
    render(scene, camera, args.out_dir, "front_small_widget", (0, 0, 3.8), (0, 0, 0), 474)
    for light in [o for o in scene.objects if o.type == "LIGHT"]:
        light.location.z = -abs(light.location.z)
        look_at(light)
    render(scene, camera, args.out_dir, "back_normal", (0, 0, -3.8), (0, 0, 0), 1024)
    render(scene, camera, args.out_dir, "back_small_widget", (0, 0, -3.8), (0, 0, 0), 474)
    for light in [o for o in scene.objects if o.type == "LIGHT"]:
        light.location.z = abs(light.location.z)
        look_at(light)
    render(scene, camera, args.out_dir, "angled", (0, -4.0, 2.5), (0, 0, 0), 1024)
    render(scene, camera, args.out_dir, "edge", (0, -4.0, 1.2), (0, 0, 0), 1024)
    print("Rendered front, back, angled, and edge previews to " + os.path.abspath(args.out_dir))


if __name__ == "__main__":
    main()
