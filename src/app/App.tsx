import AdbWebCredentialStore from "@yume-chan/adb-credential-web";
import { observer } from "mobx-react";
import Aside from "../components/Aside";
import FileList from "../components/FileList";
import { register as registerIcons } from "../utils/icons";

const CredentialStore = new AdbWebCredentialStore();

registerIcons();

function App()
{

    return (
        <div className="adb-demo">
            <Aside />

            <FileList />
        </div>
    );
}


export default observer(App);
