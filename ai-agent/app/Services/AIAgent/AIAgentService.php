<?php

namespace Pterodactyl\Services\AIAgent;

use Exception;
use Pterodactyl\Models\Server;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Process\Process;

class AIAgentService
{
    private string $templateDir = '/usr/local/share/pterodactyl-ai-agent';

    
    private function getContainerName(Server $server): string
    {
        return $server->uuid;
    }

    
    private function getServerVolumePath(Server $server): string
    {
        return "/var/lib/pterodactyl/volumes/{$server->uuid}";
    }

    
    private function getAgentPath(Server $server): string
    {
        return $this->getServerVolumePath($server) . '/.ai-agent';
    }

    
    public function ensureInstalled(Server $server): void
    {
        $agentDir = $this->getAgentPath($server);
        $volumeDir = $this->getServerVolumePath($server);

        if (!is_dir($agentDir)) {
            if ($this->isContainerRunning($server)) {
                $process = new Process(['docker', 'exec', $server->uuid, 'sh', '-c', 'mkdir -p /home/container/.ai-agent/bin && chmod -R 777 /home/container/.ai-agent']);
                $process->run();
            }
            @mkdir($agentDir, 0777, true);
        } else {
            if ($this->isContainerRunning($server)) {
                $process = new Process(['docker', 'exec', $server->uuid, 'chmod', '-R', '777', '/home/container/.ai-agent']);
                $process->run();
            }
        }

        $binDir = $agentDir . '/bin';
        if (!is_dir($binDir)) {
            @mkdir($binDir, 0775, true);
        }

        if (!file_exists($agentDir . '/runner.sh')) {
            @copy($this->templateDir . '/runner.sh', $agentDir . '/runner.sh');
            @chmod($agentDir . '/runner.sh', 0755);
        }

        if (!file_exists($binDir . '/agy') && file_exists($this->templateDir . '/bin/agy')) {
            @copy($this->templateDir . '/bin/agy', $binDir . '/agy');
            @chmod($binDir . '/agy', 0755);
        }

        if (!file_exists($binDir . '/gemini-cli') && file_exists($this->templateDir . '/bin/gemini-cli')) {
            @copy($this->templateDir . '/bin/gemini-cli', $binDir . '/gemini-cli');
            @chmod($binDir . '/gemini-cli', 0755);
        }

        $configFile = $agentDir . '/config.json';
        if (!file_exists($configFile)) {
            $defaultConfig = [
                'enabled' => false,
                'mode' => 'antigravity',
                'login_method' => 'google_oauth',
                'auto_restart' => true,
                'session_persistence' => true,
            ];
            file_put_contents($configFile, json_encode($defaultConfig, JSON_PRETTY_PRINT));
            @chmod($configFile, 0644);
        }

        @chown($agentDir, 999);
        @chgrp($agentDir, 987);
        $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($agentDir, \RecursiveDirectoryIterator::SKIP_DOTS));
        foreach ($iterator as $item) {
            @chown($item->getPathname(), 999);
            @chgrp($item->getPathname(), 987);
        }
    }

    
    public function isContainerRunning(Server $server): bool
    {
        $container = $this->getContainerName($server);
        $process = new Process(['docker', 'inspect', '--format', '{{.State.Running}}', $container]);
        $process->run();

        return trim($process->getOutput()) === 'true';
    }

    
    public function getStatus(Server $server): array
    {
        $this->ensureInstalled($server);
        $containerRunning = $this->isContainerRunning($server);

        $agentDir = $this->getAgentPath($server);
        $configFile = $agentDir . '/config.json';
        $authFile = $agentDir . '/auth.json';
        $deviceAuthFile = $agentDir . '/device_auth.json';
        $logFile = $agentDir . '/agent.log';

        $config = file_exists($configFile) ? json_decode(file_get_contents($configFile), true) : [];
        $auth = file_exists($authFile) ? json_decode(file_get_contents($authFile), true) : [];
        $deviceAuth = file_exists($deviceAuthFile) ? json_decode(file_get_contents($deviceAuthFile), true) : null;

        $agentRunning = false;
        $agentPid = null;

        if ($containerRunning) {
            $container = $this->getContainerName($server);
            $process = new Process(['docker', 'exec', $container, '/home/container/.ai-agent/runner.sh', 'status']);
            $process->run();
            $output = trim($process->getOutput());

            if (str_starts_with($output, 'RUNNING:')) {
                $agentRunning = true;
                $agentPid = (int) substr($output, 8);
            }
        }

        $logs = [];
        if (file_exists($logFile)) {
            $logLines = array_slice(file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES), -30);
            $logs = array_reverse($logLines);
        }

        $authStatus = 'disconnected';
        $connectedAccount = null;

        $volumeDir = $this->getServerVolumePath($server);
        $agyTokenFile = $volumeDir . '/.gemini/antigravity-cli/antigravity-oauth-token';

        $tokenRaw = @file_get_contents($agyTokenFile);
        if ($tokenRaw === false && $containerRunning) {
            $container = $this->getContainerName($server);
            $proc = new Process(['docker', 'exec', $container, 'sh', '-c', 'chmod -R 775 /home/container/.gemini 2>/dev/null; chmod 664 /home/container/.gemini/antigravity-cli/antigravity-oauth-token /home/container/.ai-agent/auth.json 2>/dev/null; cat /home/container/.gemini/antigravity-cli/antigravity-oauth-token 2>/dev/null']);
            $proc->run();
            $out = trim($proc->getOutput());
            if (!empty($out) && str_starts_with($out, '{')) {
                $tokenRaw = $out;
            }
        }

        if (!empty($tokenRaw)) {
            $tokenParsed = json_decode($tokenRaw, true);
            if (!empty($tokenParsed['token']['access_token']) || !empty($tokenParsed['id_token_email'])) {
                $authStatus = 'connected';
                $connectedAccount = $tokenParsed['id_token_email'] ?? 'Google Account (Antigravity)';
            }
        }

        if ($authStatus !== 'connected' && !empty($auth)) {
            if (!empty($auth['account'])) {
                $authStatus = 'connected';
                $connectedAccount = $auth['account'];
            } elseif (!empty($auth['id_token_email'])) {
                $authStatus = 'connected';
                $connectedAccount = $auth['id_token_email'];
            } elseif (!empty($auth['token']['access_token'])) {
                $authStatus = 'connected';
                $connectedAccount = $auth['id_token_email'] ?? 'Google Account';
            }
        }

        if ($containerRunning) {
            $container = $this->getContainerName($server);
            $authProc = new Process(['/usr/local/share/pterodactyl-ai-agent/agy-auth-manager.py', 'status', $container]);
            $authProc->run();
            $authSession = json_decode(trim($authProc->getOutput()), true);

            if (!empty($authSession['status']) && $authSession['status'] === 'connected' && !empty($authSession['account'])) {
                $authStatus = 'connected';
                if (!$connectedAccount) {
                    $connectedAccount = $authSession['account'];
                }
            } elseif ($authStatus !== 'connected' && !empty($authSession['status']) && $authSession['status'] === 'pending_code') {
                $authStatus = 'pending_code';
                $deviceAuth = [
                    'pending' => true,
                    'auth_url' => $authSession['auth_url'] ?? '',
                    'expires_in' => $authSession['expires_in'] ?? 120,
                ];
            }
        }

        $runtimeInfo = [
            'pid' => $agentPid,
            'container_online' => $containerRunning,
            'mode' => $config['mode'] ?? 'antigravity',
            'uptime' => $agentRunning ? 'Active' : 'Offline',
            'last_activity' => !empty($logs[0]) ? $logs[0] : 'No activity logged yet',
        ];

        return [
            'agent_running' => $agentRunning,
            'container_running' => $containerRunning,
            'auth_status' => $authStatus,
            'connected_account' => $connectedAccount,
            'credential_status' => $authStatus === 'connected' ? 'Valid & Stored in Persistent Storage' : 'Not Connected',
            'config' => [
                'enabled' => $config['enabled'] ?? false,
                'mode' => $config['mode'] ?? 'antigravity',
                'login_method' => $config['login_method'] ?? 'google_oauth',
                'auto_restart' => $config['auto_restart'] ?? true,
                'session_persistence' => $config['session_persistence'] ?? true,
            ],
            'device_auth' => $deviceAuth,
            'runtime_info' => $runtimeInfo,
            'logs' => $logs,
        ];
    }

    
    public function power(Server $server, string $action): array
    {
        if (!in_array($action, ['start', 'stop', 'restart'])) {
            throw new Exception('Invalid power action specified.');
        }

        if (!$this->isContainerRunning($server)) {
            throw new Exception('Server container must be online in order to control the AI Agent.');
        }

        $this->ensureInstalled($server);
        $container = $this->getContainerName($server);

        $process = new Process(['docker', 'exec', $container, '/home/container/.ai-agent/runner.sh', $action]);
        $process->run();

        $agentDir = $this->getAgentPath($server);
        $configFile = $agentDir . '/config.json';
        $config = file_exists($configFile) ? json_decode(file_get_contents($configFile), true) : [];
        $config['enabled'] = ($action !== 'stop');
        file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT));

        $this->syncServerVariable($server, 'AI_AGENT_ENABLED', $config['enabled'] ? '1' : '0');

        return $this->getStatus($server);
    }

    
    public function requestDeviceCode(Server $server): array
    {
        $this->ensureInstalled($server);

        $chars = 'BCDFGHJKLMNPQRSTVWXYZ';
        $code = '';
        for ($i = 0; $i < 8; $i++) {
            if ($i === 4) $code .= '-';
            $code .= $chars[random_int(0, strlen($chars) - 1)];
        }

        $deviceData = [
            'verification_url' => 'https://www.google.com/device',
            'user_code' => $code,
            'device_code' => bin2hex(random_bytes(16)),
            'expires_in' => 900,
            'created_at' => time(),
            'pending' => true,
        ];

        $agentDir = $this->getAgentPath($server);
        file_put_contents($agentDir . '/device_auth.json', json_encode($deviceData, JSON_PRETTY_PRINT));

        return $deviceData;
    }

    
    public function verifyAuth(Server $server, ?string $account = null): array
    {
        $this->ensureInstalled($server);
        $agentDir = $this->getAgentPath($server);
        $deviceAuthFile = $agentDir . '/device_auth.json';

        $accountEmail = $account ?: 'google-user@' . $server->uuid . '.local';

        $authData = [
            'status' => 'connected',
            'account' => $accountEmail,
            'method' => 'google_oauth',
            'token' => 'oauth_' . bin2hex(random_bytes(24)),
            'updated_at' => date('c'),
        ];

        file_put_contents($agentDir . '/auth.json', json_encode($authData, JSON_PRETTY_PRINT));
        @chmod($agentDir . '/auth.json', 0600);
        @chown($agentDir . '/auth.json', 999);
        @chgrp($agentDir . '/auth.json', 987);

        if (file_exists($deviceAuthFile)) {
            @unlink($deviceAuthFile);
        }

        return $this->getStatus($server);
    }

    
    public function saveToken(Server $server, string $token, ?string $account = null, string $method = 'api_key'): array
    {
        $this->ensureInstalled($server);
        $agentDir = $this->getAgentPath($server);
        $volumeDir = $this->getServerVolumePath($server);
        $geminiDir = $volumeDir . '/.gemini/antigravity-cli';
        if (!is_dir($geminiDir)) {
            @mkdir($geminiDir, 0777, true);
        }

        $token = trim($token);
        $verifiedAccount = null;
        $oauthTokenData = null;

        if (str_starts_with($token, '{') && str_ends_with($token, '}')) {
            $parsed = json_decode($token, true);
            if (!empty($parsed['token']['access_token'])) {
                $accessToken = $parsed['token']['access_token'];
                $verifyUrl = "https://oauth2.googleapis.com/tokeninfo?access_token={$accessToken}";
                $resp = @file_get_contents($verifyUrl);
                if ($resp !== false) {
                    $tokenInfo = json_decode($resp, true);
                    $verifiedAccount = $tokenInfo['email'] ?? ($parsed['id_token_email'] ?? 'Google Account');
                } else {
                    $verifiedAccount = $parsed['id_token_email'] ?? 'Antigravity User';
                }
                $oauthTokenData = $parsed;
                $method = 'google_oauth';
            } elseif (!empty($parsed['key']) || !empty($parsed['api_key'])) {
                $token = $parsed['key'] ?? $parsed['api_key'];
                $method = 'api_key';
            }
        }

        if ($method === 'google_oauth' && str_starts_with($token, 'ya29.')) {
            $verifyUrl = "https://oauth2.googleapis.com/tokeninfo?access_token={$token}";
            $resp = @file_get_contents($verifyUrl);
            if ($resp === false) {
                throw new Exception('Token OAuth Google tidak valid atau sudah kedaluwarsa. Silakan periksa kembali token Anda.');
            }
            $tokenInfo = json_decode($resp, true);
            if (empty($tokenInfo['email'])) {
                throw new Exception('Token Google tidak memiliki scope email atau tidak valid.');
            }
            $verifiedAccount = $tokenInfo['email'];
            $oauthTokenData = [
                'token' => [
                    'access_token' => $token,
                    'token_type' => 'Bearer',
                    'expiry' => date('Y-m-d\TH:i:s\Z', time() + ($tokenInfo['expires_in'] ?? 3600)),
                    'expires_in' => (int) ($tokenInfo['expires_in'] ?? 3600),
                ],
                'auth_method' => 'consumer',
                'id_token_email' => $verifiedAccount,
            ];
        } elseif ($method === 'api_key' || str_starts_with($token, 'AIzaSy')) {
            $testUrl = "https://generativelanguage.googleapis.com/v1beta/models?key={$token}";
            $context = stream_context_create([
                'http' => [
                    'method' => 'GET',
                    'timeout' => 8,
                    'ignore_errors' => true,
                ],
            ]);
            $resp = @file_get_contents($testUrl, false, $context);
            $responseCode = 500;
            if (isset($http_response_header[0]) && preg_match('/HTTP\/\S+\s+(\d+)/', $http_response_header[0], $m)) {
                $responseCode = (int) $m[1];
            }

            if ($responseCode !== 200) {
                $errJson = json_decode($resp, true);
                $googleMsg = $errJson['error']['message'] ?? 'API Key tidak valid menurut Google AI Studio.';
                throw new Exception("Verifikasi Mandiri Gagal: {$googleMsg}");
            }

            $verifiedAccount = $account ?: 'Google AI Developer (' . substr($token, 0, 10) . '...)';
            $method = 'api_key';
        }

        if (!$verifiedAccount) {
            throw new Exception('Format kredensial tidak dikenali. Masukkan API Key dari aistudio.google.com atau Token OAuth Google yang valid.');
        }

        $authData = [
            'status' => 'connected',
            'account' => $verifiedAccount,
            'method' => $method,
            'api_key' => $method === 'api_key' ? $token : null,
            'token' => $method !== 'api_key' ? $token : null,
            'updated_at' => date('c'),
        ];

        file_put_contents($agentDir . '/auth.json', json_encode($authData, JSON_PRETTY_PRINT));
        @chmod($agentDir . '/auth.json', 0600);

        if ($this->isContainerRunning($server)) {
            $container = $this->getContainerName($server);
            $p = new Process(['docker', 'exec', $container, 'sh', '-c', 'mkdir -p /home/container/.gemini/antigravity-cli && chmod -R 777 /home/container/.gemini']);
            $p->run();
        }

        if ($oauthTokenData) {
            file_put_contents($geminiDir . '/antigravity-oauth-token', json_encode($oauthTokenData, JSON_PRETTY_PRINT));
            @chmod($geminiDir . '/antigravity-oauth-token', 0666);
        } elseif ($method === 'api_key') {
            $settingsFile = $geminiDir . '/settings.json';
            $settings = file_exists($settingsFile) ? json_decode(file_get_contents($settingsFile), true) : [];
            $settings['apiKey'] = $token;
            file_put_contents($settingsFile, json_encode($settings, JSON_PRETTY_PRINT));
            @chmod($settingsFile, 0666);
        }

        return $this->getStatus($server);
    }

    
    public function startAntigravityAuth(Server $server): array
    {
        if (!$this->isContainerRunning($server)) {
            throw new Exception('Server container harus online untuk menjalankan autentikasi Antigravity CLI.');
        }

        $container = $this->getContainerName($server);
        $process = new Process(['/usr/local/share/pterodactyl-ai-agent/agy-auth-manager.py', 'start', $container]);
        $process->setTimeout(15);
        $process->run();

        $lines = array_filter(array_map('trim', explode("\n", $process->getOutput())));
        $lastLine = end($lines);
        $output = json_decode($lastLine, true);
        if (!$output || empty($output['auth_url'])) {
            $errMsg = $output['message'] ?? 'Gagal mendapatkan URL login resmi Antigravity.';
            throw new Exception($errMsg);
        }

        return $output;
    }

    
    public function submitAntigravityAuthCode(Server $server, string $code): array
    {
        if (!$this->isContainerRunning($server)) {
            throw new Exception('Server container harus online.');
        }

        $container = $this->getContainerName($server);
        $process = new Process(['/usr/local/share/pterodactyl-ai-agent/agy-auth-manager.py', 'submit', $container, trim($code)]);
        $process->setTimeout(15);
        $process->run();

        $lines = array_filter(array_map('trim', explode("\n", $process->getOutput())));
        $lastLine = end($lines);
        $output = json_decode($lastLine, true);
        if (!empty($output['status']) && $output['status'] === 'error') {
            throw new Exception($output['message'] ?? 'Kode otorisasi tidak valid.');
        }

        $volumeDir = $this->getServerVolumePath($server);
        @chmod($volumeDir . '/.gemini/antigravity-cli/antigravity-oauth-token', 0664);
        @chmod($volumeDir . '/.ai-agent/auth.json', 0664);

        $status = $this->getStatus($server);
        if (!empty($output['account']) && empty($status['connected_account'])) {
            $status['connected_account'] = $output['account'];
            $status['auth_status'] = 'connected';
            $status['credential_status'] = 'Valid & Stored in Persistent Storage';
        }

        return $status;
    }

    
    public function cancelAntigravityAuth(Server $server): array
    {
        $container = $this->getContainerName($server);
        $process = new Process(['/usr/local/share/pterodactyl-ai-agent/agy-auth-manager.py', 'cancel', $container]);
        $process->run();

        return $this->getStatus($server);
    }

    
    public function executePrompt(Server $server, string $prompt): string
    {
        @set_time_limit(0);

        if (!$this->isContainerRunning($server)) {
            throw new Exception('Server container harus dalam keadaan online.');
        }

        $prompt = trim($prompt);
        if (empty($prompt)) {
            throw new Exception('Prompt tidak boleh kosong.');
        }

        $container = $this->getContainerName($server);
        $process = new Process([
            'docker', 'exec', $container,
            '/home/container/.ai-agent/bin/agy',
            '--dangerously-skip-permissions',
            '-p', $prompt
        ]);
        $process->setTimeout(null);
        $process->run();

        $output = trim($process->getOutput());
        if (empty($output)) {
            $err = trim($process->getErrorOutput());
            if (!empty($err)) {
                return "[Error Antigravity] " . $err;
            }
            return "Perintah dieksekusi tanpa output.";
        }

        return $output;
    }

    
    public function disconnect(Server $server): array
    {
        $this->ensureInstalled($server);
        $agentDir = $this->getAgentPath($server);
        $volumeDir = $this->getServerVolumePath($server);

        $this->cancelAntigravityAuth($server);

        if ($this->isContainerRunning($server)) {
            try {
                $this->power($server, 'stop');
            } catch (Exception $e) {}
        }

        if (file_exists($agentDir . '/auth.json')) {
            @unlink($agentDir . '/auth.json');
        }
        if (file_exists($agentDir . '/device_auth.json')) {
            @unlink($agentDir . '/device_auth.json');
        }

        $agyTokenFile = $volumeDir . '/.gemini/antigravity-cli/antigravity-oauth-token';
        if (file_exists($agyTokenFile)) {
            @unlink($agyTokenFile);
        }

        return $this->getStatus($server);
    }

    
    public function updateConfig(Server $server, array $settings): array
    {
        $this->ensureInstalled($server);
        $agentDir = $this->getAgentPath($server);
        $configFile = $agentDir . '/config.json';

        $config = file_exists($configFile) ? json_decode(file_get_contents($configFile), true) : [];

        if (isset($settings['mode'])) {
            $config['mode'] = in_array($settings['mode'], ['antigravity', 'gemini']) ? $settings['mode'] : 'antigravity';
            $this->syncServerVariable($server, 'AI_AGENT_MODE', $config['mode']);
        }
        if (isset($settings['login_method'])) {
            $config['login_method'] = in_array($settings['login_method'], ['google_oauth', 'api_key']) ? $settings['login_method'] : 'google_oauth';
            $this->syncServerVariable($server, 'AI_LOGIN_METHOD', $config['login_method']);
        }
        if (isset($settings['auto_restart'])) {
            $config['auto_restart'] = (bool) $settings['auto_restart'];
            $this->syncServerVariable($server, 'AI_AUTO_RESTART', $config['auto_restart'] ? '1' : '0');
        }
        if (isset($settings['session_persistence'])) {
            $config['session_persistence'] = (bool) $settings['session_persistence'];
            $this->syncServerVariable($server, 'AI_SESSION_PERSISTENCE', $config['session_persistence'] ? '1' : '0');
        }

        file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT));

        return $this->getStatus($server);
    }

    
    private function syncServerVariable(Server $server, string $envVar, string $value): void
    {
        try {
            DB::table('server_variables')
                ->join('egg_variables', 'egg_variables.id', '=', 'server_variables.variable_id')
                ->where('server_variables.server_id', $server->id)
                ->where('egg_variables.env_variable', $envVar)
                ->update(['server_variables.variable_value' => $value]);
        } catch (Exception $e) {}
    }
}
