import { Dialog, ProgressIndicator } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import { GlobalState } from "../stores/state";

export const WaitingDialog = observer(() =>
{
    return (
        <Dialog
            hidden={!GlobalState.waitDialogVisible}
            dialogContentProps={{
                title: "Waiting....",
                subText: 'Please authorize the connection on your device'
            }}
        >
            <ProgressIndicator label={null} />

        </Dialog>
    );
});
