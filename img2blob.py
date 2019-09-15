#!/usr/bin/python3

import base64
import time
import sys


if len(sys.argv) <= 1 or not sys.argv[1].lower().endswith('.png'):
    print('no input image')
    sys.exit();

if len(sys.argv) <= 2:
    print('no output file name')
    sys.exit();

with open(sys.argv[1], 'rb') as f:
    s = f.read()

with open(sys.argv[2], 'w') as f:
    col = f.write('img_b64 = \'')
    for c in base64.b64encode(s).decode():
        col += f.write(c)
        if col > 60:
            f.write('\'\n+\'')
            col = 0
    f.write('\';\n\n')

    f.write(
            'bytes = atob(img_b64);\n'+
            'byteNumbers = new Array(bytes.length);\n'+
            'for(var i = 0; i < byteNumbers.length; i++) {\n'+
            '    byteNumbers[i] = bytes.charCodeAt(i);\n}\n'+
            'img_blob = new Blob([new Uint8Array(byteNumbers)],\n'+
            '                    {type: \'image/png\'});');
