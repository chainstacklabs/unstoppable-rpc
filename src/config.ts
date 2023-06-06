import {Config, Env, Origin} from './types';

async function loadConfig(env: Env): Promise<Config> {
    const origins: Origin[] = await env.CONFIG_KV.get("origins", {type: "json"}) || [];
    return {
        origins: origins.map(origin => new Origin(
            origin.slug,
            origin.httpEndpoint,
            origin.wsEndpoint,
            origin.downAt,
            origin.lat,
            origin.lon,
            origin.lastCheckResult))
    };
}

export {loadConfig};

