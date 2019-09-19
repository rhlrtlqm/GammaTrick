function convertBitmap(name, image, arg)
{
    var cvs = $('<canvas/>').appendTo('#result')[0];
    cvs.width = image.width;
    cvs.height = image.height;
    var ctx = cvs.getContext('2d');


    converters[name](image, ctx, arg);
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
        convertBitmap('jarvisJudiceNinke', imgData, true);
        convertBitmap('stucki', imgData, true);
    };

    img.src = URL.createObjectURL(img_blob);
}
