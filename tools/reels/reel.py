# Flat 2D brand reel: hard cuts between logo slates, bold type and full-bleed applications.
# Usage: Blender -b -P reel.py -- <storyboard.py> <out.mp4 | out_dir for stills> <width> <height> [frame,frame,...]
import bpy, sys, math, os
argv = sys.argv[sys.argv.index('--') + 1:]
BOARD, OUT, RX, RY = argv[0], argv[1], int(argv[2]), int(argv[3])
STILLS = [int(x) for x in argv[4].split(',')] if len(argv) > 4 else []
W, H = RX / RY, 1.0
FONT = '/System/Library/Fonts/Supplemental/Arial Black.ttf'

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
    try: sc.render.engine = eng; break
    except Exception: pass
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = RX, RY, 100
sc.render.fps = 24
sc.view_settings.view_transform = 'Standard'
try: sc.eevee.taa_render_samples = 8
except Exception: pass
sc.world = bpy.data.worlds.new('w'); sc.world.use_nodes = True
sc.world.node_tree.nodes['Background'].inputs[0].default_value = (0, 0, 0, 1)
bpy.ops.object.camera_add(location=(0, 0, 50)); cam = bpy.context.active_object
cam.data.type = 'ORTHO'; cam.data.ortho_scale = W; cam.data.clip_end = 200; sc.camera = cam
font = bpy.data.fonts.load(FONT)
def set_font(path):
    global font
    font = bpy.data.fonts.load(path)
_img, _z = {}, [0.0]

def lin(c):  # sRGB hex -> linear rgba
    c = c.lstrip('#'); v = [int(c[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4) for x in v) + (1,)
def emit(name, color=None, image=None):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    o = nt.nodes.new('ShaderNodeOutputMaterial'); e = nt.nodes.new('ShaderNodeEmission')
    nt.links.new(e.outputs[0], o.inputs[0])
    if image:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = image; t.extension = 'EXTEND'
        nt.links.new(t.outputs['Color'], e.inputs['Color'])
    else: e.inputs['Color'].default_value = lin(color)
    return m
def load(path):
    if path not in _img: _img[path] = bpy.data.images.load(path)
    return _img[path]
def nextz(): _z[0] += 0.05; return _z[0]
def plane(w, h, mat, uv=None):
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, nextz()))
    o = bpy.context.active_object; o.scale = (w, h, 1); o.data.materials.append(mat)
    if uv:
        u0, v0, u1, v1 = uv; L = o.data.uv_layers.active.data
        for lp in L: lp.uv = (u0 + lp.uv[0] * (u1 - u0), v0 + lp.uv[1] * (v1 - v0))
    return o
def cover(crop, src_aspect, w, h):
    # shrink a crop box (u0,v0,u1,v1, v measured from the top) so it matches the w:h target, centred
    u0, t0, u1, t1 = crop; cw, ch = (u1 - u0) * src_aspect, (t1 - t0)
    want = w / h
    if cw / ch > want: nw = ch * want / src_aspect; c = (u0 + u1) / 2; u0, u1 = c - nw / 2, c + nw / 2
    else: nh = cw / want; c = (t0 + t1) / 2; t0, t1 = c - nh / 2, c + nh / 2
    return (u0, 1 - t1, u1, 1 - t0)
def show(o, a, b):
    for f, v in ((1, True), (a, False), (b, True)):
        o.hide_render = v; o.hide_viewport = v
        o.keyframe_insert('hide_render', frame=f); o.keyframe_insert('hide_viewport', frame=f)
def ease(t): return 1 - (1 - min(1, max(0, t))) ** 4
def move(o, a, b, fn):
    for f in range(a, b + 1):
        x, y, s = fn((f - a) / max(1, b - a), f - a)
        o.location.x, o.location.y = x, y
        o.scale = (o['w'] * s, o['h'] * s, 1)
        o.keyframe_insert('location', frame=f); o.keyframe_insert('scale', frame=f)
