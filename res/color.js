function reverseGamma(color, invGamma)
{
    return 255*Math.pow(color/255, invGamma);
}


function gamma_palette(original_darkest, converted_darkest)
{
    var od = original_darkest/255;
    var cd = converted_darkest/255;
    var invGamma = Math.log(cd)/Math.log(od);

    return {
        gamma: 1/invGamma,
        colorsPerChannel: 0xff-original_darkest+1,
        darkest_chan: converted_darkest
    };
}

var gam_palette;

function updateGammaPalette(colorsPerChannel)
{
    gam_palette = gamma_palette(0xff-colorsPerChannel+1, 0x40);
}



function cAdd(a, b, k)
{
    if(a === undefined)
    {
        return a;
    }

    var c = 0;
    for(var i = 0; i < 3; i++)
    {
        var cc = Math.floor((a&0xff) + k*(b&0xff));
        if(cc > 0xff)
        {
            cc = 0xff;
        }
        c |= cc<<(i<<3);

        a >>= 8;
        b >>= 8;
    }

    return c;
}

function cDiff(a, b)
{
    return cAdd(a, b, -1);
}

function colorError(a, b)
{
    var d = cDiff(a, b);
    var error = 0;

    for(var i = 0; i < 3; i++)
    {
        var dd = d&0xff;
        error += dd*dd;
        d >>= 8;
    }

    return error;
}

function nearestPaletteColor(color)
{
    var gamma = gam_palette.gamma;
    var ch_min = gam_palette.darkest_chan;
    var bestColor = 0;

    var uc = 0, lc = 0;
    var c = color;
    for(var i = 0; i < 3; i++)
    {
        var ch = c & 0xff;
        var ub, lb;
        if(ch <= ch_min)
        {
            ub = lb = ch_min;
        }
        else
        {
            var lb_gam = Math.floor(reverseGamma(ch, gamma));
            lb = Math.round(reverseGamma(lb_gam, 1/gamma));
            ub = Math.round(reverseGamma(lb_gam+1, 1/gamma));
            if(ub > 0xff)
            {
                ub = 0xff;
            }
        }

        uc |= ub<<(i<<3);
        lc |= lb<<(i<<3);

        c >>= 8;
    }

    var bestError = Infinity;
    for(var r = 0; r <= 1; r++)
    {
        for(var g = 0; g <= 1; g++)
        {
            for(var b = 0; b <= 1; b++)
            {
                var m = (r*0xff0000) | (g*0x00ff00) | (b*0x0000ff);
                var cc = (uc&m) | (lc&(0xffffff^m));
                var error = colorError(color, cc);
                if(error < bestError)
                {
                    bestError = error;
                    bestColor = cc;
                }
            }
        }
    }

    return bestColor;
}
