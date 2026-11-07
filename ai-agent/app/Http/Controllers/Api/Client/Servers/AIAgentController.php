<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Models\Server;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Services\AIAgent\AIAgentService;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;

class AIAgentController extends ClientApiController
{
    public function __construct(private AIAgentService $service)
    {
        parent::__construct();
    }

    
    public function index(Request $request, Server $server): JsonResponse
    {
        $status = $this->service->getStatus($server);

        return new JsonResponse(['success' => true, 'data' => $status]);
    }

    
    public function power(Request $request, Server $server): JsonResponse
    {
        $action = $request->input('action', 'start');

        try {
            $status = $this->service->power($server, $action);
            Activity::event("server:ai_agent.{$action}")->log();

            return new JsonResponse(['success' => true, 'data' => $status]);
        } catch (Exception $e) {
            return new JsonResponse(['success' => false, 'error' => $e->getMessage()], 400);
        }
    }

    
    public function startAuth(Request $request, Server $server): JsonResponse
    {
        try {
            $data = $this->service->startAntigravityAuth($server);
            Activity::event('server:ai_agent.auth_started')->log();

            return new JsonResponse(['success' => true, 'data' => $data]);
        } catch (Exception $e) {
            return new JsonResponse(['success' => false, 'error' => $e->getMessage()], 400);
        }
    }

    
    public function submitCode(Request $request, Server $server): JsonResponse
    {
        $code = $request->input('code');
        if (empty($code)) {
            return new JsonResponse(['success' => false, 'error' => 'Kode otorisasi Google wajib diisi.'], 422);
        }

        try {
            $status = $this->service->submitAntigravityAuthCode($server, $code);
            Activity::event('server:ai_agent.auth_submitted')->log();

            return new JsonResponse(['success' => true, 'data' => $status]);
        } catch (Exception $e) {
            return new JsonResponse(['success' => false, 'error' => $e->getMessage()], 400);
        }
    }

    
    public function cancelAuth(Request $request, Server $server): JsonResponse
    {
        try {
            $status = $this->service->cancelAntigravityAuth($server);
            Activity::event('server:ai_agent.auth_cancelled')->log();

            return new JsonResponse(['success' => true, 'data' => $status]);
        } catch (Exception $e) {
            return new JsonResponse(['success' => false, 'error' => $e->getMessage()], 400);
        }
    }

    
    public function executePrompt(Request $request, Server $server): JsonResponse
    {
        $prompt = $request->input('prompt');
        try {
            $output = $this->service->executePrompt($server, (string) $prompt);
            Activity::event('server:ai_agent.prompt_executed')->log();

            return new JsonResponse(['success' => true, 'output' => $output]);
        } catch (Exception $e) {
            return new JsonResponse(['success' => false, 'error' => $e->getMessage()], 400);
        }
    }

    
    public function requestDeviceCode(Request $request, Server $server): JsonResponse
    {
        try {
            $deviceData = $this->service->requestDeviceCode($server);
            Activity::event('server:ai_agent.auth_request')->log();

            return new JsonResponse(['success' => true, 'data' => $deviceData]);
        } catch (Exception $e) {
            return new JsonResponse(['success' => false, 'error' => $e->getMessage()], 400);
        }
    }

    
    public function verifyAuth(Request $request, Server $server): JsonResponse
    {
        $account = $request->input('account');

        try {
            $status = $this->service->verifyAuth($server, $account);
            Activity::event('server:ai_agent.auth_connected')->log();

            return new JsonResponse(['success' => true, 'data' => $status]);
        } catch (Exception $e) {
            return new JsonResponse(['success' => false, 'error' => $e->getMessage()], 400);
        }
    }

    
    public function saveToken(Request $request, Server $server): JsonResponse
    {
        $token = $request->input('token');
        $account = $request->input('account');
        $method = $request->input('method', 'api_key');

        if (empty($token)) {
            return new JsonResponse(['success' => false, 'error' => 'Token or API Key is required.'], 422);
        }

        try {
            $status = $this->service->saveToken($server, $token, $account, $method);
            Activity::event('server:ai_agent.token_saved')->log();

            return new JsonResponse(['success' => true, 'data' => $status]);
        } catch (Exception $e) {
            return new JsonResponse(['success' => false, 'error' => $e->getMessage()], 400);
        }
    }

    
    public function disconnect(Request $request, Server $server): JsonResponse
    {
        try {
            $status = $this->service->disconnect($server);
            Activity::event('server:ai_agent.auth_disconnected')->log();

            return new JsonResponse(['success' => true, 'data' => $status]);
        } catch (Exception $e) {
            return new JsonResponse(['success' => false, 'error' => $e->getMessage()], 400);
        }
    }

    
    public function updateConfig(Request $request, Server $server): JsonResponse
    {
        try {
            $status = $this->service->updateConfig($server, $request->all());
            Activity::event('server:ai_agent.config_updated')->log();

            return new JsonResponse(['success' => true, 'data' => $status]);
        } catch (Exception $e) {
            return new JsonResponse(['success' => false, 'error' => $e->getMessage()], 400);
        }
    }
}
