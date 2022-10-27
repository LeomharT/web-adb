import { Adb, AdbBackend } from "@yume-chan/adb";
import { action, makeAutoObservable, runInAction } from "mobx";


class GlobalStateType
{
    constructor()
    {
        makeAutoObservable(this, {
            disconnectDevice: action
        });
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
            });
        } catch (e: any)
        {
            console.error(e.message);
        }
    };
}



export const GlobalState = new GlobalStateType();
