export interface AIAgentConfig {
    enabled: boolean;
    mode: 'antigravity' | 'gemini';
    login_method: 'google_oauth' | 'api_key';
    auto_restart: boolean;
    session_persistence: boolean;
}

export interface RuntimeInfo {
    pid: number | null;
    container_online: boolean;
    mode: string;
    uptime: string;
    last_activity: string;
}

export interface DeviceAuthData {
    verification_url?: string;
    auth_url?: string;
    user_code?: string;
    device_code?: string;
    expires_in?: number;
    pending?: boolean;
}

export interface AIAgentStatusResponse {
    agent_running: boolean;
    container_running: boolean;
    auth_status: 'connected' | 'disconnected' | 'pending_code' | 'pending_authorization';
    connected_account: string | null;
    credential_status: string;
    config: AIAgentConfig;
    device_auth: DeviceAuthData | null;
    runtime_info: RuntimeInfo;
    logs: string[];
}

export interface PromptHistoryItem {
    id: string;
    prompt: string;
    output: string;
    timestamp: Date;
    isError?: boolean;
}
