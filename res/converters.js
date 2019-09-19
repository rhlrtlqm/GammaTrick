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

function quantitizeLine(img, row, matrix, isSerpentine)
{
    var matMid = (matrix[0].length-1)/2;

    var dc = 1;
    if(isSerpentine === true)
    {
        dc = (row%2 === 0) ? +1 : -1;
    }

    var w = img.width;
    var c = 0;
    if(dc === -1)
    {
        c = w-1;
    }

    for(; 0 <= c && c < w; c += dc)
    {
        var c_old = colorFromImageData(img, c, row);
        var c_new = nearestPaletteColor(c_old);
        var diff = cDiff(c_old, c_new);

        colorToImageData(img, c, row, c_new);
        for(var i = 0; i < matrix.length; i++)
        {
            for(var j = 0; j < matrix[0].length; j++)
            {
                var x = c + dc*(j-matMid);
                var y = row + i;
                var c_toDiffuse = colorFromImageData(img, x, y);
                var c_diffused = cAdd(c_toDiffuse, diff, matrix[i][j]);
                colorToImageData(img, x, y, c_diffused);
            }
        }
    }
}

var floydMatrix = [[0, 0, 7/16],
                   [3/16, 5/16, 1/16]];
var pushNextMatrix = [[0, 0, 1]];

function errorDiffuser()
{
    var matrices = arguments;
    return function(img, ctx, isSerpentine) {
        var w = img.width;
        var h = img.height;
        var img_buf = copyImageData(img, ctx);

        var matIdx = 0;
        var matrix = matrices[matIdx];
        for(var r = 0; r < h; r++)
        {
            while(r+(matrix.length)-1 >= h)
            {
                matIdx++;
                matrix = matrices[matIdx];
            }

            quantitizeLine(img_buf, r, matrix, isSerpentine);
        }

        ctx.putImageData(img_buf, 0, 0);
    }
}


var converters = {
    floydSteinberg: errorDiffuser(floydMatrix, pushNextMatrix),
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
