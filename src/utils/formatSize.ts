const units = [' B', ' KB', ' MB', ' GB'];

export function formatSize(value: number): string
{
    let index = 0;
    while (index < units.length && value > 1024)
    {
        index += 1;
        value /= 1024;
    }
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 }) + units[index];
}
