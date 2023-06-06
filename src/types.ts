import {WebSocket} from "@cloudflare/workers-types"

type CheckResult = {
    slug: string;
    success: boolean;
    checkedAt: number;
    responseTime: number;
    lag: number;
}

class Origin {
    slug: string;
    httpEndpoint: string;
    wsEndpoint: string;
    lat: number;
    lon: number;
    downAt: number | null;
    lastCheckResult: CheckResult | null = null;

    constructor(
        slug: string,
        httpHostname: string,
        wsHostname: string,
        downAt: number | null,
        lat: number,
        lon: number,
        lastCheckResult: CheckResult | null = null,
    ) {
        this.slug = slug;
        this.httpEndpoint = httpHostname;
        this.wsEndpoint = wsHostname;
        this.downAt = downAt;
        this.lat = lat;
        this.lon = lon;
        this.lastCheckResult = lastCheckResult;
    }

    isAlive(): boolean {
        return !this.downAt;
    }

    setDown(time: number | null) {
        this.downAt = time;
    }

    updateCheckResult(checkResult: CheckResult) {
        this.lastCheckResult = checkResult;
        if (!checkResult.success) {
            this.setDown(checkResult.checkedAt);
        } else {
            this.setDown(null);
        }
    }
}

class MutableResponse {
    body: any;
    status: number | undefined;
    headers: Headers | undefined;
    webSocket: WebSocket | null;

    constructor() {
        this.body = undefined;
        this.status = undefined;
        this.headers = undefined;
        this.webSocket = null;
    }
}

interface Env {
    CONFIG_KV: KVNamespace;
    ALLOWED_CLIENT_IP: EnvAllowedClientIP,
    ALLOWED_ORIGINS: EnvAllowedOrigins,
}


type RequestContext = {
    request: Request,
    response: Response | null,
    config: Config,
    env: Env,
    ctx: ExecutionContext,
}

type Config = {
    origins: Origin[]
}

type EnvAllowedClientIP = Array<string>;
type EnvAllowedOrigins = Array<string>;


export type {Config, Env, RequestContext, CheckResult};
export {Origin, MutableResponse};