import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync, faTerminal, faTrashAlt } from '@fortawesome/free-solid-svg-icons';

interface Props {
    logs: string[];
    actionLoading: boolean;
    onRefresh: () => Promise<void>;
}

export const AgentLogViewer: React.FC<Props> = ({ logs, actionLoading, onRefresh }) => {
    const [autoScroll, setAutoScroll] = useState(true);
    const [localCleared, setLocalCleared] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const displayedLogs = localCleared ? [] : logs;

    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [displayedLogs, autoScroll]);

    const formatLogLine = (line: string) => {
        let levelColor = 'text-[#CCCCCC]';
        const lower = line.toLowerCase();

        if (lower.includes('error') || lower.includes('fail') || lower.includes('fatal')) {
            levelColor = 'text-[#F87171] font-semibold';
        } else if (lower.includes('warn')) {
            levelColor = 'text-[#FBBF24]';
        } else if (lower.includes('success') || lower.includes('connected') || lower.includes('running') || lower.includes('listening')) {
            levelColor = 'text-[#84CC16]';
        } else if (lower.includes('info')) {
            levelColor = 'text-[#93C5FD]';
        }

        return <span className={levelColor}>{line}</span>;
    };

    return (
        <div className={'bg-[#141414] border border-[#292929] rounded-xl p-5 shadow-sm'}>
                        <div className={'flex items-center justify-between pb-3.5 mb-3 border-b border-[#292929]'}>
                <div className={'flex items-center space-x-2'}>
                    <FontAwesomeIcon icon={faTerminal} className={'text-xs text-[#888888]'} />
                    <h3 className={'text-sm font-semibold text-[#F5F5F5] tracking-tight'}>
                        Antigravity CLI Terminal Logs
                    </h3>
                    <span className={'text-[10px] text-[#666666] font-mono'}>agent.log</span>
                </div>

                <div className={'flex items-center space-x-2'}>
                                        <button
                        type={'button'}
                        onClick={() => setAutoScroll(!autoScroll)}
                        className={`
                            px-2.5 py-1 rounded-md text-[11px] font-mono border transition-colors
                            ${
                                autoScroll
                                    ? 'bg-[#1E1E1E] border-[#404040] text-white'
                                    : 'bg-[#141414] border-[#262626] text-[#666666]'
                            }
                        `}
                        title={'Auto scroll to latest log entry'}
                    >
                        Auto-scroll
                    </button>

                                        <button
                        type={'button'}
                        onClick={() => setLocalCleared(true)}
                        className={'px-2.5 py-1 rounded-md text-[11px] text-[#888888] hover:text-white bg-[#141414] border border-[#262626] hover:bg-[#1E1E1E] transition-colors'}
                        title={'Clear log display'}
                    >
                        <FontAwesomeIcon icon={faTrashAlt} className={'text-[10px] mr-1'} />
                        Clear
                    </button>

                                        <button
                        type={'button'}
                        disabled={actionLoading}
                        onClick={() => {
                            setLocalCleared(false);
                            onRefresh();
                        }}
                        className={'px-2.5 py-1 rounded-md text-[11px] text-[#CCCCCC] hover:text-white bg-[#181818] border border-[#292929] hover:bg-[#222222] transition-colors'}
                        title={'Refresh logs'}
                    >
                        <FontAwesomeIcon icon={faSync} className={'text-[10px] mr-1'} />
                        Refresh
                    </button>
                </div>
            </div>

                        <div
                ref={scrollRef}
                className={'bg-[#0A0A0A] border border-[#222222] rounded-xl p-4 font-mono text-xs max-h-72 overflow-y-auto leading-relaxed shadow-inner select-text'}
            >
                {displayedLogs && displayedLogs.length > 0 ? (
                    displayedLogs.map((line, idx) => (
                        <div key={idx} className={'py-0.5 break-all flex items-start space-x-2'}>
                            <span className={'text-[10px] text-[#444444] select-none font-mono w-6 text-right'}>
                                {idx + 1}
                            </span>
                            <div className={'flex-1'}>{formatLogLine(line)}</div>
                        </div>
                    ))
                ) : (
                    <div className={'text-[#555555] italic text-center py-8'}>
                        No terminal log entries available.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentLogViewer;
