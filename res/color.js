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

function nearestPaletteColor(c)
{
    var gamma = gam_palette.gamma;
    var ch_min = gam_palette.darkest_chan;
    var bestColor = 0;

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

        var ccc;
        if(ub - ch < ch - lb)
        {
            ccc = ub;
        }
        else
        {
            ccc = lb;
        }
        bestColor |= ccc<<(i<<3);

        c >>= 8;
    }

    return bestColor;
}
