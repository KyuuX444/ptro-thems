import React from 'react';

interface Props {
    isRunning: boolean;
    pid?: number | null;
    isError?: boolean;
}

export const AgentStatusBadge: React.FC<Props> = ({ isRunning, pid, isError }) => {
    if (isError) {
        return (
            <span className={'inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#1F1212] border border-[#4A2020] text-[#FF9999]'}>
                <span className={'w-2 h-2 rounded-full bg-[#E53E3E]'} />
                <span>ERROR</span>
            </span>
        );
    }

    if (isRunning) {
        return (
            <span className={'inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#121A14] border border-[#23422A] text-[#A3E635]'}>
                <span className={'w-2 h-2 rounded-full bg-[#84CC16] animate-pulse'} />
                <span>RUNNING</span>
                {pid && <span className={'text-[10px] text-[#6B9080] font-mono ml-1'}>#{pid}</span>}
            </span>
        );
    }

    return (
        <span className={'inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#181818] border border-[#292929] text-[#929292]'}>
            <span className={'w-2 h-2 rounded-full bg-[#555555]'} />
            <span>STOPPED</span>
        </span>
    );
};

export default AgentStatusBadge;
