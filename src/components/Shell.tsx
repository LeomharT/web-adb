import { AnimationClassNames, IconButton, IStackProps, SearchBox, Stack, StackItem } from "@fluentui/react";
import { makeStyles, shorthands } from "@griffel/react";
import { action, autorun, makeAutoObservable, runInAction } from "mobx";
import { useCallback, useEffect } from "react";
import { ISearchOptions } from "xterm-addon-search";
import 'xterm/css/xterm.css';
import { GlobalState } from "../stores/state";
import Icons from "../utils/icons";
import { ResizeObserver } from "./ResizeObserver";
import { AdbTerminal } from "./Terminal";


const useClasses = makeStyles({
    count: {
        ...shorthands.padding('0', '8px'),
    }
});

const UpIconProps = { iconName: Icons.ChevronUp };
const DownIconProps = { iconName: Icons.ChevronDown };


export const DefaultStackProps: IStackProps = {
    tokens: { childrenGap: 8, padding: 16 },
    verticalFill: true,
};

export const RouteStackProps: IStackProps = {
    ...DefaultStackProps,
    className: AnimationClassNames.slideUpIn10!,
    styles: { root: { overflow: 'auto', position: 'relative' } },
    disableShrink: true,
};

const terminal: AdbTerminal = new AdbTerminal();


const SEARCH_OPTIONS: ISearchOptions = {
    decorations: {
        matchBackground: '#232422',
        matchBorder: '#555753',
        matchOverviewRuler: '#555753',
        activeMatchBackground: '#ef2929',
        activeMatchBorder: '#ffffff',
        activeMatchColorOverviewRuler: '#ef2929'
    }
};


const state = makeAutoObservable({
    visible: false,
    index: undefined as number | undefined,
    count: undefined as number | undefined,
    setVisible(value: boolean)
    {
        this.visible = value;
    },

    searchKeyword: '',
    setSearchKeyword(value: string)
    {
        this.searchKeyword = value;
        terminal!.searchAddon.findNext(value, {
            ...SEARCH_OPTIONS,
            incremental: true,
        });
    },

    searchPrevious()
    {
        terminal!.searchAddon.findPrevious(this.searchKeyword, SEARCH_OPTIONS);
    },
    searchNext()
    {
        terminal!.searchAddon.findNext(this.searchKeyword, SEARCH_OPTIONS);
    }
}, {
    searchPrevious: action.bound,
    searchNext: action.bound,
});


if (terminal)
{
    terminal.searchAddon.onDidChangeResults((e) =>
    {
        console.log(e);
        runInAction(() =>
        {
            if (e)
            {
                state.index = e.resultIndex;
                state.count = e.resultCount;
            } else
            {
                state.index = undefined;
                state.count = undefined;
            }
        });
    });
}


autorun(() =>
{
    if (!terminal)
    {
        return;
    }

    if (!GlobalState.device)
    {
        terminal.socket = undefined;
        return;
    }

    if (!terminal.socket && state.visible)
    {
        GlobalState.device.subprocess.shell()
            .then(action(shell =>
            {
                console.log(shell);
                terminal!.socket = shell;
            }), (e) =>
            {
                GlobalState.showErrorDialog(e);
            });
    }
});

export default function Shell()
{
    const classes = useClasses();

    const handleSearchKeywordChange = useCallback((e: any, value?: string) =>
    {
        state.setSearchKeyword(value ?? '');
    }, []);

    const handleResize = useCallback(() =>
    {
        terminal!.fit();
    }, []);


    const handleContainerRef = useCallback((container: HTMLDivElement | null) =>
    {
        if (container)
        {
            terminal.setContainer(container);
        }
    }, []);

    useEffect(() =>
    {
        state.setVisible(true);
        return () =>
        {
            state.setVisible(false);
        };
    }, []);

    return (
        <Stack {...RouteStackProps} styles={{ root: { width: "100%" } }}>
            <StackItem>
                <Stack horizontal>
                    <StackItem grow>
                        <SearchBox
                            placeholder="Find"
                            value={state.searchKeyword}
                            onChange={handleSearchKeywordChange}
                            onSearch={state.searchNext}
                        />
                    </StackItem>
                    {state.count === 0 ? (
                        <StackItem className={classes.count} align="center">
                            No results
                        </StackItem>
                    ) : state.count !== undefined ? (
                        <StackItem className={classes.count} align='center'>
                            {state.index! + 1} of {state.count}
                        </StackItem>
                    ) : null}
                    <StackItem>
                        <IconButton
                            disabled={!state.searchKeyword}
                            iconProps={UpIconProps}
                            onClick={state.searchPrevious}
                        />
                    </StackItem>
                    <StackItem>
                        <IconButton
                            disabled={!state.searchKeyword}
                            iconProps={DownIconProps}
                            onClick={state.searchNext}
                        />
                    </StackItem>
                </Stack>
            </StackItem>
            <StackItem grow styles={{ root: { position: 'relative', minHeight: 0 } }}>
                <ResizeObserver onResize={handleResize} />
                <div
                    className="shell-terminal"
                    ref={handleContainerRef}
                    style={{ height: '100%' }}>
                </div>
            </StackItem>
        </Stack>
    );
}
