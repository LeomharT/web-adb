import { Dialog, DialogFooter, DialogType, PrimaryButton } from "@fluentui/react";
import { observer } from "mobx-react";
import { GlobalState } from "../stores/state";

export const ErrorDialog = observer(() =>
{
    return (
        <Dialog
            hidden={!GlobalState.errorDialogVisible}
            dialogContentProps={{
                type: DialogType.normal,
                title: 'Error',
                subText: GlobalState.errorDialogMessage,
            }}>
            <DialogFooter>
                <PrimaryButton text="OK" onClick={GlobalState.closeErrorDialog} />
            </DialogFooter>
        </Dialog>
    );

});
