import { InspectStream, WrapReadableStream } from '@yume-chan/adb';
//@ts-ignore
import StreamSaver from '@yume-chan/stream-saver';
import { formatSize } from './formatSize';


StreamSaver.mitm = '/home/liaozhengyang/projects/react/web-adb/src/util' + '/mitm.html';

interface PickFileOptions
{
    accept?: string;
}

export function pickFile(options: { multiple: true; } & PickFileOptions): Promise<FileList>;
export function pickFile(options: { multiple?: false; } & PickFileOptions): Promise<File | null>;
export function pickFile(options: { multiple?: boolean; } & PickFileOptions): Promise<FileList | File | null>
{
    return new Promise<FileList | File | null>(resolve =>
    {
        const input = document.createElement('input');
        input.type = 'file';

        if (options.multiple)
        {
            input.multiple = true;
        }

        if (options.accept)
        {
            input.accept = options.accept;
        }

        input.onchange = () =>
        {
            if (options.multiple)
            {
                resolve(input.files!);
            } else
            {
                resolve(input.files!.item(0));
            }
        };

        input.click();
    });
}

export function saveFile(fileName: string, size?: number | undefined)
{
    return StreamSaver!.createWriteStream(
        fileName,
        { size }
    ) as unknown as WritableStream<Uint8Array>;
}


export function createFileStream(file: File)
{
    //@ts-ignore
    return new WrapReadableStream<Uint8Array>(file.stream() as unknown as ReadableStream<Uint8Array>);
}


export function formatSpeed(completed: number, total: number, speed: number): string | undefined
{
    if (total === 0)
    {
        return undefined;
    }
    return `${formatSize(completed)} of ${formatSize(total)} (${formatSize(speed)}/s)`;
}

export class ProgressStream extends InspectStream<Uint8Array> {
    public constructor(onProgress: (value: number) => void)
    {
        let progress = 0;
        super(chunk =>
        {
            progress += chunk.byteLength;
            onProgress(progress);
        });
    }
}
