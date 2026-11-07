import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faStop, faSync } from '@fortawesome/free-solid-svg-icons';
import { Dialog } from '@/components/elements/dialog';
import { AIAgentStatusResponse } from './agent.types';

interface Props {
    status: AIAgentStatusResponse | null;
    actionLoading: boolean;
    onPower: (action: 'start' | 'stop' | 'restart') => Promise<void>;
    onConfigChange: (key: string, value: any) => Promise<void>;
}

export const AgentControls: React.FC<Props> = ({
    status,
    actionLoading,
    onPower,
    onConfigChange,
}) => {
    const [stopConfirmOpen, setStopConfirmOpen] = useState(false);
    const isRunning = !!status?.agent_running;
    const isContainerOnline = !!status?.container_running;

    const handleStopClick = () => {
        setStopConfirmOpen(true);
    };

    return (
        <div className={'bg-[#141414] border border-[#292929] rounded-xl p-5 shadow-sm flex flex-col justify-between'}>
            <div>
                                <div className={'flex items-center justify-between pb-3.5 mb-4 border-b border-[#292929]'}>
                    <div>
                        <h3 className={'text-sm font-semibold text-[#F5F5F5] tracking-tight'}>
                            Agent Controls
                        </h3>
                        <p className={'text-xs text-[#929292] mt-0.5'}>
                            Manage daemon lifecycle and persistent behavior.
                        </p>
                    </div>
                </div>

                                <div className={'grid grid-cols-3 gap-2.5 mb-4'}>
                    <button
                        type={'button'}
                        disabled={actionLoading || isRunning || !isContainerOnline}
                        onClick={() => onPower('start')}
                        className={`
                            h-9 inline-flex items-center justify-center space-x-2 rounded-lg text-xs font-semibold transition-all duration-150
                            ${
                                !isRunning && isContainerOnline && !actionLoading
                                    ? 'bg-[#F0F0F0] text-[#090909] hover:bg-white active:bg-[#E5E5E5] shadow-sm'
                                    : 'bg-[#1C1C1C] text-[#555555] border border-[#262626] cursor-not-allowed'
                            }
                        `}
                    >
                        <FontAwesomeIcon icon={faPlay} className={'text-[10px]'} />
                        <span>Start</span>
                    </button>

                    <button
                        type={'button'}
                        disabled={actionLoading || !isRunning}
                        onClick={handleStopClick}
                        className={`
                            h-9 inline-flex items-center justify-center space-x-2 rounded-lg text-xs font-semibold transition-all duration-150
                            ${
                                isRunning && !actionLoading
                                    ? 'bg-[#1E1212] border border-[#4A2020] text-[#FF9999] hover:bg-[#2A1616]'
                                    : 'bg-[#1C1C1C] text-[#555555] border border-[#262626] cursor-not-allowed'
                            }
                        `}
                    >
                        <FontAwesomeIcon icon={faStop} className={'text-[10px]'} />
                        <span>Stop</span>
                    </button>

                    <button
                        type={'button'}
                        disabled={actionLoading || !isContainerOnline}
                        onClick={() => onPower('restart')}
                        className={`
                            h-9 inline-flex items-center justify-center space-x-2 rounded-lg text-xs font-medium transition-all duration-150
                            ${
                                isContainerOnline && !actionLoading
                                    ? 'bg-[#181818] border border-[#292929] text-[#E5E5E5] hover:bg-[#222222] hover:border-[#404040]'
                                    : 'bg-[#1C1C1C] text-[#555555] border border-[#262626] cursor-not-allowed'
                            }
                        `}
                    >
                        <FontAwesomeIcon icon={faSync} className={'text-[10px]'} />
                        <span>Restart</span>
                    </button>
                </div>

                                <div className={'grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#202020]'}>
                                        <div className={'bg-[#0E0E0E] p-3 rounded-lg border border-[#262626] flex items-center justify-between'}>
                        <div>
                            <span className={'text-xs font-medium text-[#F5F5F5] block'}>Auto Restart</span>
                            <span className={'text-[10px] text-[#777777]'}>Respawn agent on unexpected exit</span>
                        </div>
                        <select
                            value={status?.config.auto_restart ? '1' : '0'}
                            onChange={(e) => onConfigChange('auto_restart', e.target.value === '1')}
                            disabled={actionLoading}
                            className={'bg-[#181818] border border-[#292929] rounded-md px-2 py-1 text-xs text-[#E5E5E5] outline-none'}
                        >
                            <option value={'1'}>Enabled</option>
                            <option value={'0'}>Disabled</option>
                        </select>
                    </div>

                                        <div className={'bg-[#0E0E0E] p-3 rounded-lg border border-[#262626] flex items-center justify-between'}>
                        <div>
                            <span className={'text-xs font-medium text-[#F5F5F5] block'}>Save Session</span>
                            <span className={'text-[10px] text-[#777777]'}>Retain history across server reboots</span>
                        </div>
                        <select
                            value={status?.config.session_persistence ? '1' : '0'}
                            onChange={(e) => onConfigChange('session_persistence', e.target.value === '1')}
                            disabled={actionLoading}
                            className={'bg-[#181818] border border-[#292929] rounded-md px-2 py-1 text-xs text-[#E5E5E5] outline-none'}
                        >
                            <option value={'1'}>Enabled</option>
                            <option value={'0'}>Disabled</option>
                        </select>
                    </div>
                </div>
            </div>

                        <Dialog.Confirm
                open={stopConfirmOpen}
                title={'Stop AI Agent Daemon'}
                confirm={'Stop Agent'}
                onClose={() => setStopConfirmOpen(false)}
                onConfirmed={() => {
                    setStopConfirmOpen(false);
                    onPower('stop');
                }}
            >
                <p className={'text-xs text-[#CCCCCC]'}>
                    Are you sure you want to stop the AI Agent? Background analysis and automated execution will be paused until restarted.
                </p>
            </Dialog.Confirm>
        </div>
    );
};

export default AgentControls;
