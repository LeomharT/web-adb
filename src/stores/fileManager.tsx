import { getIcon, IBreadcrumbItem, IColumn, Icon, IContextualMenuItem, mergeStyleSets } from "@fluentui/react";
import { FileIconType, getFileTypeIconProps } from '@fluentui/react-file-type-icons';
import { Adb, AdbFeatures, AdbSubprocess, AdbSubprocessNoneProtocol, AdbSubprocessOptions, AdbSubprocessWaitResult, AdbSyncEntry, ADB_SYNC_MAX_PACKET_SIZE, ChunkStream, DecodeUtf8Stream, GatherStringStream, LinuxFileType } from "@yume-chan/adb";
import { action, makeAutoObservable, observable, runInAction } from "mobx";
import { asyncEffect } from "../utils/asyncEffect";
import { createFileStream, ProgressStream, saveFile } from "../utils/file";
import { formatSize } from "../utils/formatSize";
import Icons from "../utils/icons";
import resolvePath, { extname } from "../utils/resolvePath";
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


function compareCaseInsensitively(a: string, b: string)
{
    const result = a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase());
    if (result !== 0)
    {
        return result;
    } else
    {
        return a.localeCompare(b);
    }
}


async function spawnAndWait(command: string | string[], options?: Partial<AdbSubprocessOptions>): Promise<AdbSubprocessWaitResult>
{
    const shell_pty = new AdbSubprocess(GlobalState.device as Adb);

    const shell = await shell_pty.shell(command, options);

    const stdout = new GatherStringStream();
    const stderr = new GatherStringStream();

    const [, , exitCode] = await Promise.all([
        shell.stdout
            .pipeThrough(new DecodeUtf8Stream())
            .pipeTo(stdout),
        shell.stderr
            .pipeThrough(new DecodeUtf8Stream())
            .pipeTo(stderr),
        shell.exit
    ]);

    return {
        stdout: stdout.result,
        stderr: stderr.result,
        exitCode,
    };
}

async function spawnAndWaitLegacy(command: string | string[]): Promise<string>
{
    const { stdout } = await spawnAndWait(
        command,
        { protocols: [AdbSubprocessNoneProtocol] }
    );
    return stdout;
}

class FileManager
{
    constructor()
    {
        makeAutoObservable(this, {
            items: observable.shallow,
            loadFiles: false
        });
    }


    public items: ListItem[] = [];


    public path: string = '/';


    public sortKey: keyof ListItem = 'name';


    public sortDescending: boolean = false;


    public selectedItems: ListItem[] = [];


    public loading: boolean = false;


    public contextMenuTarget: MouseEvent | undefined = undefined;


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
                            ({ iconName } = getFileTypeIconProps({ extension: extname(item.name) }));
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


    get breadcrumbItems(): IBreadcrumbItem[]
    {
        const list: IBreadcrumbItem[] = this.path.split('/').filter(segment => segment !== '').map((segment, _, paths) =>
        {
            return {
                key: '/' + segment,
                text: segment,
                onClick: (_, item) =>
                {
                    if (!item) return;

                    const target_index = paths.indexOf(segment);

                    if (target_index === -1) return;

                    runInAction(() =>
                    {
                        this.path = '/' + paths.slice(0, target_index + 1).join('/');
                    });

                    this.loadFiles();
                }
            };
        });


        list.unshift({
            key: "/",
            text: "Device",
            onClick: action((_, item) =>
            {
                this.path = item!.key;

                this.loadFiles();
            })
        });

        list.at(-1)!.isCurrentItem = true;

        delete list.at(-1)?.onClick;

        return list;
    }


    get sortedList(): ListItem[]
    {
        const list = this.items.slice();
        list.sort((a, b) =>
        {
            const aIsFile = a.type === LinuxFileType.File ? 1 : 0;
            const bIsFile = b.type === LinuxFileType.File ? 1 : 0;

            let result: number;
            if (aIsFile !== bIsFile)
            {
                result = aIsFile - bIsFile;
            } else
            {
                const aSortKey = a[this.sortKey]!;
                const bSortKey = b[this.sortKey]!;

                if (aSortKey === bSortKey)
                {
                    result = compareCaseInsensitively(a.name!, b.name!);
                } else if (typeof aSortKey === 'string')
                {
                    result = compareCaseInsensitively(aSortKey, bSortKey as string);
                } else
                {
                    result = aSortKey < bSortKey ? -1 : 1;
                }
            }

            if (this.sortDescending)
            {
                result *= -1;
            }
            return result;
        });
        return list;
    }

