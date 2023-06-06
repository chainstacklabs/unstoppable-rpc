function handleOptionRequest(): Response {
    // @ts-ignore
    return new Response(null, {headers: {...corsHeaders}});
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

function calculateDistance(lat1: number | null, lon1: number | null, lat2: number, lon2: number): number {
    if (!lat1 || !lon1) {
        return 0;
    }
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
    calculateDistance,
    getMethodNotAllowedResponse,
    getInternalServerErrorResponse,
    corsHeaders,
    getIpFromHeaders,
    getUserAgentFromHeaders,
    isWebsocketRequest,
    handleOptionRequest,
    sha256,
};

