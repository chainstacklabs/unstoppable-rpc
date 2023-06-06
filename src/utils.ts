import {Config, Origin} from "./types";

function handleOptionRequest(): Response {
    // @ts-ignore
    return new Response(null, {headers: {...corsHeaders}});
}


function doFailover(
    failedOrigin: Origin,
    config: Config,
    requestLat: number | string | null,
    requestLon: number | string | null,
): Origin | null {
    failedOrigin.setDown(Date.now());

    return findNearestOrigin(config, requestLat, requestLon);
}

function findNearestOrigin(
    config: Config,
    requestLat: number | string | null,
    requestLon: number | string | null,
): Origin | null {
    const aliveOrigins: Origin[] = config.origins.filter((i: Origin) => i.isAlive());
    let closestDistance: number = Infinity;
    let closestOrigin: Origin | null = null;
    const lat: number = Number(requestLat);
    const lon: number = Number(requestLon);

    if (aliveOrigins.length === 0) {
        return null;
    } else if (aliveOrigins.length === 1) {
        return aliveOrigins[0];
    } else if (!lat || !lon) {
        const choice: number = Math.floor(Math.random() * aliveOrigins.length);
        closestOrigin = aliveOrigins[choice];
    } else {
        aliveOrigins.forEach((origin_: Origin): void => {
            const distance: number = calculateDistance(origin_.lat, origin_.lon, lat, lon);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestOrigin = origin_;
            }
        });
    }

    return closestOrigin;
}

const corsHeaders: { [key: string]: string } = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Max-Age': '86400',
};

const getMethodNotAllowedResponse = (): Response =>
    new Response('405 Method Not Allowed', {
        status: 405,
        statusText: 'Method Not Allowed',
        headers: corsHeaders,
    });
const getInternalServerErrorResponse = (): Response =>
    new Response('500 Internal Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
        headers: corsHeaders,
    });


function degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R: number = 6371; // Radius of the earth in km
    const dLat: number = degreesToRadians(lat2 - lat1);
    const dLon: number = degreesToRadians(lon2 - lon1);
    const a: number =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(degreesToRadians(lat1)) *
        Math.cos(degreesToRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c: number = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

function getIpFromHeaders(headers: Headers): string {
    return headers.get('cf-connecting-ip') || headers.get('x-real-ip') || '';
}

function getUserAgentFromHeaders(headers: Headers): string {
    return headers.get('user-agent') || '';
}

function isWebsocketRequest(headers: Headers): boolean {
    const connHeader: string = (headers.get('connection') || '').toLowerCase();
    return connHeader === 'upgrade' && headers.get('upgrade') === 'websocket';
}
async function sha256(message: string): Promise<string> {
  const msgBuffer = await new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  return [...new Uint8Array(hashBuffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export {
    findNearestOrigin,
    calculateDistance,
    getMethodNotAllowedResponse,
    getInternalServerErrorResponse,
    corsHeaders,
    getIpFromHeaders,
    getUserAgentFromHeaders,
    isWebsocketRequest,
    doFailover,
    handleOptionRequest,
    sha256,
};

