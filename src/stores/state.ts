import { Adb, AdbBackend } from "@yume-chan/adb";
import { makeAutoObservable, runInAction } from "mobx";
import { fileManager } from "./fileManager";


class GlobalStateType
{
    constructor()
    {
        makeAutoObservable(this);
    }

    backend: AdbBackend | undefined = undefined;

    device: Adb | undefined = undefined;

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
            console.error(e.message);
        }
    };
}



export const GlobalState = new GlobalStateType();
