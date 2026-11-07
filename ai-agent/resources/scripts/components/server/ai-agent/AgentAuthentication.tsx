import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheckCircle,
    faExternalLinkAlt,
    faKey,
    faLock,
    faSignInAlt,
    faUnlink,
    faUserCheck,
} from '@fortawesome/free-solid-svg-icons';
import { Dialog } from '@/components/elements/dialog';
import { AIAgentStatusResponse } from './agent.types';
import Spinner from '@/components/elements/Spinner';

interface Props {
    status: AIAgentStatusResponse | null;
    actionLoading: boolean;
    authUrl: string | null;
    onStartAuth: () => Promise<any>;
    onSubmitCode: (code: string) => Promise<boolean>;
    onCancelAuth: () => Promise<void>;
    onDisconnect: () => Promise<void>;
    onSaveToken?: (token: string) => Promise<void>;
}

export const AgentAuthentication: React.FC<Props> = ({
    status,
    actionLoading,
    authUrl,
    onStartAuth,
    onSubmitCode,
    onCancelAuth,
    onDisconnect,
}) => {
    const [authCode, setAuthCode] = useState('');
    const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);

    const isConnected = status?.auth_status === 'connected';
    const isPendingAuth = status?.auth_status === 'pending_code' || !!authUrl;

    const handleSubmit = async () => {
        const success = await onSubmitCode(authCode);
        if (success) {
            setAuthCode('');
        }
    };

    return (
        <div className={'bg-[#141414] border border-[#292929] rounded-xl p-5 shadow-sm flex flex-col justify-between'}>
            <div>
                                <div className={'flex items-center justify-between pb-3.5 mb-4 border-b border-[#292929]'}>
                    <div>
                        <h3 className={'text-sm font-semibold text-[#F5F5F5] tracking-tight'}>
                            Google Antigravity Authentication
                        </h3>
                        <p className={'text-xs text-[#929292] mt-0.5'}>
                            Official device OAuth connection for Antigravity AI engine.
                        </p>
                    </div>

                    {isConnected && (
                        <span className={'inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#121A14] border border-[#23422A] text-[#A3E635]'}>
                            <FontAwesomeIcon icon={faCheckCircle} className={'text-[10px]'} />
                            <span>Authenticated</span>
                        </span>
                    )}
                </div>

                                {isConnected ? (
                    <div className={'p-4 bg-[#0E0E0E] rounded-xl border border-[#262626] flex items-center justify-between'}>
                        <div className={'flex items-center space-x-3.5 min-w-0 mr-4'}>
                            <div className={'w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#292929] flex items-center justify-center text-[#E5E5E5] flex-shrink-0'}>
                                <FontAwesomeIcon icon={faUserCheck} className={'text-sm'} />
                            </div>
                            <div className={'min-w-0 flex-1'}>
                                <p className={'text-xs font-semibold text-[#F5F5F5] truncate'}>
                                    {status?.connected_account || 'Google Account'}
                                </p>
                                <p className={'text-[11px] text-[#84CC16] flex items-center mt-0.5'}>
                                    Active OAuth Token stored securely
                                </p>
                            </div>
                        </div>

                        <button
                            type={'button'}
                            disabled={actionLoading}
                            onClick={() => setDisconnectModalOpen(true)}
                            className={'px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1E1212] border border-[#4A2020] text-[#FF9999] hover:bg-[#2A1616] transition-colors flex-shrink-0'}
                        >
                            <FontAwesomeIcon icon={faUnlink} className={'mr-1.5 text-[10px]'} />
                            Disconnect
                        </button>
                    </div>
                ) : (
                    <div>
                        {!isPendingAuth ? (
                            <div className={'space-y-4'}>
                                <div className={'p-3.5 rounded-lg bg-[#0E0E0E] border border-[#262626] flex items-start space-x-3 text-xs text-[#929292]'}>
                                    <FontAwesomeIcon icon={faLock} className={'text-sm text-[#777777] mt-0.5 flex-shrink-0'} />
                                    <p className={'leading-relaxed'}>
                                        Authenticate using your Google Account to authorize Antigravity CLI. No raw passwords or secret tokens are exposed.
                                    </p>
                                </div>

                                <button
                                    type={'button'}
                                    disabled={actionLoading}
                                    onClick={onStartAuth}
                                    className={'w-full h-10 inline-flex items-center justify-center space-x-2 rounded-lg text-xs font-semibold bg-[#F0F0F0] text-[#090909] hover:bg-white active:bg-[#E5E5E5] shadow-sm transition-all'}
                                >
                                    {actionLoading ? (
                                        <Spinner size={'small'} />
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faSignInAlt} className={'text-xs'} />
                                            <span>Connect Google Account</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className={'space-y-3.5 p-4 rounded-xl bg-[#0E0E0E] border border-[#333333]'}>
                                                                <div className={'flex items-center justify-between pb-3 border-b border-[#222222]'}>
                                    <div>
                                        <span className={'text-xs font-semibold text-[#F5F5F5] block'}>
                                            Step 1: Google Authorization
                                        </span>
                                        <span className={'text-[11px] text-[#888888]'}>
                                            Click the link below to grant permissions in your browser.
                                        </span>
                                    </div>
                                    {authUrl && (
                                        <a
                                            href={authUrl}
                                            target={'_blank'}
                                            rel={'noreferrer'}
                                            className={'inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F0F0F0] text-[#090909] hover:bg-white transition-colors flex-shrink-0'}
                                        >
                                            <span>Open Link</span>
                                            <FontAwesomeIcon icon={faExternalLinkAlt} className={'text-[10px]'} />
                                        </a>
                                    )}
                                </div>

                                                                <div>
                                    <label className={'text-xs font-semibold text-[#F5F5F5] block mb-1.5'}>
                                        Step 2: Enter Authorization Code
                                    </label>
                                    <input
                                        type={'text'}
                                        placeholder={'Paste Google authorization code here (e.g. 4/0A...)'}
                                        value={authCode}
                                        onChange={(e) => setAuthCode(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                        className={'w-full bg-[#141414] border border-[#292929] rounded-lg px-3 py-2 text-xs font-mono text-[#F5F5F5] placeholder-[#555555] outline-none focus:border-[#666666] mb-3'}
                                    />

                                    <div className={'flex items-center space-x-2'}>
                                        <button
                                            type={'button'}
                                            disabled={actionLoading || !authCode.trim()}
                                            onClick={handleSubmit}
                                            className={`
                                                flex-1 h-9 inline-flex items-center justify-center space-x-2 rounded-lg text-xs font-medium transition-all
                                                ${
                                                    authCode.trim() && !actionLoading
                                                        ? 'bg-[#F0F0F0] text-[#090909] hover:bg-white'
                                                        : 'bg-[#1C1C1C] text-[#555555] cursor-not-allowed'
                                                }
                                            `}
                                        >
                                            {actionLoading ? (
                                                <Spinner size={'small'} />
                                            ) : (
                                                <>
                                                    <FontAwesomeIcon icon={faKey} className={'text-xs'} />
                                                    <span>Verify &amp; Link</span>
                                                </>
                                            )}
                                        </button>

                                        <button
                                            type={'button'}
                                            disabled={actionLoading}
                                            onClick={onCancelAuth}
                                            className={'px-3 h-9 rounded-lg text-xs font-medium bg-[#181818] border border-[#292929] text-[#CCCCCC] hover:bg-[#222222] transition-colors'}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

                        <Dialog.Confirm
                open={disconnectModalOpen}
                title={'Disconnect Google Account'}
                confirm={'Disconnect'}
                onClose={() => setDisconnectModalOpen(false)}
                onConfirmed={() => {
                    setDisconnectModalOpen(false);
                    onDisconnect();
                }}
            >
                <p className={'text-xs text-[#CCCCCC]'}>
                    Are you sure you want to disconnect this Google Account? Antigravity CLI will not be able to interact with Google AI models until re-authorized.
                </p>
            </Dialog.Confirm>
        </div>
    );
};

export default AgentAuthentication;
