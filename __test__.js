const file = 'ok.easd.docx';


function extname(filename)
{
    const last_index = filename.lastIndexOf('.');

    return filename.substring(last_index);
}

console.log(extname(file));
