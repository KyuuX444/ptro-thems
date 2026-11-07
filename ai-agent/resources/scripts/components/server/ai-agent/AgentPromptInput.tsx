import React, { useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPaperPlane,
    faTerminal,
    faCopy,
    faCheck,
    faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import Spinner from '@/components/elements/Spinner';
import { PromptHistoryItem } from './agent.types';

interface Props {
    history: PromptHistoryItem[];
    promptLoading: boolean;
    disabled: boolean;
    onSendPrompt: (prompt: string) => Promise<string>;
}

export const AgentPromptInput: React.FC<Props> = ({
    history,
    promptLoading,
    disabled,
    onSendPrompt,
}) => {
    const [promptText, setPromptText] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = async () => {
        if (!promptText.trim() || promptLoading || disabled) return;
        const text = promptText;
        setPromptText('');
        await onSendPrompt(text);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className={'bg-[#141414] border border-[#292929] rounded-xl p-5 shadow-sm mb-6'}>
                        <div className={'flex items-center justify-between pb-3.5 mb-4 border-b border-[#292929]'}>
                <div>
                    <h3 className={'text-sm font-semibold text-[#F5F5F5] tracking-tight'}>
                        Antigravity CLI Interaction
                    </h3>
                    <p className={'text-xs text-[#929292] mt-0.5'}>
                        Execute instructions, code generation, and diagnostic workflows directly in the container.
                    </p>
                </div>
            </div>

                        <div className={'relative bg-[#0E0E0E] border border-[#292929] rounded-xl p-3 focus-within:border-[#555555] transition-colors mb-4'}>
                <textarea
                    ref={textareaRef}
                    rows={2}
                    placeholder={
                        disabled
                            ? 'Agent is currently stopped. Start the agent or container host to send instructions.'
                            : 'Enter prompt or instruction for Antigravity AI... (Enter to send, Shift + Enter for newline)'
                    }
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled || promptLoading}
                    className={'w-full bg-transparent text-xs text-[#F5F5F5] placeholder-[#555555] outline-none resize-none font-mono leading-relaxed'}
                />

                <div className={'flex items-center justify-between pt-2 border-t border-[#1C1C1C] mt-2'}>
                    <div className={'text-[11px] text-[#555555] font-mono'}>
                        <span>Shift + Enter: Newline</span>
                    </div>

                    <button
                        type={'button'}
                        onClick={handleSend}
                        disabled={disabled || promptLoading || !promptText.trim()}
                        className={`
                            h-8 px-4 inline-flex items-center space-x-1.5 rounded-lg text-xs font-semibold transition-all
                            ${
                                promptText.trim() && !disabled && !promptLoading
                                    ? 'bg-[#F0F0F0] text-[#090909] hover:bg-white active:bg-[#E5E5E5] shadow-sm'
                                    : 'bg-[#1C1C1C] text-[#555555] cursor-not-allowed'
                            }
                        `}
                    >
                        {promptLoading ? (
                            <Spinner size={'small'} />
                        ) : (
                            <>
                                <span>Send</span>
                                <FontAwesomeIcon icon={faPaperPlane} className={'text-[10px]'} />
                            </>
                        )}
                    </button>
                </div>
            </div>

                        {history.length > 0 && (
                <div className={'space-y-3 max-h-96 overflow-y-auto pr-1'}>
                    {history.map((item) => (
                        <div
                            key={item.id}
                            className={'bg-[#0E0E0E] border border-[#262626] rounded-xl p-4 font-mono text-xs'}
                        >
                                                        <div className={'flex items-start space-x-2.5 pb-2.5 border-b border-[#1C1C1C]'}>
                                <span className={'text-[#CCCCCC] font-bold select-none'}>&gt;</span>
                                <span className={'text-[#F5F5F5] font-medium leading-relaxed whitespace-pre-wrap flex-1'}>
                                    {item.prompt}
                                </span>
                                <span className={'text-[10px] text-[#555555] select-none flex-shrink-0'}>
                                    {item.timestamp.toLocaleTimeString()}
                                </span>
                            </div>

                                                        <div className={'pt-3 relative group'}>
                                <div className={'flex items-center justify-between pb-1.5 text-[10px] text-[#666666]'}>
                                    <span className={'flex items-center space-x-1'}>
                                        <FontAwesomeIcon icon={faTerminal} className={'text-[9px]'} />
                                        <span>Antigravity Output</span>
                                    </span>

                                    <button
                                        type={'button'}
                                        onClick={() => handleCopy(item.id, item.output)}
                                        className={'text-[#666666] hover:text-white px-2 py-0.5 rounded hover:bg-[#1A1A1A] transition-colors'}
                                        title={'Copy output'}
                                    >
                                        <FontAwesomeIcon
                                            icon={copiedId === item.id ? faCheck : faCopy}
                                            className={'mr-1 text-[9px]'}
                                        />
                                        <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                                    </button>
                                </div>

                                <div
                                    className={`
                                        p-3 rounded-lg bg-[#090909] border border-[#1E1E1E] whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto
                                        ${item.isError ? 'text-[#FF8888]' : 'text-[#CCCCCC]'}
                                    `}
                                >
                                    {item.isError && (
                                        <FontAwesomeIcon icon={faExclamationTriangle} className={'mr-1.5 text-[#E53E3E]'} />
                                    )}
                                    {item.output}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AgentPromptInput;
