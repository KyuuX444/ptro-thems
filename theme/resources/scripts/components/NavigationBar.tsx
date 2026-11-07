import * as React from 'react';
import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCogs,
    faLayerGroup,
    faSignOutAlt,
    faTimes,
    faTerminal,
    faFolder,
    faDatabase,
    faClock,
    faUsers,
    faArchive,
    faNetworkWired,
    faSlidersH,
    faHistory,
    faRobot,
    faShieldAlt,
    faUserShield,
    faExternalLinkAlt,
    faServer,
    faKey,
} from '@fortawesome/free-solid-svg-icons';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import SearchContainer from '@/components/dashboard/search/SearchContainer';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import http from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import Avatar from '@/components/Avatar';

const RightNavigation = styled.div`
    & > a,
    & > button,
    & > .navigation-link {
        ${tw`flex items-center h-full no-underline text-[#929292] px-3.5 cursor-pointer transition-all duration-150 relative`};

        &:active,
        &:hover {
            ${tw`text-[#F5F5F5] bg-[#141414]`};
        }

        &:active,
        &:hover,
        &.active {
            ${tw`text-[#F5F5F5]`};
            &::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 2px;
                background-color: #F0F0F0;
            }
        }
    }
`;

export default () => {
    const name = useStoreState((state: ApplicationStore) => state.settings.data!.name);
    const user = useStoreState((state: ApplicationStore) => state.user.data);
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data?.rootAdmin || false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const location = useLocation();
    const serverMatch = location.pathname.match(/^\/server\/([^/]+)/);
    const serverId = serverMatch ? serverMatch[1] : null;

    const onTriggerLogout = () => {
        setIsLoggingOut(true);
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    return (
        <>
                        <div className={'w-full bg-[#101010] border-b border-[#292929] shadow-sm overflow-x-auto sticky top-0 z-40'}>
                <SpinnerOverlay visible={isLoggingOut} />
                <div className={'mx-auto w-full flex items-center h-[3.25rem] max-w-[1200px] px-4'}>
                                        <div id={'logo'} className={'flex items-center space-x-3 flex-1'}>
                                                <button
                            onClick={() => setSidebarOpen(true)}
                            className={'group p-2 text-[#CCCCCC] hover:text-white hover:bg-[#181818] rounded-lg flex flex-col justify-center items-center w-8 h-8 space-y-1 transition-all mr-2'}
                            aria-label={'Toggle Navigation Menu'}
                            title={'Menu'}
                        >
                            <span className={'w-4 h-[2px] bg-[#CCCCCC] group-hover:bg-white rounded-full transition-colors'} />
                            <span className={'w-4 h-[2px] bg-[#CCCCCC] group-hover:bg-white rounded-full transition-colors'} />
                            <span className={'w-4 h-[2px] bg-[#CCCCCC] group-hover:bg-white rounded-full transition-colors'} />
                        </button>

                        <Link
                            to={'/'}
                            className={
                                'flex items-center space-x-2.5 text-base font-semibold tracking-tight text-[#F5F5F5] hover:text-white transition-colors duration-150 no-underline'
                            }
                        >
                            <div className={'w-7 h-7 rounded-lg bg-[#141414] border border-[#292929] flex items-center justify-center'}>
                                <img
                                    src={'/favicons/safari-pinned-tab.svg'}
                                    alt={'Logo'}
                                    className={'w-3.5 h-3.5 opacity-90 invert'}
                                />
                            </div>
                            <span>{name}</span>
                        </Link>
                    </div>

                                        <RightNavigation className={'flex h-full items-center justify-end'}>
                        <SearchContainer />
                    </RightNavigation>
                </div>
            </div>

                        {sidebarOpen && (
                <div
                    className={'fixed inset-0 bg-black/75 backdrop-blur-xs z-50 transition-opacity duration-200'}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div
                className={`
                    fixed inset-y-0 left-0 w-72 bg-[#101010] border-r border-[#292929] z-50 flex flex-col shadow-2xl transform transition-transform duration-200 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                                <div className={'h-14 px-4 border-b border-[#292929] flex items-center justify-between bg-[#141414]'}>
                    <div className={'flex items-center space-x-2.5'}>
                        <div className={'w-7 h-7 rounded-lg bg-[#090909] border border-[#292929] flex items-center justify-center'}>
                            <img
                                src={'/favicons/safari-pinned-tab.svg'}
                                alt={'Logo'}
                                className={'w-3.5 h-3.5 opacity-90 invert'}
                            />
                        </div>
                        <span className={'text-sm font-semibold text-white tracking-tight'}>{name}</span>
                    </div>

                    <button
                        onClick={() => setSidebarOpen(false)}
                        className={'w-7 h-7 rounded-lg flex items-center justify-center text-[#888888] hover:text-white hover:bg-[#1E1E1E] transition-colors'}
                    >
                        <FontAwesomeIcon icon={faTimes} className={'text-xs'} />
                    </button>
                </div>

                                {user && (
                    <Link
                        to={'/account'}
                        onClick={() => setSidebarOpen(false)}
                        className={'block p-4 border-b border-[#202020] bg-[#0E0E0E] hover:bg-[#141414] transition-colors no-underline group'}
                    >
                        <div className={'flex items-center space-x-3'}>
                            <div className={'w-9 h-9 rounded-full bg-[#181818] border border-[#292929] group-hover:border-[#404040] flex items-center justify-center overflow-hidden flex-shrink-0'}>
                                <Avatar.User />
                            </div>
                            <div className={'min-w-0 flex-1'}>
                                <div className={'flex items-center justify-between'}>
                                    <span className={'text-xs font-semibold text-white truncate'}>{user.username}</span>
                                    <span
                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                            user.rootAdmin
                                                ? 'bg-[#F0F0F0] text-[#090909]'
                                                : 'bg-[#1E1E1E] text-[#AAAAAA] border border-[#292929]'
                                        }`}
                                    >
                                        {user.rootAdmin ? 'Admin' : 'User'}
                                    </span>
                                </div>
                                <p className={'text-[11px] text-[#666666] truncate mt-0.5'}>{user.email}</p>
                            </div>
                        </div>
                    </Link>
                )}

                                <div className={'flex-1 overflow-y-auto py-3 px-3 space-y-4 text-xs font-medium select-none'}>
                                        {serverId && (
                        <div>
                            <div className={'px-3 mb-2 flex items-center justify-between'}>
                                <span className={'text-[10px] font-bold uppercase tracking-wider text-[#666666]'}>
                                    Server Controls
                                </span>
                                <span className={'text-[10px] text-[#555555] font-mono'}>{serverId}</span>
                            </div>
                            <div className={'space-y-0.5'}>
                                <NavLink
                                    to={`/server/${serverId}`}
                                    exact
                                    onClick={() => setSidebarOpen(false)}
                                    className={'flex items-center space-x-3 px-3 py-2 rounded-lg text-[#929292] hover:text-white hover:bg-[#181818] transition-colors'}
                                    activeClassName={'bg-[#1C1C1C] text-white font-semibold border-l-2 border-white'}
                                >
                                    <FontAwesomeIcon icon={faTerminal} className={'w-3.5 text-xs text-[#888888]'} />
                                    <span>Console</span>
                                </NavLink>
                                <NavLink
                                    to={`/server/${serverId}/files`}
                                    onClick={() => setSidebarOpen(false)}
                                    className={'flex items-center space-x-3 px-3 py-2 rounded-lg text-[#929292] hover:text-white hover:bg-[#181818] transition-colors'}
                                    activeClassName={'bg-[#1C1C1C] text-white font-semibold border-l-2 border-white'}
                                >
                                    <FontAwesomeIcon icon={faFolder} className={'w-3.5 text-xs text-[#888888]'} />
                                    <span>Files</span>
                                </NavLink>
                                <NavLink
                                    to={`/server/${serverId}/databases`}
                                    onClick={() => setSidebarOpen(false)}
                                    className={'flex items-center space-x-3 px-3 py-2 rounded-lg text-[#929292] hover:text-white hover:bg-[#181818] transition-colors'}
                                    activeClassName={'bg-[#1C1C1C] text-white font-semibold border-l-2 border-white'}
                                >
                                    <FontAwesomeIcon icon={faDatabase} className={'w-3.5 text-xs text-[#888888]'} />
                                    <span>Databases</span>
                                </NavLink>
                                <NavLink
                                    to={`/server/${serverId}/schedules`}
                                    onClick={() => setSidebarOpen(false)}
                                    className={'flex items-center space-x-3 px-3 py-2 rounded-lg text-[#929292] hover:text-white hover:bg-[#181818] transition-colors'}
                                    activeClassName={'bg-[#1C1C1C] text-white font-semibold border-l-2 border-white'}
                                >
                                    <FontAwesomeIcon icon={faClock} className={'w-3.5 text-xs text-[#888888]'} />
                                    <span>Schedules</span>
                                </NavLink>
                                <NavLink
                                    to={`/server/${serverId}/users`}
                                    onClick={() => setSidebarOpen(false)}
                                    className={'flex items-center space-x-3 px-3 py-2 rounded-lg text-[#929292] hover:text-white hover:bg-[#181818] transition-colors'}
                                    activeClassName={'bg-[#1C1C1C] text-white font-semibold border-l-2 border-white'}
                                >
                                    <FontAwesomeIcon icon={faUsers} className={'w-3.5 text-xs text-[#888888]'} />
                                    <span>Users</span>
                                </NavLink>
                                <NavLink
                                    to={`/server/${serverId}/backups`}
                                    onClick={() => setSidebarOpen(false)}
                                    className={'flex items-center space-x-3 px-3 py-2 rounded-lg text-[#929292] hover:text-white hover:bg-[#181818] transition-colors'}
                                    activeClassName={'bg-[#1C1C1C] text-white font-semibold border-l-2 border-white'}
                                >
                                    <FontAwesomeIcon icon={faArchive} className={'w-3.5 text-xs text-[#888888]'} />
                                    <span>Backups</span>
                                </NavLink>
                                <NavLink
                                    to={`/server/${serverId}/network`}
                                    onClick={() => setSidebarOpen(false)}
                                    className={'flex items-center space-x-3 px-3 py-2 rounded-lg text-[#929292] hover:text-white hover:bg-[#181818] transition-colors'}
                                    activeClassName={'bg-[#1C1C1C] text-white font-semibold border-l-2 border-white'}
                                >
                                    <FontAwesomeIcon icon={faNetworkWired} className={'w-3.5 text-xs text-[#888888]'} />
                                    <span>Network</span>
                                </NavLink>
                                <NavLink
                                    to={`/server/${serverId}/startup`}
                                    onClick={() => setSidebarOpen(false)}
                                    className={'flex items-center space-x-3 px-3 py-2 rounded-lg text-[#929292] hover:text-white hover:bg-[#181818] transition-colors'}
                                    activeClassName={'bg-[#1C1C1C] text-white font-semibold border-l-2 border-white'}
                                >
                                    <FontAwesomeIcon icon={faSlidersH} className={'w-3.5 text-xs text-[#888888]'} />
                                    <span>Startup</span>
                                </NavLink>
                                <NavLink
                                    to={`/server/${serverId}/settings`}
                                    onClick={() => setSidebarOpen(false)}
                                    className={'flex items-center space-x-3 px-3 py-2 rounded-lg text-[#929292] hover:text-white hover:bg-[#181818] transition-colors'}
                                    activeClassName={'bg-[#1C1C1C] text-white font-semibold border-l-2 border-white'}
                                >
                                    <FontAwesomeIcon icon={faCogs} className={'w-3.5 text-xs text-[#888888]'} />
                                    <span>Settings</span>
                                </NavLink>
                                <NavLink
                                    to={`/server/${serverId}/activity`}
                                    onClick={() => setSidebarOpen(false)}
                                    className={'flex items-center space-x-3 px-3 py-2 rounded-lg text-[#929292] hover:text-white hover:bg-[#181818] transition-colors'}
                                    activeClassName={'bg-[#1C1C1C] text-white font-semibold border-l-2 border-white'}
                                >
                                    <FontAwesomeIcon icon={faHistory} className={'w-3.5 text-xs text-[#888888]'} />
                                    <span>Activity</span>
                                </NavLink>
                                <NavLink
                                    to={`/server/${serverId}/ai-agent`}
                                    onClick={() => setSidebarOpen(false)}
                                    className={'flex items-center space-x-3 px-3 py-2 rounded-lg text-[#929292] hover:text-white hover:bg-[#181818] transition-colors'}
                                    activeClassName={'bg-[#1C1C1C] text-white font-semibold border-l-2 border-white'}
                                >
                                    <FontAwesomeIcon icon={faRobot} className={'w-3.5 text-xs text-[#888888]'} />
                                    <span>AI Agent</span>
                                </NavLink>
                            </div>
                        </div>
                    )}

                                        <div>
                        <div className={'px-3 mb-2'}>
                            <span className={'text-[10px] font-bold uppercase tracking-wider text-[#666666]'}>
                                Main Navigation
                            </span>
                        </div>
                        <div className={'space-y-0.5'}>
                            <NavLink
                                to={'/'}
                                exact
                                onClick={() => setSidebarOpen(false)}
                                className={'flex items-center space-x-3 px-3 py-2 rounded-lg text-[#929292] hover:text-white hover:bg-[#181818] transition-colors'}
                                activeClassName={'bg-[#1C1C1C] text-white font-semibold border-l-2 border-white'}
                            >
                                <FontAwesomeIcon icon={faLayerGroup} className={'w-3.5 text-xs text-[#888888]'} />
                                <span>Dashboard</span>
                            </NavLink>
                            <NavLink
                                to={'/account'}
                                exact
                                onClick={() => setSidebarOpen(false)}
                                className={'flex items-center space-x-3 px-3 py-2 rounded-lg text-[#929292] hover:text-white hover:bg-[#181818] transition-colors'}
                                activeClassName={'bg-[#1C1C1C] text-white font-semibold border-l-2 border-white'}
                            >
                                <FontAwesomeIcon icon={faUserShield} className={'w-3.5 text-xs text-[#888888]'} />
                                <span>Account Overview</span>
                            </NavLink>
                            <NavLink
                                to={'/account/api'}
                                exact
                                onClick={() => setSidebarOpen(false)}
                                className={'flex items-center space-x-3 px-3 py-2 rounded-lg text-[#929292] hover:text-white hover:bg-[#181818] transition-colors'}
                                activeClassName={'bg-[#1C1C1C] text-white font-semibold border-l-2 border-white'}
                            >
                                <FontAwesomeIcon icon={faKey} className={'w-3.5 text-xs text-[#888888]'} />
                                <span>API Credentials</span>
                            </NavLink>
                            <NavLink
                                to={'/account/ssh'}
                                exact
                                onClick={() => setSidebarOpen(false)}
                                className={'flex items-center space-x-3 px-3 py-2 rounded-lg text-[#929292] hover:text-white hover:bg-[#181818] transition-colors'}
                                activeClassName={'bg-[#1C1C1C] text-white font-semibold border-l-2 border-white'}
                            >
                                <FontAwesomeIcon icon={faKey} className={'w-3.5 text-xs text-[#888888]'} />
                                <span>SSH Keys</span>
                            </NavLink>
                            <NavLink
                                to={'/account/activity'}
                                exact
                                onClick={() => setSidebarOpen(false)}
                                className={'flex items-center space-x-3 px-3 py-2 rounded-lg text-[#929292] hover:text-white hover:bg-[#181818] transition-colors'}
                                activeClassName={'bg-[#1C1C1C] text-white font-semibold border-l-2 border-white'}
                            >
                                <FontAwesomeIcon icon={faHistory} className={'w-3.5 text-xs text-[#888888]'} />
                                <span>Account Activity</span>
                            </NavLink>

                            {rootAdmin && (
                                <a
                                    href={'/admin'}
                                    className={'flex items-center justify-between px-3 py-2 rounded-lg text-[#929292] hover:text-white hover:bg-[#181818] transition-colors'}
                                >
                                    <div className={'flex items-center space-x-3'}>
                                        <FontAwesomeIcon icon={faShieldAlt} className={'w-3.5 text-xs text-[#888888]'} />
                                        <span>Admin Control Panel</span>
                                    </div>
                                    <FontAwesomeIcon icon={faExternalLinkAlt} className={'text-[10px] text-[#555555]'} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                                <div className={'p-3 border-t border-[#292929] bg-[#141414] flex items-center justify-between'}>
                    <button
                        onClick={() => {
                            setSidebarOpen(false);
                            onTriggerLogout();
                        }}
                        className={'flex items-center space-x-2 text-xs text-[#999999] hover:text-red-400 transition-colors px-2.5 py-1.5 rounded hover:bg-[#1E1E1E] font-medium'}
                    >
                        <FontAwesomeIcon icon={faSignOutAlt} className={'text-xs'} />
                        <span>Sign Out</span>
                    </button>
                    <span className={'text-[10px] text-[#555555] font-mono'}>v1.15.2</span>
                </div>
            </div>
        </>
    );
};
