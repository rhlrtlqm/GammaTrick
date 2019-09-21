function applyGammaToImageData(imgData, gamma)
{
    var arr = imgData.data;

    for(var i = 0; i < arr.length; i++)
    {
        if(i%4 == 3)
        {
            continue;
        }

        arr[i] = reverseGamma(arr[i], gamma);
    }

    return imgData;
}

 
function storeToByteArray(arr, word, off, isBigEndian)
{
    for(var i = 0; i < 4; i++)
    {
        var idx = isBigEndian ? 4*off+3 - i : 4*off+i;
        arr[idx] = word & 0xff;
        word >>= 8;
    }
}

function generateGammaChunk(gamma)
{
    var c_length = 4;
    var c_name = 0x67414d41; //gAMA in ASCII
    var c_gamma = Math.round(100000*gamma/2.2);
    var chunk = new Uint8Array(4*4);
    storeToByteArray(chunk, c_length, 0, true);
    storeToByteArray(chunk, c_name, 1, true);
    storeToByteArray(chunk, c_gamma, 2, true);

    var c_crc = crc32(chunk, 4, 8);
    storeToByteArray(chunk, c_crc, 3, true);

    return chunk;
}

function insertGammaChunk(blob, gAMA)
{
    return blob;
}

function generateGammaTrickPNG(cvs_ref, ongenerate)
{
    var cvs = $('<canvas/>')[0];
    cvs.width = cvs_ref.width;
    cvs.height = cvs_ref.height;
    var ctx = cvs.getContext('2d');
    ctx.drawImage(cvs_ref, 0, 0);

    var gamma = gam_palette.gamma;
    var imgData = ctx.getImageData(0, 0, cvs.width, cvs.height);
    ctx.putImageData(applyGammaToImageData(imgData, gamma), 0, 0);

    gAMA = generateGammaChunk(gamma);

    var png = cvs.toBlob(function(blob) {
        gAMA_inserted = insertGammaChunk(blob, gAMA);
        ongenerate(gAMA_inserted);
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
