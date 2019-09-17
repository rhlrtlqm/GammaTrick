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

var gam_palette = gamma_palette(0xfd, 0x40);


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
