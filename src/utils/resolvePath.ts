export default function resolvePath(...paths: string[])
{
    let resolvePath = '';
    let isAbsolutePath = false;
    for (let i = paths.length - 1; i > -1; i--)
    {
        const path = paths[i];
        if (isAbsolutePath)
        {
            break;
        }
        if (!path)
        {
            continue;
        }
        resolvePath = path + '/' + resolvePath;
        isAbsolutePath = path.charCodeAt(0) === 47;
    }
    if (/^\/+$/.test(resolvePath))
    {
        resolvePath = resolvePath.replace(/(\/+)/, '/');
    } else
    {
        resolvePath = resolvePath.replace(/(?!^)\w+\/+\.{2}\//g, '')
            .replace(/(?!^)\.\//g, '')
            .replace(/\/+$/, '');
    }

    resolvePath = resolvePath.replace(/(\/)\1+/g, '$1');

    return resolvePath;
}


export function extname(filename: string)
{
    const last_index = filename.lastIndexOf('.');

    return filename.substring(last_index);
}
