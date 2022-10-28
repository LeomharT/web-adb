import { Breadcrumb, CommandBarButton, concatStyleSets, ContextualMenu, ContextualMenuItem, DetailsListLayoutMode, Dialog, DirectionalHint, IDetailsHeaderProps, IRenderFunction, MarqueeSelection, ProgressIndicator, ShimmeredDetailsList, Stack, StackItem } from "@fluentui/react";
import { useConst } from '@fluentui/react-hooks';
import { Selection, SelectionMode } from '@fluentui/react/lib/DetailsList';
import { AdbSyncEntry, LinuxFileType } from "@yume-chan/adb";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import { useCallback } from "react";
import { fileManager, ListItem } from "../stores/fileManager";
import { GlobalState } from "../stores/state";
import { formatSpeed, pickFile } from "../utils/file";
import Icons from "../utils/icons";
import resolvePath from "../utils/resolvePath";

const renderDetailsHeader: IRenderFunction<IDetailsHeaderProps> = (props?, defaultRender?) =>
{
    if (!props || !defaultRender)
    {
        return null;
    }

    return defaultRender({
        ...props,
        styles: concatStyleSets(props.styles, { root: { paddingTop: 0 } })
    });
};

const UploadDialog = observer(() =>
{
    return (
        <Dialog
            hidden={!fileManager.uploading}
            dialogContentProps={{
                title: 'Uploading...',
                subText: fileManager.uploadPath
            }}
        >
            <ProgressIndicator
                description={formatSpeed(fileManager.debouncedUploadedSize, fileManager.uploadTotalSize, fileManager.uploadSpeed)}
                percentComplete={fileManager.uploadedSize / fileManager.uploadTotalSize}
            />
        </Dialog>
    );
});

function FileList()
{
    const selection = useConst(() => new Selection({
        onSelectionChanged()
        {
            runInAction(() =>
            {
                fileManager.selectedItems = selection.getSelection() as ListItem[];
            });
        },
    }));


    //点击文件时
    const handleItemInvoked = useCallback((item: AdbSyncEntry) =>
    {
        switch (item.type)
        {
            case LinuxFileType.Link:
            case LinuxFileType.Directory: {
                runInAction(() =>
                {
                    fileManager.path = resolvePath(fileManager.path, item.name);
                });

                fileManager.loadFiles();

                break;
            }
            case LinuxFileType.File:

                //TODO:Preview image

                break;
        }


    }, []);


    const showContextMenu = useCallback((_?: AdbSyncEntry, __?: number, e?: Event) =>
    {
        if (!e) return false;

        runInAction(() =>
        {
            fileManager.contextMenuTarget = e as MouseEvent;
        });

        return false;
    }, []);


    const dismissContextMenu = useCallback(() =>
    {
        runInAction(() =>
        {
            fileManager.contextMenuTarget = undefined;
        });
    }, []);


    const handleOnuploadFiles = useCallback(async (e: React.MouseEvent<any>) =>
    {
        e.stopPropagation();

        const files = await pickFile({ multiple: true });
        for (let i = 0; i < files.length; i++)
        {
            const file = files.item(i)!;
            await fileManager.uploadFiles(file);
        }
    }, []);


    return (
        <div className="file-list">
            <Stack horizontal styles={{
                root: {
                    height: '45px', flexShrink: 0,
                    borderBottom: '1px solid rgb(243, 242, 241)'
                }
            }}>
                <CommandBarButton
                    text="Upload"
                    disabled={!GlobalState.device}
                    iconProps={{ iconName: Icons.CloudArrowUp, styles: { root: { color: "#0078d4" } } }}
                    onClick={handleOnuploadFiles}
                />
            </Stack>

            <Breadcrumb items={fileManager.breadcrumbItems} />

            <StackItem grow styles={{
                root: {
                    padding: '8px 16px 16px 16px',
                    overflowY: 'auto',
                }
            }}>
                <MarqueeSelection selection={selection}>
                    <ShimmeredDetailsList
                        selectionMode={SelectionMode.multiple}
                        items={fileManager.sortedList}
                        setKey={fileManager.path}
                        columns={fileManager.columns}
                        selection={selection}
                        layoutMode={DetailsListLayoutMode.justified}
                        enableShimmer={fileManager.loading && fileManager.items.length === 0}
                        onItemInvoked={handleItemInvoked}
                        onRenderDetailsHeader={renderDetailsHeader}
                        onItemContextMenu={showContextMenu}
                        usePageCache
                        useReducedRowRenderer
                    />
                </MarqueeSelection>
            </StackItem>

            <ContextualMenu
                items={fileManager.menuItems}
                hidden={!fileManager.contextMenuTarget}
                directionalHint={DirectionalHint.bottomAutoEdge}
                target={fileManager.contextMenuTarget}
                onDismiss={dismissContextMenu}
                contextualMenuItemAs={props => <ContextualMenuItem {...props} hasIcons={true} />}
            />

            <UploadDialog />
        </div>
    );
}

export default observer(FileList);