def pic(path, a, b, crop=(0, 0, 1, 1), w=None, h=None, x=0, y=0):
    w, h = w or W, h or H; im = load(path)
    o = plane(w, h, emit('i', image=im), cover(crop, im.size[0] / im.size[1], w, h))
    o['w'], o['h'] = w, h; o.location.x, o.location.y = x, y; show(o, a, b); return o

# ---- shot types ----
def slate(color, a, b):
    o = plane(W, H, emit('s', color)); show(o, a, b); return o
def full(path, a, b, crop=(0, 0, 1, 1), s0=1.0, s1=1.07, drift=(0, 0)):
    o = pic(path, a, b, crop)
    move(o, a, b, lambda t, n: (drift[0] * (t - .5), drift[1] * (t - .5), s0 + (s1 - s0) * t)); return o
def words(lines, a, b, color, bg, size=0.36, step=4):
    slate(bg, a, b); mat = emit('t', color); n = len(lines); gap = size * 0.98
    for i, line in enumerate(lines):
        cu = bpy.data.curves.new('txt', 'FONT'); cu.body = line; cu.font = font; cu.size = size
        cu.align_x = 'CENTER'; cu.align_y = 'CENTER'; cu.space_character = 0.92
        o = bpy.data.objects.new('txt', cu); sc.collection.objects.link(o); o.data.materials.append(mat)
        o.location.z = nextz(); bpy.context.view_layer.update()
        k = min(1.0, 0.88 * W / max(0.01, o.dimensions.x))
        o['w'], o['h'] = k, k
        ty = (n - 1) * gap / 2 - i * gap
        show(o, a, b)
        move(o, a, b, lambda t, f, ty=ty, i=i: (0, ty - (1 - ease((f - i * step) / 9)) * (H * 1.1), 1))
def split(left, right, a, b, lcrop=(0, 0, 1, 1), rcrop=(0, 0, 1, 1)):
    for path, crop, sx, sy in ((left, lcrop, -1, 1), (right, rcrop, 1, -1)):
        o = pic(path, a, b, crop, W / 2, H, sx * W / 4, 0)
        move(o, a, b, lambda t, f, sx=sx, sy=sy: (sx * W / 4, sy * (1 - ease(f / 10)) * H, 1 + .04 * t))
def scroll(path, a, b, crop=(0, 0, 1, 1), zoom=1.0):
    # image fitted to the frame width (times zoom), travelling upward through the frame
    im = load(path); u0, t0, u1, t1 = crop; asp = (u1 - u0) * im.size[0] / ((t1 - t0) * im.size[1])
    w = W * zoom; h = w / asp
    o = plane(w, h, emit('i', image=im), (u0, 1 - t1, u1, 1 - t0)); o['w'], o['h'] = w, h; show(o, a, b)
    travel = max(0, h - H)
    move(o, a, b, lambda t, f: (0, -travel / 2 + travel * t, 1)); return o

exec(open(BOARD).read())
sc.frame_start, sc.frame_end = 1, TOTAL
r = sc.render
if STILLS:
    r.image_settings.file_format = 'JPEG'
    for f in STILLS:
        sc.frame_set(f); r.filepath = os.path.join(OUT, 'f%03d.jpg' % f); bpy.ops.render.render(write_still=True)
else:
    try: r.image_settings.media_type = 'VIDEO'
    except Exception: pass
    r.image_settings.file_format = 'FFMPEG'
    r.ffmpeg.format = 'MPEG4'; r.ffmpeg.codec = 'H264'
    r.ffmpeg.constant_rate_factor = 'MEDIUM'; r.ffmpeg.ffmpeg_preset = 'GOOD'
    r.ffmpeg.gopsize = 12; r.ffmpeg.audio_codec = 'NONE'
    r.filepath = OUT; bpy.ops.render.render(animation=True)
print('DONE')
