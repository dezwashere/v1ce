"""Offline font-name audit using only Python's standard library; installs nothing."""
import pathlib, struct, json

ROOT = pathlib.Path(__file__).resolve().parents[1]
PACKAGES = {
    'classic': ('cinzel', '700Bold'), 'poppins': ('poppins', '700Bold'),
    'monospace': ('space-mono', '700Bold'), 'fredoka': ('fredoka', '400Regular'),
    'dmsans': ('dm-sans', '700Bold'), 'courier': ('courier-prime', '700Bold'),
    'syne': ('syne', '700Bold'), 'pacifico': ('pacifico', '400Regular'),
    'bebas': ('bebas-neue', '400Regular'), 'inter': ('inter', '700Bold'),
    'roboto_mono': ('roboto-mono', '700Bold'), 'oswald': ('oswald', '600SemiBold'),
    'raleway': ('raleway', '700Bold'), 'caveat': ('caveat', '400Regular'),
    'dyna_puff': ('dynapuff', '600SemiBold'),
}

def names(path):
    data = path.read_bytes()
    tables = {}
    for i in range(struct.unpack_from('>H', data, 4)[0]):
        tag, _, offset, length = struct.unpack_from('>4sIII', data, 12 + i * 16)
        tables[tag] = data[offset:offset + length]
    table = tables[b'name']
    _, count, offset = struct.unpack_from('>HHH', table)
    result = {}
    for i in range(count):
        platform, encoding, language, name_id, length, start = struct.unpack_from('>HHHHHH', table, 6 + i * 12)
        if name_id not in (1, 6): continue
        value = table[offset + start:offset + start + length].decode('utf-16-be' if platform in (0, 3) else 'mac_roman')
        result[str(name_id)] = value
    return result

result = {}
for key, (package, weight) in PACKAGES.items():
    files = sorted((ROOT / 'node_modules' / '@expo-google-fonts' / package).rglob('*.ttf'))
    source = next(p for p in files if weight in str(p) and 'Italic' not in str(p))
    result[key] = names(source)
result['big_shoulders_stencil'] = names(ROOT / 'assets/fonts/BigShouldersStencilDisplay-Regular.ttf')
print(json.dumps(result, indent=2))
