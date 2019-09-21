var table = [];
for(var n = 0; n < 256; n++)
{
    var c = n;
    for(var k = 0; k < 8; k++)
    {
        if(c&1)
        {
            c = 0xedb88320 ^ (c>>>1);
        }
        else
        {
            c >>>= 1;
        }
    }

    table[n] = c;
}

function crc32(arr, start, len)
{
    var reg = 0xffffffff;

    for(var i = start; i < start+len; i++)
    {
        reg = table[(reg^arr[i]) & 0xff] ^ (reg>>>8);
    }

    return reg^0xffffffff;
}
