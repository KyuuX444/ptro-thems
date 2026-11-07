import { useCallback, useEffect, useState } from 'react';
import {
    AIAgentStatusResponse,
    getAIAgentStatus,
    powerAIAgent,
    startAntigravityAuth,
    submitAntigravityAuthCode,
    cancelAntigravityAuth,
    disconnectAuth,
    updateAIAgentConfig,
    executeAIAgentPrompt,
} from '@/api/server/ai-agent';
import { PromptHistoryItem } from './agent.types';

export const useAIAgent = (uuid: string) => {
    const [status, setStatus] = useState<AIAgentStatusResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [authUrl, setAuthUrl] = useState<string | null>(null);
    const [promptLoading, setPromptLoading] = useState(false);
    const [history, setHistory] = useState<PromptHistoryItem[]>([]);

    const clearNotice = useCallback(() => {
        setError(null);
        setSuccessMessage(null);
    }, []);

    const refreshStatus = useCallback(
        async (silent = false) => {
            if (!silent) setLoading(true);
            try {
                const data = await getAIAgentStatus(uuid);
                setStatus(data);
                if (data.device_auth && data.device_auth.auth_url) {
                    setAuthUrl(data.device_auth.auth_url);
                } else if (data.auth_status === 'connected') {
                    setAuthUrl(null);
                }
                setError(null);
            } catch (err: any) {
                setError(err?.response?.data?.error || err?.message || 'Failed to load AI Agent status.');
            } finally {
                if (!silent) setLoading(false);
            }
        },
        [uuid]
    );

    useEffect(() => {
        refreshStatus();
        const interval = setInterval(() => {
            refreshStatus(true);
        }, 4000);
        return () => clearInterval(interval);
    }, [refreshStatus]);

    const handlePower = async (action: 'start' | 'stop' | 'restart') => {
        setActionLoading(true);
        clearNotice();
        try {
            const data = await powerAIAgent(uuid, action);
            setStatus(data);
            setSuccessMessage(`Agent successfully ${action === 'start' ? 'started' : action === 'stop' ? 'stopped' : 'restarted'}.`);
        } catch (err: any) {
            setError(err?.response?.data?.error || err?.message || 'Power operation failed.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleStartAuth = async () => {
        setActionLoading(true);
        clearNotice();
        try {
            const res = await startAntigravityAuth(uuid);
            setAuthUrl(res.auth_url);
            setSuccessMessage('Google Antigravity authentication session started.');
            refreshStatus(true);
            return res;
        } catch (err: any) {
            setError(err?.response?.data?.error || err?.message || 'Failed to start Antigravity login.');
            return null;
        } finally {
            setActionLoading(false);
        }
    };

    const handleSubmitCode = async (code: string): Promise<boolean> => {
        if (!code.trim()) {
            setError('Please enter the authorization code provided by Google.');
            return false;
        }
        setActionLoading(true);
        clearNotice();
        try {
            const data = await submitAntigravityAuthCode(uuid, code.trim());
            setStatus(data);
            setAuthUrl(null);
            const acc = data?.connected_account || 'Google Account';
            setSuccessMessage(`Successfully authenticated as ${acc}.`);
            return true;
        } catch (err: any) {
            const errMsg = err?.response?.data?.error || err?.message || 'Authorization code verification failed.';
            setError(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelAuth = async () => {
        setActionLoading(true);
        try {
            await cancelAntigravityAuth(uuid);
            setAuthUrl(null);
            refreshStatus(true);
        } catch {
        } finally {
            setActionLoading(false);
        }
    };

    const handleDisconnect = async () => {
        setActionLoading(true);
        clearNotice();
        try {
            const data = await disconnectAuth(uuid);
            setStatus(data);
            setAuthUrl(null);
            setSuccessMessage('Google Account successfully disconnected.');
        } catch (err: any) {
            setError(err?.response?.data?.error || err?.message || 'Failed to disconnect account.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfigChange = async (key: string, value: any) => {
        setActionLoading(true);
        clearNotice();
        try {
            const data = await updateAIAgentConfig(uuid, { [key]: value });
            setStatus(data);
            setSuccessMessage(`Setting ${key} updated.`);
        } catch (err: any) {
            setError(err?.response?.data?.error || err?.message || 'Failed to update setting.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSendPrompt = async (prompt: string): Promise<string> => {
        const p = prompt.trim();
        if (!p) return '';

        setPromptLoading(true);
        clearNotice();
        try {
            const res = await executeAIAgentPrompt(uuid, p);
            setHistory((prev) => [
                ...prev,
                {
                    id: Math.random().toString(36).substring(7),
                    prompt: p,
                    output: res,
                    timestamp: new Date(),
                    isError: false,
                },
            ]);
            return res;
        } catch (err: any) {
            const errMsg = err?.response?.data?.error || err?.message || 'Prompt execution failed.';
            setHistory((prev) => [
                ...prev,
                {
                    id: Math.random().toString(36).substring(7),
                    prompt: p,
                    output: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg),
                    timestamp: new Date(),
                    isError: true,
                },
            ]);
            setError(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
            return '';
        } finally {
            setPromptLoading(false);
        }
    };

    return {
        status,
        loading,
        actionLoading,
        error,
        successMessage,
        authUrl,
        promptLoading,
        history,
        clearNotice,
        refreshStatus,
        handlePower,
        handleStartAuth,
        handleSubmitCode,
        handleCancelAuth,
        handleDisconnect,
        handleConfigChange,
        handleSendPrompt,
    };
};
