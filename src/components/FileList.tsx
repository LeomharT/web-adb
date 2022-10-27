import { Breadcrumb, concatStyleSets, ContextualMenu, ContextualMenuItem, DefaultButton, DetailsListLayoutMode, DirectionalHint, IDetailsHeaderProps, IRenderFunction, MarqueeSelection, ShimmeredDetailsList, StackItem } from "@fluentui/react";
import { useConst } from '@fluentui/react-hooks';
import { Selection, SelectionMode } from '@fluentui/react/lib/DetailsList';
import { AdbSyncEntry, LinuxFileType } from "@yume-chan/adb";
import { action, runInAction } from "mobx";
import { observer } from "mobx-react";
import { useCallback } from "react";
import { fileManager, ListItem } from "../stores/fileManager";
import { GlobalState } from '../stores/state';
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


    const dismissContextMenu = useCallback(action(() =>
    {
        fileManager.contextMenuTarget = undefined;
    }), []);


    return (
        <div className="file-list">
            <DefaultButton disabled={!GlobalState.device} onClick={fileManager.loadFiles}>
                加载文件
            </DefaultButton>

            <Breadcrumb items={fileManager.breadcrumbItems} />

            <StackItem grow styles={{
                root: {
                    margin: '-8px -16px -16px -16px',
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
        </div>
    );
}

export default observer(FileList);
