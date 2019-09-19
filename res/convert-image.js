function generateGammaTrickPNG(cvs, ongenerate)
{
    var png = cvs.toBlob(function(blob) {
        ongenerate(blob);
    }, 'image/png');
}

function convertBitmap(name, image, arg)
{
    var anchor = $('<a/>', {
        download: name+'.png'
    }).appendTo('#result');
    var cvs = $('<canvas/>').appendTo(anchor)[0];
    cvs.width = image.width;
    cvs.height = image.height;
    var ctx = cvs.getContext('2d');


    converters[name](image, ctx, arg);
    generateGammaTrickPNG(cvs, function(blob) {
        var url = URL.createObjectURL(blob);
        anchor.attr('href', url);
    });
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
        convertBitmap('floydSteinberg', imgData, true);
    };

    img.src = URL.createObjectURL(img_blob);
}
