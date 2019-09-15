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

function convertBitmap(name, image)
{
    console.log(gam_palette);
    console.log(image);
}

function startConvert(img_blob)
{
    var cvs = new Canvas();
    var ctx = cvs.getContext('2d');
    var img = new Image();

    img.onload = function() {
        cvs.width = this.width;
        cvs.height = this.height;
        ctx.drawImage(this, 0, 0);

        var imgData = ctx.getImageData(0, 0, cvs.width, cvs.height);
        convertBitmap('floydSteinberg', imgData);
    };

    img.src = URL.createObjectURL(blob);
}
