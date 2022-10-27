import { initializeFileTypeIcons } from '@fluentui/react-file-type-icons';
import Aside from '../components/Aside';
import { ErrorDialog } from '../components/ErrorDialog';
import FileList from '../components/FileList';
import { register as registerIcons } from "../utils/icons";

registerIcons();

initializeFileTypeIcons();


export default function App()
{


    return (
        <div className="adb-demo">
            <Aside />
            <FileList />
            <ErrorDialog />
        </div>
    );
}
