import { DefaultButton } from "@fluentui/react";
import { AdbSyncEntry, LinuxFileType } from "@yume-chan/adb";
import React, { useState } from 'react';
import { GlobalState } from '../state/state';
import { asyncEffect } from '../utils/asyncEffect';

interface ListItem extends AdbSyncEntry
{
    key: string;
}


function toListItem(item: AdbSyncEntry): ListItem
{
    (item as ListItem).key = item.name;
    return item as ListItem;
}

export class FileManager
{
    public items: ListItem[] = [];

    public path: string = '/';

    public loadFiles = asyncEffect(async (signal, setFileList: React.Dispatch<React.SetStateAction<ListItem[]>>) =>
    {
        if (!GlobalState.device) return;

        const sync = await GlobalState.device.sync();

        const items: ListItem[] = [];

        const linkItems: AdbSyncEntry[] = [];

        const intervalId = setInterval(() =>
        {
            if (signal.aborted)
            {
                return;
            }
        }, 1000);

        try
        {
            for await (const entry of sync.opendir(this.path))
            {
                if (signal.aborted) return;

                if (entry.name === '.' || entry.name === '..')
                {
                    continue;
                }

                if (entry.type === LinuxFileType.Link)
                {
                    linkItems.push(entry);
                } else
                {
                    items.push(toListItem(entry));
                }
            }

            for (const entry of linkItems)
            {
                if (signal.aborted) return;

                let target_path: string;

                if (this.path.at(-1) === '/')
                {
                    target_path = this.path + entry.name;
                } else
                {
                    target_path = this.path + '/' + entry.name;
                }

                if (!await sync.isDirectory(target_path))
                {
                    entry.mode = LinuxFileType.File << 12 | entry.permission;
                    entry.size = 0n;
                }

                items.push(toListItem(entry));
            }

            if (signal.aborted) return;

            setFileList(items);

        } finally
        {
            clearInterval(intervalId);

            sync.dispose();
        }
    });
}

const fileManager = new FileManager();

export default function FileList()
{
    const [fileList, setFileList] = useState<ListItem[]>([]);

    return (
        <div>
            <DefaultButton disabled={!GlobalState.device} onClick={() => fileManager.loadFiles(setFileList)}>
                加载文件
            </DefaultButton>
        </div>
    );
}