    get menuItems(): IContextualMenuItem[]
    {
        if (this.selectedItems.length === 0) return [];

        const result: IContextualMenuItem[] = [];

        if (this.selectedItems[0].type === LinuxFileType.File)
        {
            result.push({
                key: "Download",
                text: "Download",
                iconProps: {
                    iconName: Icons.DownloadDocumentIcon
                },
                onClick: () =>
                {
                    (async () =>
                    {
                        const sync = await GlobalState.device!.sync();

                        try
                        {
                            const item = this.selectedItems[0];

                            const item_path = resolvePath(this.path, item.name);

                            //Download file
                            //@ts-ignore
                            await sync.read(item_path).pipeTo(saveFile(item.name, Number(item.size)));
                            console.log(saveFile(item.name, Number(item.size)));
                        } catch (e: any)
                        {
                            GlobalState.showErrorDialog(e.message);
                        } finally
                        {
                            sync.dispose();
                        }

                    })();
                }
            });
        }

        result.push({
            key: "Delete",
            text: "Delete",
            iconProps: {
                iconName: Icons.Delete
            },
            onClick: (e) =>
            {
                e?.stopPropagation();

                (async () =>
                {
                    for (const item of this.selectedItems)
                    {
                        try
                        {
                            const output = await spawnAndWaitLegacy(`sudo rm -rf ${resolvePath(this.path, item.name)}`);
                            if (output)
                            {
                                GlobalState.showErrorDialog(output);
                            }
                        } catch (e: any)
                        {
                            console.error(e);

                            GlobalState.showErrorDialog(e.message);

                        } finally
                        {
                            this.loadFiles();
                        }
                    }
                })();

                return false;
            }
        });

        return result;
    }

    public loadFiles = asyncEffect(async (signal) =>
    {
        if (!GlobalState.device) return;

        runInAction(() => this.loading = true);

        const sync = await GlobalState.device.sync();

        const items: ListItem[] = [];

        const linkItems: AdbSyncEntry[] = [];

        const intervalId = setInterval(() =>
        {
            if (signal.aborted)
            {
                return;
            }

            runInAction(() => this.items = items.slice());
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

                if (!await sync.isDirectory(resolvePath(this.path, entry.name)))
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
            if (!signal.aborted)
            {
                runInAction(() => this.loading = false);
            }

            clearInterval(intervalId);

            sync.dispose();
        }
    });

    uploading = false;
    uploadPath: string | undefined = undefined;
    uploadedSize = 0;
    uploadTotalSize = 0;
    debouncedUploadedSize = 0;
    uploadSpeed = 0;
    public uploadFiles = async (file: File) =>
    {
        const sync = await GlobalState.device!.sync();

        try
        {
            const item_path = resolvePath(this.path, file.name);

            runInAction(() =>
            {
                this.uploading = true;
                this.uploadPath = file.name;
                this.uploadedSize = 0;
                this.uploadTotalSize = file.size;
                this.debouncedUploadedSize = 0;
                this.uploadSpeed = 0;
            });

            const intervalId = setInterval(action(() =>
            {
                this.uploadSpeed = this.uploadedSize - this.debouncedUploadedSize;
                this.debouncedUploadedSize = this.uploadedSize;
            }), 1000);

            try
            {
                await createFileStream(file)
                    .pipeThrough(new ChunkStream(ADB_SYNC_MAX_PACKET_SIZE))
                    .pipeThrough(new ProgressStream(action((uploaded) =>
                    {
                        this.uploadedSize = uploaded;
                    })))
                    .pipeTo(sync.write(
                        item_path,
                        (LinuxFileType.File << 12) | 0o666,
                        file.lastModified / 1000,
                    ));

                runInAction(() =>
                {
                    this.uploadSpeed = this.uploadedSize - this.debouncedUploadedSize;
                    this.debouncedUploadedSize = this.uploadedSize;
                });
            } finally
            {
                clearInterval(intervalId);
            }

        } catch (e: any)
        {
            GlobalState.showErrorDialog(e.message);
        } finally
        {
            sync.dispose();
            this.loadFiles();
            runInAction(() => this.uploading = false);
        }
    };
}


export const fileManager = new FileManager();
