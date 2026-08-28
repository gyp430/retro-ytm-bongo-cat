# PyInstaller build of the Retro YTM Python sidecar → dist/server/server.exe
# Run:  pyinstaller --noconfirm --clean retro-sidecar.spec
#
# The frozen exe is bundled into the Electron app by electron-builder
# (extraResources → resources/sidecar/). electron/main.js spawns it directly
# in packaged builds, so the QA machine needs no Python.

from PyInstaller.utils.hooks import collect_all, collect_submodules

datas = [('renderer', 'renderer')]   # served by Flask as the UI for all 3 windows
binaries = []
hiddenimports = []

# ytmusicapi ships locale/translation json; yt-dlp lazy-imports hundreds of
# extractor modules — pull everything for both.
for pkg in ('ytmusicapi', 'yt_dlp'):
    d, b, h = collect_all(pkg)
    datas += d
    binaries += b
    hiddenimports += h

hiddenimports += collect_submodules('flask_cors')

a = Analysis(
    ['py/server.py'],
    pathex=[],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter'],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='server',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,          # no stray console window; Electron pipes stdout/stderr
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name='server',
)
