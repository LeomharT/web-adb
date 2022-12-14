import { DefaultButton, IComponentAsProps, INavButtonProps, INavLinkGroup, Label, Nav, PrimaryButton, Stack } from "@fluentui/react";
import { Adb, AdbBackend, AdbPacketData, AdbPacketInit, InspectStream, pipeFrom } from "@yume-chan/adb";
import AdbWebUsbBackend from "@yume-chan/adb-backend-webusb";
import AdbWebCredentialStore from "@yume-chan/adb-credential-web";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
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


function NavLink({ link, defaultRender: DefaultRender, ...props }: IComponentAsProps<INavButtonProps>)
{
    if (!link)
    {
        return null;
    }

    return (
        <Link to={link.url}>
            <DefaultRender {...props} />
        </Link>
    );
}

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
            GlobalState.showWaitDialog();

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

            GlobalState.closeWaitDialog();

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
        if (!selectedBackend) return '???????????????';

        return selectedBackend.name;
    }, [selectedBackend]);


    return (
        <Stack className="aside-nav">
            <Label>
                ????????????:{renderDeviceName()}
            </Label>
            {
                !GlobalState.device ? (
                    <Stack horizontal tokens={{ childrenGap: 5 }}>
                        <DefaultButton styles={{ root: { width: '100%' } }} onClick={addUsbBackend} text='????????????' />
                        <PrimaryButton styles={{ root: { width: '100%' } }} onClick={connect} disabled={!selectedBackend} text='??????' />
                    </Stack>
                ) : (
                    <DefaultButton
                        iconProps={{ iconName: 'PlugDisconnected' }}
                        onClick={GlobalState.disconnectDevice} text='????????????'
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
                <Nav
                    groups={ROUTES}
                    linkAs={NavLink}
                />
            </Stack>
        </Stack>
    );
}


export default observer(Aside);
