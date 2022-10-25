import { useCallback, useEffect } from "react";


export const ADB_DEVICE_FILTER: USBDeviceFilter = {
    classCode: 0xFF,
    subclassCode: 0x42,
    protocolCode: 1,
};


export default function App()
{

    const requestUSBDevice = useCallback(async () =>
    {
        try
        {
            const device = await navigator.usb.requestDevice({ filters: [{ vendorId: 0x2341 }] });;

            console.log(device);

        } catch (e)
        {
            if (e instanceof DOMException && e.name === 'NotFoundError')
            {
                console.error(e);
                return undefined;
            }
            throw e;
        }


    }, []);

    useEffect(() =>
    {
        if (!navigator.usb) return;

        // requestUSBDevice();

    }, []);

    return (
        <div>

        </div>
    );
}
