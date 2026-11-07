import React from 'react';
import { ServerContext } from '@/state/server';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Spinner from '@/components/elements/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheckCircle,
    faExclamationTriangle,
    faRobot,
} from '@fortawesome/free-solid-svg-icons';
import { useAIAgent } from './useAIAgent';
import AgentOverview from './AgentOverview';
import AgentControls from './AgentControls';
import AgentAuthentication from './AgentAuthentication';
import AgentPromptInput from './AgentPromptInput';
import AgentLogViewer from './AgentLogViewer';

export const AIAgentContainer = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const {
        status,
        loading,
        actionLoading,
        error,
        successMessage,
        authUrl,
        promptLoading,
        history,
        refreshStatus,
        handlePower,
        handleStartAuth,
        handleSubmitCode,
        handleCancelAuth,
        handleDisconnect,
        handleConfigChange,
        handleSendPrompt,
    } = useAIAgent(uuid);

    if (loading && !status) {
        return (
            <ServerContentBlock title={'AI Agent'}>
                <div className={'w-full flex items-center justify-center py-24'}>
                    <Spinner size={'large'} />
                </div>
            </ServerContentBlock>
        );
    }

    const isRunning = !!status?.agent_running;
    const isContainerOnline = !!status?.container_running;

    return (
        <ServerContentBlock title={'AI Agent'}>
                        <div className={'flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-[#292929]'}>
                <div className={'flex items-center space-x-3'}>
                    <div className={'w-9 h-9 rounded-xl bg-[#141414] border border-[#292929] flex items-center justify-center text-[#E5E5E5]'}>
                        <FontAwesomeIcon icon={faRobot} className={'text-sm'} />
                    </div>
                    <div>
                        <h1 className={'text-xl font-bold tracking-tight text-[#F5F5F5]'}>
                            AI Agent
                        </h1>
                        <p className={'text-xs text-[#929292] mt-0.5'}>
                            Google Antigravity autonomous developer daemon and interactive coding assistant.
                        </p>
                    </div>
                </div>
            </div>

                        {error && (
                <div className={'mb-5 p-3.5 rounded-xl bg-[#1E1212] border border-[#4A2020] text-[#FF9999] text-xs flex items-center space-x-3'}>
                    <FontAwesomeIcon icon={faExclamationTriangle} className={'text-sm text-[#E53E3E] flex-shrink-0'} />
                    <span className={'flex-1 leading-relaxed'}>{error}</span>
                </div>
            )}
            {successMessage && (
                <div className={'mb-5 p-3.5 rounded-xl bg-[#121A14] border border-[#23422A] text-[#A3E635] text-xs flex items-center space-x-3'}>
                    <FontAwesomeIcon icon={faCheckCircle} className={'text-sm text-[#84CC16] flex-shrink-0'} />
                    <span className={'flex-1 leading-relaxed'}>{successMessage}</span>
                </div>
            )}

                        <AgentOverview status={status} />

                        <div className={'grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6'}>
                <AgentControls
                    status={status}
                    actionLoading={actionLoading}
                    onPower={handlePower}
                    onConfigChange={handleConfigChange}
                />

                <AgentAuthentication
                    status={status}
                    actionLoading={actionLoading}
                    authUrl={authUrl}
                    onStartAuth={handleStartAuth}
                    onSubmitCode={handleSubmitCode}
                    onCancelAuth={handleCancelAuth}
                    onDisconnect={handleDisconnect}
                />
            </div>

                        <AgentPromptInput
                history={history}
                promptLoading={promptLoading}
                disabled={!isContainerOnline || !isRunning}
                onSendPrompt={handleSendPrompt}
            />

                        <AgentLogViewer
                logs={status?.logs || []}
                actionLoading={actionLoading}
                onRefresh={() => refreshStatus(false)}
            />
        </ServerContentBlock>
    );
};

export default AIAgentContainer;
