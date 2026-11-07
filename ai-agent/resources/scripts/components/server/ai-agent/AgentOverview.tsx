import React from 'react';
import AgentStatusBadge from './AgentStatusBadge';
import { AIAgentStatusResponse } from './agent.types';

interface Props {
    status: AIAgentStatusResponse | null;
}

export const AgentOverview: React.FC<Props> = ({ status }) => {
    const isRunning = !!status?.agent_running;
    const isContainerOnline = !!status?.container_running;
    const isConnected = status?.auth_status === 'connected';

    return (
        <div className={'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6'}>
                        <div className={'bg-[#141414] p-4 rounded-xl border border-[#292929] shadow-sm flex flex-col justify-between'}>
                <span className={'text-[11px] font-semibold uppercase tracking-wider text-[#929292]'}>
                    Agent Status
                </span>
                <div className={'mt-2.5 flex items-center'}>
                    <AgentStatusBadge
                        isRunning={isRunning}
                        pid={status?.runtime_info.pid}
                        isError={!isContainerOnline && isRunning}
                    />
                </div>
            </div>

                        <div className={'bg-[#141414] p-4 rounded-xl border border-[#292929] shadow-sm flex flex-col justify-between'}>
                <span className={'text-[11px] font-semibold uppercase tracking-wider text-[#929292]'}>
                    CLI Engine
                </span>
                <div className={'mt-2.5 flex items-center space-x-2'}>
                    <span className={'text-sm font-semibold text-[#F5F5F5] tracking-tight'}>Google Antigravity</span>
                    <span className={'text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1E1E1E] border border-[#292929] text-[#CCCCCC]'}>
                        agy
                    </span>
                </div>
            </div>

                        <div className={'bg-[#141414] p-4 rounded-xl border border-[#292929] shadow-sm flex flex-col justify-between'}>
                <span className={'text-[11px] font-semibold uppercase tracking-wider text-[#929292]'}>
                    Google Account
                </span>
                <div className={'mt-2.5 min-w-0'}>
                    {isConnected ? (
                        <div className={'flex items-center space-x-1.5'}>
                            <span className={'w-2 h-2 rounded-full bg-[#84CC16] flex-shrink-0'} />
                            <span className={'text-xs font-medium text-[#F5F5F5] truncate'} title={status?.connected_account || ''}>
                                {status?.connected_account}
                            </span>
                        </div>
                    ) : (
                        <span className={'text-xs text-[#666666] italic'}>Not Connected</span>
                    )}
                </div>
            </div>

                        <div className={'bg-[#141414] p-4 rounded-xl border border-[#292929] shadow-sm flex flex-col justify-between'}>
                <span className={'text-[11px] font-semibold uppercase tracking-wider text-[#929292]'}>
                    Container Host
                </span>
                <div className={'mt-2.5 flex items-center space-x-2'}>
                    <span className={`w-2 h-2 rounded-full ${isContainerOnline ? 'bg-[#84CC16]' : 'bg-[#E53E3E]'}`} />
                    <span className={`text-xs font-semibold ${isContainerOnline ? 'text-[#F5F5F5]' : 'text-[#FF8888]'}`}>
                        {isContainerOnline ? 'Online / Ready' : 'Offline'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default AgentOverview;
