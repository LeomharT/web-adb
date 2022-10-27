import { DefaultButton, DetailsListLayoutMode, MarqueeSelection, Selection, ShimmeredDetailsList, StackItem } from "@fluentui/react";
import { useConst } from '@fluentui/react-hooks';
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import { fileManager, ListItem } from "../stores/fileManager";
import { GlobalState } from '../stores/state';


function FileList()
{
    const selection = useConst(() => new Selection({
        onSelectionChanged()
        {
            runInAction(() =>
            {
                fileManager.selectedItems = selection.getItems() as ListItem[];
            });
        }
    }));

    return (
        <div className="file-list">
            <DefaultButton disabled={!GlobalState.device} onClick={fileManager.loadFiles}>
                加载文件
            </DefaultButton>
            <StackItem grow styles={{
                root: {
                    margin: '-8px -16px -16px -16px',
                    padding: '8px 16px 16px 16px',
                    overflowY: 'auto',
                }
            }}>
                <MarqueeSelection selection={selection}>
                    <ShimmeredDetailsList
                        items={fileManager.items}
                        columns={fileManager.columns}
                        selection={selection}
                        layoutMode={DetailsListLayoutMode.justified}
                        usePageCache
                        useReducedRowRenderer
                    />
                </MarqueeSelection>

            </StackItem>
        </div>
    );
}

export default observer(FileList);
