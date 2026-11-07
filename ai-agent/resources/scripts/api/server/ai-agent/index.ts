import http from '@/api/http';

export interface AIAgentConfig {
    enabled: boolean;
    mode: 'antigravity' | 'gemini';
    login_method: 'google_oauth' | 'api_key';
    auto_restart: boolean;
    session_persistence: boolean;
}

export interface DeviceAuthData {
    verification_url: string;
    user_code: string;
    device_code: string;
    expires_in: number;
    pending: boolean;
}

export interface RuntimeInfo {
    pid: number | null;
    container_online: boolean;
    mode: string;
    uptime: string;
    last_activity: string;
}

export interface AIAgentStatusResponse {
    agent_running: boolean;
    container_running: boolean;
    auth_status: 'connected' | 'disconnected' | 'pending_code' | 'pending_authorization';
    connected_account: string | null;
    credential_status: string;
    config: AIAgentConfig;
    device_auth: any | null;
    runtime_info: RuntimeInfo;
    logs: string[];
}

export const startAntigravityAuth = async (uuid: string): Promise<{ auth_url: string; expires_in: number }> => {
    const { data } = await http.post(`/api/client/servers/${uuid}/ai-agent/auth/start`);
    return data.data;
};

export const submitAntigravityAuthCode = async (uuid: string, code: string): Promise<AIAgentStatusResponse> => {
    const { data } = await http.post(`/api/client/servers/${uuid}/ai-agent/auth/submit`, { code });
    return data.data;
};

export const cancelAntigravityAuth = async (uuid: string): Promise<AIAgentStatusResponse> => {
    const { data } = await http.post(`/api/client/servers/${uuid}/ai-agent/auth/cancel`);
    return data.data;
};

export const executeAIAgentPrompt = async (uuid: string, prompt: string): Promise<string> => {
    const { data } = await http.post(
        `/api/client/servers/${uuid}/ai-agent/execute`,
        { prompt },
        { timeout: 300000 }
    );
    return data.output;
};

export const getAIAgentStatus = async (uuid: string): Promise<AIAgentStatusResponse> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/ai-agent`);
    return data.data;
};

export const powerAIAgent = async (uuid: string, action: 'start' | 'stop' | 'restart'): Promise<AIAgentStatusResponse> => {
    const { data } = await http.post(`/api/client/servers/${uuid}/ai-agent/power`, { action });
    return data.data;
};

export const requestDeviceCode = async (uuid: string): Promise<DeviceAuthData> => {
    const { data } = await http.post(`/api/client/servers/${uuid}/ai-agent/auth/device-code`);
    return data.data;
};

export const verifyAuth = async (uuid: string, account?: string): Promise<AIAgentStatusResponse> => {
    const { data } = await http.post(`/api/client/servers/${uuid}/ai-agent/auth/verify`, { account });
    return data.data;
};

export const saveToken = async (uuid: string, token: string, account?: string, method = 'api_key'): Promise<AIAgentStatusResponse> => {
    const { data } = await http.post(`/api/client/servers/${uuid}/ai-agent/auth/token`, { token, account, method });
    return data.data;
};

export const disconnectAuth = async (uuid: string): Promise<AIAgentStatusResponse> => {
    const { data } = await http.post(`/api/client/servers/${uuid}/ai-agent/auth/disconnect`);
    return data.data;
};

export const updateAIAgentConfig = async (uuid: string, settings: Partial<AIAgentConfig>): Promise<AIAgentStatusResponse> => {
    const { data } = await http.post(`/api/client/servers/${uuid}/ai-agent/config`, settings);
    return data.data;
};
