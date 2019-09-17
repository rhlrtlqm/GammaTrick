function reverseGamma(color, invGamma)
{
    return Math.round(255*Math.pow(color/255, invGamma));
}


function gamma_palette(original_darkest, converted_darkest)
{
    var od = original_darkest/255;
    var cd = converted_darkest/255;
    var invGamma = Math.log(cd)/Math.log(od);

    var colors = [];
    for(var r = original_darkest; r <= 0xff; r++)
    {
        for(var g = original_darkest; g <= 0xff; g++)
        {
            for(var b = original_darkest; b <= 0xff; b++)
            {
                var color = [r, g, b].map(function(c) {
                    return reverseGamma(c, invGamma);
                });
                colors.push(color);
            }
        }
    }

    return {
        gamma: 1/invGamma,
        colors: colors
    };
}

var gam_palette = gamma_palette(0xfa, 0x40);

function cAdd(a, b, k)
{
    a[0] += k*b[0],
    a[1] += k*b[1],
    a[2] += k*b[2]

    return a;
}

function cDiff(a, b)
{
    return cAdd(a, b, -1);
}

function colorError(a, b)
{
    d = cDiff(a.slice(), b);

    return d[0]*d[0] + 
        d[1]*d[1] + 
        d[2]*d[2];
}

function nearestPaletteColor(c)
{
    var bestError = Infinity;
    var cs = gam_palette.colors;
    var bestColor = cs[0];

    for(var i in cs)
    {
        var error = colorError(cs[i], c);
        if(error < bestError)
        {
            bestError = error;
            bestColor = cs[i];
        }
    }

    return bestColor;
}



function colorFromImageData(img, x, y)
{
    var pixelIndex = img.width*y + x;
    return img.data.slice(4*pixelIndex, 4*pixelIndex+3);
}

function colorToImageData(img, x, y, c)
{
    var idx = 4*(img.width*y + x);
    img.data[idx] = c[0];
    img.data[idx+1] = c[1];
    img.data[idx+2] = c[2];
}


function fillCircularBuffer(img, row)
{
    var buf = [];
    var c = 0;
    for(; c < img.width; c++)
    {
        buf[c] = colorFromImageData(img, c, row);
    }
    buf[-1] = buf[c] = [0, 0, 0];
    return buf;
}


var converters = {
    floydSteinberg: function(img, ctx)
    {
        var w = img.width;
        var h = img.height;

        var buf_cur;
        var buf_next;

        buf_next = fillCircularBuffer(img, 0);

        for(var r = 0; r < h-1; r++)
        {
            buf_cur = buf_next;
            buf_next = fillCircularBuffer(img, r+1);

            for(var c = 0; c < w; c++)
            {
                var c_old = buf_cur[c];
                var c_new = nearestPaletteColor(c_old);
                var diff = cDiff(c_old, c_new);

                colorToImageData(img, c, r, c_new);
                cAdd(buf_cur[c+1], diff, 7/16);
                cAdd(buf_next[c-1], diff, 3/16);
                cAdd(buf_next[c], diff, 5/16);
                cAdd(buf_next[c+1], diff, 1/16);
            }
        }

        buf_cur = buf_next;
        for(var c = 0; c < w; c++)
        {
            var c_old = buf_cur[c];
            var c_new = nearestPaletteColor(c_old);
            var diff = cDiff(c_old, c_new);

            colorToImageData(img, c, r, c_new);
            buf_cur[c] = c_new;
            cAdd(buf_cur[c+1], diff, 1);
        }

        ctx.putImageData(img, 0, 0);
    }
};

function convertBitmap(name, image)
{
    var cvs = $('<canvas/>').appendTo('#result')[0];
    cvs.width = image.width;
    cvs.height = image.height;
    var ctx = cvs.getContext('2d');


    converters[name](image, ctx);
}

function startConvert(img_blob)
{
    var cvs = $('<canvas/>')[0];
    var ctx = cvs.getContext('2d');
    var img = new Image();

    img.onload = function() {
        cvs.width = this.width;
        cvs.height = this.height;
        ctx.drawImage(this, 0, 0);

        var imgData = ctx.getImageData(0, 0, cvs.width, cvs.height);
        convertBitmap('floydSteinberg', imgData);
    };

    img.src = URL.createObjectURL(img_blob);
}
