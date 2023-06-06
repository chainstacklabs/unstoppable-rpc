import {Config, loadConfig} from './config';
import {Env, Origin, CheckResult} from './types';


export default {
    async scheduled(event: any, env: Env, ctx: any) {
        const config = await loadConfig(env);
        ctx.waitUntil(healthCheck(env, config));
    }
}


export function healthCheck(env: Env, config: Config) {
    return Promise.all(config.origins
        .map(origin => checkOrigin(origin))
        .map(checkResult => checkResult.then(updateConfig(config))))
        .then(() => {
            saveConfig(env, config);
            return config;
        }).then(config => config);
}

function updateConfig(config: Config) {
    return function (checkResult: CheckResult) {
        for (let origin of config.origins) {
            if (origin.slug === checkResult.slug) {
                origin.updateCheckResult(checkResult);
            }
        }
    };
}

function saveConfig(env: Env, config: Config) {
    env.CONFIG_KV.put("origins", JSON.stringify(config.origins));
}

function getLagDurationOrError(response: Response, timestamp: number) {
    return response.json().then((json: any) => {
        if (json.error || !json.result) {
            return {
                success: false,
                lag: 0,
            };
        } else {
            return {
                success: true,
                lag: timestamp / 1000 - parseInt(json.result.timestamp, 16),
            }
        }
    });
}

function recordResponseTime(start: number) {
    return async function (response: Response) {
        let now = Date.now();
        const duration = (now - start) / 1000;
        let {lag, success} = await getLagDurationOrError(response, now);
        return {
            success: success,
            responseTime: duration,
            lag: lag,
        }
    };
}

function recordFailTime(start: number) {
    return async function (_: any) {
        const duration = (Date.now() - start) / 1000;
        return {
            success: false,
            responseTime: duration,
            lag: 0,
        }
    }
}

async function measureLag(origin: Origin) {
    let profiler = recordResponseTime(Date.now());
    let errorHandler = recordFailTime(Date.now());
    return fetch(origin.httpEndpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: '{"jsonrpc":"2.0","method":"eth_getBlockByNumber","params":["latest", false],"id":1}',
    }).then(profiler).catch(errorHandler)
}

async function checkOrigin(origin: Origin) {
    const checkResult = await measureLag(origin);
    return {
        slug: origin.slug,
        success: checkResult.success,
        checkedAt: Date.now(),
        responseTime: checkResult.responseTime,
        lag: checkResult.lag,
    } as CheckResult;
}