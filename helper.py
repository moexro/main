import base64
import subprocess
import sys


header = input("Enter header: ")
list = input("Enter list items separated by semicolons: ").split(";")
index = int(input("Enter index: "))

output = []
if header != "none":
    output.append(f'<div class="group-label">{header}</div>')
output.append('<div class="checklist">')


for item in list:
    output.append(f'<div class="check-item toggleable off self-check self-check" data-id="einweisung-{index}-{list.index(item)}"> <span class="icon">–</span> <span>{item}</span></div>')

output.append('</div>')

html = "\n".join(output)
print(html)

try:
    subprocess.run(
        ["xsel", "--clipboard", "--input"],
        input=html,
        text=True,
        check=True,
        stderr=subprocess.DEVNULL,
    )
except (OSError, subprocess.CalledProcessError):
    encoded = base64.b64encode(html.encode()).decode()
    sys.stdout.write(f"\033]52;c;{encoded}\a")
    sys.stdout.flush()

