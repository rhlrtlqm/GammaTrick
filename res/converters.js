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

function copyImageData(img, ctx)
{
    var img_buf = ctx.createImageData(img);
    img_buf.data.set(img.data);
    return img_buf;
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

function paletteColorWithDelta(color, rs)
{
    var colorNumPerChannel = Math.cbrt(gam_palette.colors.length);
    var gamma = gam_palette.gamma;
    var distVec = [];
    for(var i = 0; i < 3; i++)
    {
        var lower = Math.floor(reverseGamma(color[i], gamma));
        var upper = lower+1;
        var dist = reverseGamma(upper, 1/gamma) - reverseGamma(lower, 1/gamma);
        distVec.push((rs[i]-0.5) * (dist/2));
    }


    var movedColor = cAdd(color, distVec, 1);
    return nearestPaletteColor(movedColor);
}

bayerMatrix = (function() {
    return [[0, 8/16, 2/16, 10/16],
            [12/16, 4/16, 14/16, 6/16],
            [3/16, 11/16, 1/16, 9/16],
            [15/16, 7/16, 13/16, 5/16]];
}());


var converters = {
    floydSteinberg: function(img, ctx)
    {
        var w = img.width;
        var h = img.height;
        var img_buf = copyImageData(img, ctx);

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

                colorToImageData(img_buf, c, r, c_new);
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

            colorToImageData(img_buf, c, r, c_new);
            buf_cur[c] = c_new;
            cAdd(buf_cur[c+1], diff, 1);
        }

        ctx.putImageData(img_buf, 0, 0);
    },
    unorderedDither: function(img, ctx)
    {
        var w = img.width;
        var h = img.height;
        var img_buf = copyImageData(img, ctx);
        for(var row = 0; row < h; row++)
        {
            for(var col = 0; col < w; col++)
            {
                var c_old = colorFromImageData(img, col, row);
                rs = [Math.random(), Math.random(), Math.random()];

                var c_new = paletteColorWithDelta(c_old, rs);
                colorToImageData(img_buf, col, row, c_new);
            }
        }
        ctx.putImageData(img_buf, 0, 0);
    },
    orderedDither: function(img, ctx)
    {
        var N = bayerMatrix.length;
        var w = img.width;
        var h = img.height;
        var img_buf = copyImageData(img, ctx);
        for(var row = 0; row < h; row++)
        {
            for(var col = 0; col < w; col++)
            {
                var c_old = colorFromImageData(img, col, row);
                var r1 = bayerMatrix[row%N][col%N];
                var r2 = bayerMatrix[col%N][row%N];
                var r3 = bayerMatrix[(N-1) - row%N][col%N];

                var c_new = paletteColorWithDelta(c_old, [r1, r2, r3]);
                colorToImageData(img_buf, col, row, c_new);
            }
        }
        ctx.putImageData(img_buf, 0, 0);
    }
};
