import { getIcon, IColumn, Icon, mergeStyleSets } from "@fluentui/react";
import { FileIconType, getFileTypeIconProps } from '@fluentui/react-file-type-icons';
import { AdbFeatures, AdbSyncEntry, LinuxFileType } from "@yume-chan/adb";
import { makeAutoObservable, runInAction } from "mobx";
import { asyncEffect } from "../utils/asyncEffect";
import { formatSize } from "../utils/formatSize";
import Icons from "../utils/icons";
import { GlobalState } from "./state";

export interface ListItem extends AdbSyncEntry
{
    key: string;
}

const classNames = mergeStyleSets({
    name: {
        cursor: 'pointer',
        '&:hover': {
            textDecoration: 'underline',
        },
    },
});

function toListItem(item: AdbSyncEntry): ListItem
{
    (item as ListItem).key = item.name;
    return item as ListItem;
}


class FileManager
{
    constructor()
    {
        makeAutoObservable(this);
    }


    public items: ListItem[] = [];


    public path: string = '/';


    public sortKey: keyof ListItem = 'name';


    public sortDescending: boolean = false;


    public selectedItems: ListItem[] = [];


    get columns(): IColumn[]
    {
        const ICON_SIZE = 20;

        const list: IColumn[] = [
            {
                key: 'type',
                name: 'File Type',
                iconName: Icons.Document20,
                isIconOnly: true,
                minWidth: ICON_SIZE,
                maxWidth: ICON_SIZE,
                isCollapsible: true,
                onRender(item: AdbSyncEntry)
                {
                    let iconName: string;

                    switch (item.type)
                    {
                        case LinuxFileType.Link:
                            ({ iconName } = getFileTypeIconProps({ type: FileIconType.linkedFolder }));
                            break;
                        case LinuxFileType.Directory:
                            ({ iconName } = getFileTypeIconProps({ type: FileIconType.folder }));
                            break;
                        case LinuxFileType.File:
                            ({ iconName } = getFileTypeIconProps({ extension: item.name }));
                            break;
                        default:
                            ({ iconName } = getFileTypeIconProps({ extension: 'txt' }));
                            break;
                    }

                    // `@fluentui/react-file-type-icons` doesn't export icon src.
                    const iconSrc = (getIcon(iconName)!.code as unknown as JSX.Element).props.src;
                    return <Icon imageProps={{ crossOrigin: 'anonymous', src: iconSrc }} style={{ width: ICON_SIZE, height: ICON_SIZE }} />;
                }
            },
            {
                key: 'name',
                name: 'Name',
                minWidth: 0,
                isRowHeader: true,
                onRender(item: AdbSyncEntry)
                {
                    return (
                        <span className={classNames.name} data-selection-invoke>
                            {item.name}
                        </span>
                    );
                }
            },
            {
                key: 'permission',
                name: 'Permission',
                minWidth: 0,
                isCollapsible: true,
                onRender(item: AdbSyncEntry)
                {
                    return `${(item.mode >> 6 & 0b100).toString(8)}${(item.mode >> 3 & 0b100).toString(8)}${(item.mode & 0b100).toString(8)}`;
                }
            },
            {
                key: 'size',
                name: 'Size',
                minWidth: 0,
                isCollapsible: true,
                onRender(item: AdbSyncEntry)
                {
                    if (item.type === LinuxFileType.File)
                    {
                        return formatSize(Number(item.size));
                    }
                    return '';
                }
            },
            {
                key: 'mtime',
                name: 'Last Modified Time',
                minWidth: 150,
                isCollapsible: true,
                onRender(item: AdbSyncEntry)
                {
                    return new Date(Number(item.mtime) * 1000).toLocaleString();
                },
            }
        ];

        if (GlobalState.device?.features?.includes(AdbFeatures.ListV2))
        {
            list.push(
                {
                    key: 'ctime',
                    name: 'Creation Time',
                    minWidth: 150,
                    isCollapsible: true,
                    onRender(item: AdbSyncEntry)
                    {
                        return new Date(Number(item.ctime!) * 1000).toLocaleString();
                    },
                },
                {
                    key: 'atime',
                    name: 'Last Access Time',
                    minWidth: 150,
                    isCollapsible: true,
                    onRender(item: AdbSyncEntry)
                    {
                        return new Date(Number(item.atime!) * 1000).toLocaleString();
                    },
                },
            );
        }

        for (const item of list)
        {
            item.onColumnClick = (e, column) =>
            {
                if (this.sortKey === column.key)
                {
                    runInAction(() => this.sortDescending = !this.sortDescending);
                } else
                {
                    runInAction(() =>
                    {
                        this.sortKey = column.key as keyof ListItem;
                        this.sortDescending = false;
                    });
                }
            };

            if (item.key === this.sortKey)
            {
                item.isSorted = true;
                item.isSortedDescending = this.sortDescending;
            }
        }

        return list;
    }

    public loadFiles = asyncEffect(async (signal) =>
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

            runInAction(() =>
            {
                this.items = items;
            });

        } finally
        {
            clearInterval(intervalId);

            sync.dispose();
        }
    });
}


export const fileManager = new FileManager();
