var img_blob = undefined;

function toHTMLRGB(color)
{
    return '#' +
        color.map(function(chan) {
            return chan.toString(16);
        }).join('');
}

function reverseGamma_color(color, gamma)
{
    return color.map(function(c) {
        return reverseGamma(c, gamma);
    });
}

function updatePalette()
{
    var input = parseInt($('#numinput').val(), 10);
    updateGammaPalette(input);
    $('#numresult').text(input*input*input);

    var cvs = $('#palettepreview')[0];
    var ctx = cvs.getContext('2d');
    ctx.imageSmoothingEnabled = false;


    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 100, 100);

    var darkest = 0xff - gam_palette.colorsPerChannel + 1;
    ctx.fillStyle = toHTMLRGB([darkest, darkest, darkest]);
    ctx.fillRect(100, 0, 100, 100);
}


$(function() {
    updatePalette();
    $('#fileform')[0].reset()
});


window.addEventListener('dragover', function(e) {
    e.preventDefault();
}, false);

window.addEventListener('drop', function (e) {
    e.preventDefault();
    e.stopPropagation();

    startConvert(img_blob = e.dataTransfer.files[0]);
}, false);

$(function(){
    $('#fileinput').on('change', function(e) {
        startConvert(img_blob = this.files[0]);
    });

    $('#numinput').on('change', function(e) {
        updatePalette();
    });

    $('#paletteform').on('submit', function(e) {
        if(img_blob)
        {
            startConvert(img_blob);
        }
    });
});
