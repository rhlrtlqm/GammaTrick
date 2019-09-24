function colorFromImageData(img, x, y)
{
    var color = 0;
    var idx = 4*(img.width*y + x);
    for(var i = idx; i < idx+3; i++)
    {
        color <<= 8;
        color |= img.data[i];
    }

    return color;
}

function colorToImageData(img, x, y, c)
{
    var idx = 4*(img.width*y + x);

    for(var i = idx+2; idx <= i; i--)
    {
        img.data[i] = c&0xff;
        c >>= 8;
    }
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

function fitByte(c)
{
    if(c >= 0xff)
    {
        c = 0xff;
    }
    else if(c < 0)
    {
        c = 0;
    }
    else
    {
        c = Math.round(c);
    }

    return c;
}

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
        var d1 = (c_old>>16) - (c_new>>16);
        var d2 = (0xff&(c_old>>8)) - (0xff&(c_new>>8));
        var d3 = (0xff&c_old) - (0xff&c_new);

        colorToImageData(img, c, row, c_new);
        for(var i = 0; i < matrix.length; i++)
        {
            for(var j = 0; j < matrix[0].length; j++)
            {
                var x = c + dc*(j-matMid);
                var y = row + i;
                var c_toDiffuse = colorFromImageData(img, x, y);
                var k = matrix[i][j];

                var c1 = fitByte((c_toDiffuse>>16) + k*d1);
                var c2 = fitByte((0xff&(c_toDiffuse>>8)) + k*d2);
                var c3 = fitByte((0xff&c_toDiffuse) + k*d3);
                var c_diffused = (c1<<16) | (c2<<8) | c3
                colorToImageData(img, x, y, c_diffused);
            }
        }
    }
}

var jjnMatrix = [[0, 0, 0, 7/48, 5/48],
                 [3/48, 5/48, 7/48, 5/48, 3/48],
                 [1/48, 3/48, 5/48, 3/48, 1/48]];

var stuckiMatrix = [[0, 0, 0, 8/48, 4/48],
                    [2/48, 4/48, 8/48, 4/48, 2/48],
                    [1/48, 2/48, 4/48, 2/48, 1/48]];

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
    jarvisJudiceNinke: errorDiffuser(jjnMatrix, floydMatrix, pushNextMatrix),
    stucki: errorDiffuser(stuckiMatrix, floydMatrix, pushNextMatrix),
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
