function updateImgBlob(blob)
{
    img_blob = blob;

    var reader = new FileReader();
    reader.onload = function(e) {
        //$('#preview').attr('src', reader.result);
    }
    reader.readAsDataURL(img_blob);
}

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
    $('#numresult').text(gam_palette.colors.length.toString());

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
    updateImgBlob(img_blob);
    //startConvert(img_blob);

    updatePalette();
    $('#fileform')[0].reset()
});


window.addEventListener('dragover', function(e) {
    e.preventDefault();
}, false);

window.addEventListener('drop', function (e) {
    e.preventDefault();
    e.stopPropagation();

    makeResultFile(e.dataTransfer.files);
}, false);

$(function(){
    $('#fileinput').on('change', function(e) {
        updateImgBlob(this.files[0]);
    });

    $('#numinput').on('change', function(e) {
        updatePalette();
    });
});
