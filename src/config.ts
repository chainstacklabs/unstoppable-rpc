import {Env, Origin, Weights} from './types';
import {calculateDistance} from "./utils";

const DEFAULT_WEIGHTS: Weights = {
    failWeight: 1_000_000,
    lagWeight: 10_000,
    latencyWeight: 1_000,
    distanceWeight: 1,
};

function getScore(config: Config, lat: number | null, lon: number | null, origin: Origin) {
    let successWeight = origin.lastCheckResult?.success ? config.weights.failWeight : 0;
    let distanceWeight = calculateDistance(lat, lon, origin.lat, origin.lon);
    let latencyWeight = origin.lastCheckResult.responseTime * 1000;
    let lagWeight = origin.lastCheckResult.lag * 10000;
    return successWeight + distanceWeight + latencyWeight + lagWeight;
}

class Config {
    origins: Origin[]
    weights: Weights

    constructor(origins: Origin[] = [], weights: Weights = {} as Weights) {
        this.origins = origins;
        this.weights = weights;
    }

    orderedOrigins(lat: number | null, lon: number | null) {
        let originsCopy = this.origins.slice();
        return originsCopy.sort(this.originsComparator(lat, lon));
    }

    private originsComparator(lat: number | null, lon: number | null) {
        let config = this;
        return function (p1: Origin, p2: Origin) {
            let p1Score = getScore(config, lat, lon, p1);
            let p2Score = getScore(config, lat, lon, p2);
            return p1Score - p2Score;
        };
    }
}

async function loadConfig(env: Env): Promise<Config> {
    const origins: Origin[] = await env.CONFIG_KV.get("origins", {type: "json"}) || [];
    const weights: Weights = await env.CONFIG_KV.get("weights", {type: "json"}) || DEFAULT_WEIGHTS;
    return new Config(
        origins.map(origin => new Origin(
            origin.slug,
            origin.httpEndpoint,
            origin.wsEndpoint,
            origin.downAt,
            origin.lat,
            origin.lon,
            origin.lastCheckResult)),
        weights
    );
}

export {loadConfig, Config};