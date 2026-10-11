# Renders a short looping "gallery wall" clip from a project's images.
# Usage: Blender -b -P cover.py -- <out.mp4> <width> <height> <frames> <still_frame|0> img1 img2 ...
import bpy, sys, math
argv = sys.argv[sys.argv.index('--') + 1:]
out, W, H, FRAMES, STILL = argv[0], int(argv[1]), int(argv[2]), int(argv[3]), int(argv[4])
images = argv[5:]

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
    try:
        sc.render.engine = eng; break
    except Exception: pass
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = W, H, 100
sc.render.fps = 24
sc.frame_start, sc.frame_end = 1, FRAMES
try: sc.view_settings.view_transform = 'Standard'
except Exception: pass
try: sc.eevee.taa_render_samples = 16
except Exception: pass
for attr in ('use_shadows', 'use_gtao'):
    try: setattr(sc.eevee, attr, True)
    except Exception: pass

CREAM = (0.905, 0.89, 0.84, 1)
world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True
bg = world.node_tree.nodes.get('Background')
bg.inputs[0].default_value = CREAM; bg.inputs[1].default_value = 0.42

def mat_flat(name, color, rough=0.9):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = color; b.inputs['Roughness'].default_value = rough
    return m

def plane(name, w, h, loc, mat):
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=(math.radians(90), 0, 0))
    o = bpy.context.active_object; o.name = name; o.scale = (w, h, 1); o.data.materials.append(mat)
    return o

# wall (faces -Y, camera looks along +Y)
plane('wall', 40, 20, (0, 0, 0), mat_flat('wall', CREAM))
ink = mat_flat('ink', (0.012, 0.012, 0.012, 1), 0.6)

# slots: x, z(height), depth off the wall, panel height
SLOTS = [(0.0, 0.0, 0.34, 1.25), (-1.72, 0.2, 0.10, 0.86), (1.68, -0.16, 0.62, 0.82), (-0.86, -0.62, 0.80, 0.52), (2.9, 0.3, 0.16, 0.74), (-3.0, -0.25, 0.48, 0.7)]
for n, path in enumerate(images[:len(SLOTS)]):
    img = bpy.data.images.load(path)
    x, z, d, h = SLOTS[n]
    w = h * img.size[0] / img.size[1]
    m = bpy.data.materials.new('img%d' % n); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes.get('Principled BSDF')
    tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = img
    b.inputs['Base Color'].default_value = (0, 0, 0, 1)      # art is self-lit so its colours stay exact
    b.inputs['Roughness'].default_value = 1
    for key in ('Specular IOR Level', 'Specular'):
        if key in b.inputs: b.inputs[key].default_value = 0; break
    for key in ('Emission Color', 'Emission'):
        if key in b.inputs: nt.links.new(tex.outputs['Color'], b.inputs[key]); break
    if 'Emission Strength' in b.inputs: b.inputs['Emission Strength'].default_value = 1.0
    plane('frame%d' % n, w + 0.035, h + 0.035, (x, -d, z), ink)
    plane('art%d' % n, w, h, (x, -d - 0.004, z), m)

# soft key light from upper left, a touch of fill
bpy.ops.object.light_add(type='AREA', location=(-3.2, -4.2, 3.4))
key = bpy.context.active_object; key.data.energy = 330; key.data.size = 3.2
bpy.ops.object.light_add(type='AREA', location=(3.5, -5.0, -0.5))
fill = bpy.context.active_object; fill.data.energy = 40; fill.data.size = 5
bpy.ops.object.empty_add(location=(0, 0, 0)); aim = bpy.context.active_object
for l in (key, fill):
    c = l.constraints.new('TRACK_TO'); c.target = aim; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'

bpy.ops.object.camera_add(location=(0, -5.5, 0.02))
cam = bpy.context.active_object; sc.camera = cam
cam.data.lens = 62 if W / H < 2 else 42
cam.data.dof.use_dof = True; cam.data.dof.focus_distance = 5.15; cam.data.dof.aperture_fstop = 2.0
c = cam.constraints.new('TRACK_TO'); c.target = aim; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'

# seamless loop: everything moves on sine waves that return to the start
for f in range(1, FRAMES + 2):
    t = 2 * math.pi * (f - 1) / FRAMES
    cam.location = (0.75 * math.sin(t), -5.5 + 0.3 * math.cos(t), 0.02 + 0.08 * math.sin(2 * t))
    cam.keyframe_insert('location', frame=f)
    aim.location = (0.10 * math.sin(t), 0, 0.02 * math.cos(t))
    aim.keyframe_insert('location', frame=f)
    key.location = (-3.2 + 0.9 * math.sin(t + 1.0), -4.2, 3.4 + 0.3 * math.cos(t))
    key.keyframe_insert('location', frame=f)

r = sc.render
if STILL:
    sc.frame_set(STILL)
    r.image_settings.file_format = 'JPEG'; r.filepath = out
    bpy.ops.render.render(write_still=True)
else:
    try: r.image_settings.media_type = 'VIDEO'
    except Exception: pass
    r.image_settings.file_format = 'FFMPEG'
    r.ffmpeg.format = 'MPEG4'; r.ffmpeg.codec = 'H264'
    r.ffmpeg.constant_rate_factor = 'MEDIUM'; r.ffmpeg.ffmpeg_preset = 'GOOD'
    r.ffmpeg.gopsize = 24; r.ffmpeg.audio_codec = 'NONE'
    r.filepath = out
    bpy.ops.render.render(animation=True)
print('DONE', out)
