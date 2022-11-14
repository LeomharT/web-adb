import { initializeFileTypeIcons } from '@fluentui/react-file-type-icons';
import { observer } from 'mobx-react';
import { Route, Routes } from 'react-router';
import Aside from '../components/Aside';
import { ErrorDialog } from '../components/ErrorDialog';
import FileList from '../components/FileList';
import Shell from '../components/Shell';
import { WaitingDialog } from '../components/WaitingDialog';
import { register as registerIcons } from "../utils/icons";

registerIcons();

initializeFileTypeIcons();


function App()
{


    return (
        <div className="adb-demo">
            <Aside />
            {
                <Routes>
                    <Route path='/' element={<FileList />} />
                    <Route path='/shell' element={<Shell />} />
                </Routes>
            }
            <ErrorDialog />
            <WaitingDialog />
        </div>
    );
}

export default observer(App);
