import { DefaultButton, INavLinkGroup, Label, Nav, PrimaryButton, Stack } from "@fluentui/react";
import { Adb, AdbBackend, AdbPacketData, AdbPacketInit, InspectStream, pipeFrom } from "@yume-chan/adb";
import AdbWebUsbBackend from "@yume-chan/adb-backend-webusb";
import AdbWebCredentialStore from "@yume-chan/adb-credential-web";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { useCallback, useState } from "react";
import { fileManager } from "../stores/fileManager";
import { GlobalState } from "../stores/state";
import Icons from "../utils/icons";


const CredentialStore = new AdbWebCredentialStore();

const ROUTES: INavLinkGroup[] = [
    {
        links: [
            {
                url: '/',
                name: "Files",
                icon: Icons.Folder,
            },
            {
                url: "/shell",
                name: 'Shell',
                icon: Icons.WindowConsole,
            }
        ]
    }
];

function Aside()
{
    const [selectedBackend, setSelectedBackend] = useState<AdbBackend | undefined>();


    const addUsbBackend = useCallback(async () =>
    {
        const backend = await AdbWebUsbBackend.requestDevice();

        setSelectedBackend(backend);
    }, []);


    const connect = useCallback(async () =>
    {
        if (!selectedBackend) return;

        let readable: ReadableStream<AdbPacketData>;
        let writable: WritableStream<AdbPacketInit>;

        try
        {
            const streams = await selectedBackend.connect();

            readable = streams.readable.pipeThrough(new InspectStream(() => { }));

            writable = pipeFrom(streams.writable, new InspectStream(() => { }));

        } catch (e: any)
        {
            if (e instanceof DOMException)
            {
                GlobalState.showErrorDialog(e.message);
            }
            return;
        }

        async function dispose()
        {
            try { readable.cancel(); } catch { }
            try { await writable.close(); } catch { }
        }

        try
        {
            const device = await Adb.authenticate(
                //@ts-ignore
                { readable, writable },
                CredentialStore,
                undefined
            );

            device.disconnected.then(async () =>
            {
                await dispose();
            }).catch(async () =>
            {
                await dispose();
            });

            GlobalState.setDevice(selectedBackend, device);

            runInAction(() => fileManager.path = '/');

            fileManager.loadFiles();

        } catch (e)
        {
            if (e instanceof DOMException)
            {
                GlobalState.showErrorDialog(e.message);
            }
            await dispose();
        }

    }, [selectedBackend]);


    const renderDeviceName = useCallback(() =>
    {
        if (!selectedBackend) return '未连接设备';

        return selectedBackend.name;
    }, [selectedBackend]);


    return (
        <Stack className="aside-nav">
            <Label>
                设备名称:{renderDeviceName()}
            </Label>
            {
                !GlobalState.device ? (
                    <Stack horizontal tokens={{ childrenGap: 5 }}>
                        <DefaultButton styles={{ root: { width: '100%' } }} onClick={addUsbBackend} text='获取设备' />
                        <PrimaryButton styles={{ root: { width: '100%' } }} onClick={connect} disabled={!selectedBackend} text='连接' />
                    </Stack>
                ) : (
                    <DefaultButton
                        iconProps={{ iconName: 'PlugDisconnected' }}
                        onClick={GlobalState.disconnectDevice} text='断开连接'
                    />
                )
            }
            <Stack grow styles={{
                root: {
                    marginTop: '10px',
                    paddingTop: '10px',
                    borderTop: '1px solid rgb(243, 242, 241)'
                }
            }}>
                <Nav groups={ROUTES} />
            </Stack>
        </Stack>
    );
}


export default observer(Aside);
