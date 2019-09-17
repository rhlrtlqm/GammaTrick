function updateImgBlob(blob)
{
    img_blob = blob;

    var reader = new FileReader();
    reader.onload = function(e) {
        //$('#preview').attr('src', reader.result);
    }
    reader.readAsDataURL(img_blob);
}

$(function() {
    updateImgBlob(img_blob);
    startConvert(img_blob);

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
});
