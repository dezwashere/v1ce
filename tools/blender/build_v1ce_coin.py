"""Build a reusable V1CE coin scene from a profile snapshot.

Run inside Blender 3.x with:
  blender --background --python tools/blender/build_v1ce_coin.py -- \
    --profile tools/blender/example-profile.json \
    --logo assets/images/v1ce-wordmark-approved.png \
    --output tools/blender/build/v1ce_coin.blend

This is an asset-builder, not a widget renderer. The app remains responsible
for supplying the saved profile and selecting the face to render.
"""

import argparse
import json
import math
import os
import sys

import bpy
from mathutils import Vector


def args_after_double_dash():
    raw = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--profile", required=True)
    parser.add_argument("--logo", required=True)
    parser.add_argument("--font", required=True)
    parser.add_argument("--output", required=True)
    return parser.parse_args(raw)


def material(name, color, metallic=0.0, roughness=0.34):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    principled = mat.node_tree.nodes.get("Principled BSDF")
    principled.inputs["Base Color"].default_value = (*color, 1.0)
    principled.inputs["Metallic"].default_value = metallic
    principled.inputs["Roughness"].default_value = roughness
    return mat


def parse_hex(value, fallback=(0.96, 0.84, 0.50)):
    named = {"gold": "#F5D680", "silver": "#E0E0E0", "bronze": "#CD7F32", "midnight": "#0A0A0A"}
    raw = named.get(value, value or "")
    raw = raw.removeprefix("#")
    if len(raw) != 6:
        return fallback
    try:
        return tuple(int(raw[i:i + 2], 16) / 255 for i in (0, 2, 4))
    except ValueError:
        return fallback


def add_cylinder(name, radius, depth, z, mat, vertices=128):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=(0, 0, z))
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bevel = obj.modifiers.new("soft_edge", "BEVEL")
    bevel.width = min(0.035, depth * 0.35, radius * 0.06)
    bevel.segments = 4
    bevel.limit_method = "ANGLE"
    bevel.angle_limit = math.radians(30)
    bevel.harden_normals = True
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    return obj


def add_text(name, text, location, size, mat, font, align="CENTER", tracking=1.04):
    bpy.ops.object.text_add(location=location, rotation=(0, 0, 0))
    obj = bpy.context.object
    obj.name = name
    obj.data.body = text[:90]
    obj.data.align_x = align
    obj.data.align_y = "CENTER"
    obj.data.size = size
    obj.data.font = font
    obj.data.space_character = tracking
    obj.data.extrude = 0.018
    obj.data.bevel_depth = 0.006
    obj.data.bevel_resolution = 2
    obj.data.materials.append(mat)
    return obj


def add_logo_texture(path, location=(0, 0.0, 0.0), width=0.52):
    # The approved PNG is retained as the source-of-truth artwork. This plane
    # is intentionally isolated so a later alpha-to-mesh relief step can
    # replace it without changing the scene contract.
    if not os.path.exists(path):
        raise FileNotFoundError(path)
    image = bpy.data.images.load(path, check_existing=True)
    mat = bpy.data.materials.new("approved_v1ce_wordmark")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = image
    bsdf.inputs["Roughness"].default_value = 0.3
    links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
    mat.surface_render_method = "DITHERED"
    height = width * (187.0 / 279.0)
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=location)
    obj = bpy.context.object
    obj.name = "approved_v1ce_wordmark_front"
    obj.dimensions = (width, height, 0.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    solidify = obj.modifiers.new("wordmark_relief_depth", "SOLIDIFY")
    solidify.thickness = 0.018
    bevel = obj.modifiers.new("wordmark_relief_edge", "BEVEL")
    bevel.width = 0.006
    bevel.segments = 3
    obj.data.materials.append(mat)
    return obj


def build(profile, logo_path, font_path):
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    coin_root = bpy.data.objects.new("v1ce_coin_asset", None)
    bpy.context.scene.collection.objects.link(coin_root)
    coin = parse_hex(profile.get("coin_color"), (0.96, 0.84, 0.50))
    coin_mat = material("coin_face", coin, metallic=0.72)
    rim_mat = material("coin_rim", parse_hex(profile.get("coin_border_color"), coin), metallic=0.85)
    relief_mat = material("lettering_relief", parse_hex(profile.get("coin_number_color"), (1.0, 1.0, 1.0)), metallic=0.45)
    if not os.path.exists(font_path):
        raise FileNotFoundError(font_path)
    walter_turncoat = bpy.data.fonts.load(os.path.abspath(font_path), check_existing=True)
    parts = [
        add_cylinder("v1ce_coin_body", 1.0, 0.18, 0.0, coin_mat),
        add_cylinder("v1ce_coin_rim", 0.94, 0.205, 0.018, rim_mat),
        add_cylinder("v1ce_coin_back_rim", 0.94, 0.205, -0.018, rim_mat),
        add_cylinder("v1ce_coin_front_inlay", 0.87, 0.212, 0.026, coin_mat),
        add_cylinder("v1ce_coin_back_inlay", 0.87, 0.212, -0.026, coin_mat),
    ]
    parts.append(add_logo_texture(logo_path, location=(0, 0.42, 0.145), width=0.52))
    milestone = profile.get("milestone", "")
    name = profile.get("display_name", "")
    motto = profile.get("coin_motto", "")
    selected_items = [str(item).strip().upper() for item in profile.get("substances", []) if str(item).strip()][:3]
    # Review layout: approximately +20% milestone and +15% name, with more
    # vertical breathing room below the approved wordmark.
    parts.append(add_text("front_milestone", milestone, (0, -0.01, 0.145), 0.288, relief_mat, walter_turncoat))
    parts.append(add_text("front_display_name", name.upper(), (0, -0.39, 0.145), 0.207, relief_mat, walter_turncoat))
    back_text = add_text("back_coin_motto", motto, (0, 0.17, -0.145), 0.18, relief_mat, walter_turncoat)
    back_text.rotation_euler[1] = math.pi
    parts.append(back_text)
    free_from = add_text("back_free_from", "FREE FROM", (0, -0.08, -0.145), 0.105, relief_mat, walter_turncoat)
    free_from.rotation_euler[1] = math.pi
    parts.append(free_from)
    for index, item in enumerate(selected_items):
        item_text = add_text("back_selection_" + str(index), item, (0, -0.25 - (index * 0.115), -0.145), 0.095, relief_mat, walter_turncoat)
        item_text.rotation_euler[1] = math.pi
        parts.append(item_text)
    for part in parts:
        part.parent = coin_root
    for obj in bpy.context.scene.objects:
        obj.select_set(False)
    return bpy.context.scene


def main():
    options = args_after_double_dash()
    with open(options.profile, "r", encoding="utf-8") as handle:
        profile = json.load(handle)
    build(profile, options.logo, options.font)
    os.makedirs(os.path.dirname(os.path.abspath(options.output)), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(options.output))
    glb_path = os.path.splitext(os.path.abspath(options.output))[0] + ".glb"
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=glb_path, export_format="GLB", export_materials="EXPORT")


if __name__ == "__main__":
    main()
