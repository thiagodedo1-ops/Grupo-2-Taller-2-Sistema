import os
import re

bovino_dir = '/src/views/bovinos'
files_to_update = [
    '/src/views/GanaderiaOvinaView.tsx',
    '/src/views/ConsolidadoMultiNegocioView.tsx'
]

for root, dirs, files in os.walk(bovino_dir):
    for file in files:
        if file.endswith('.tsx'):
            files_to_update.append(os.path.join(bovino_dir, file))

print(f"Found {len(files_to_update)} files to check/update.")
