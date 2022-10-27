import { Adb, AdbBackend } from "@yume-chan/adb";
import { makeAutoObservable, runInAction } from "mobx";
import { fileManager } from "./fileManager";


class GlobalStateType
{
    constructor()
    {
        makeAutoObservable(this);
    }

    public backend: AdbBackend | undefined = undefined;

    public device: Adb | undefined = undefined;


    public errorDialogVisible: boolean = false;


    public errorDialogMessage: string = '';


    public setDevice = (backend: AdbBackend, device: Adb) =>
    {
        this.backend = backend;
        this.device = device;
    };


    public disconnectDevice = async () =>
    {
        if (!this.device) return;

        try
        {
            await this.device.close();

            runInAction(() =>
            {
                this.device = undefined;
                this.backend = undefined;

                if (!fileManager) return;
                fileManager.items.length = 0;
            });
        } catch (e: any)
        {
            GlobalState.showErrorDialog(e.message);
        }
    };


    public showErrorDialog = (message: Error | string) =>
    {
        this.errorDialogVisible = true;

        if (message instanceof Error)
        {
            this.errorDialogMessage = message.stack || message.message;
        } else
        {
            this.errorDialogMessage = message;
        }
    };


    public closeErrorDialog = () => this.errorDialogVisible = false;


}



export const GlobalState = new GlobalStateType();
