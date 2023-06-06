import {doFailover, findNearestOrigin} from "../utils";
import {Origin, RequestContext} from "../types";

async function makeRequestToServer(url: URL, headers: Headers): Promise<Response> {
    // workers will not work with wss, only https
    url.protocol = ["ws:", "wss:"].includes(url.protocol) ? "https" : url.protocol;
    return await fetch(url, {headers: headers});
}

async function handleWsRequest(context: RequestContext): Promise<void> {
    console.log("handleWsRequest")
    const {request, config} = context;
    let serverResponse;
    // @ts-ignore
    const lat: string | null = request.cf?.latitude;
    // @ts-ignore
    const lon: string | null = request.cf?.longitude;

    let origin: Origin | null = findNearestOrigin(config as any, lat, lon);

    while (origin && !context.response) {
        try {
            const url: URL = new URL(origin.wsEndpoint);
            serverResponse = await makeRequestToServer(url, request.headers);

            if (serverResponse.status >= 500) {
                console.error(`Failed to fetch ${origin.slug} exception, do failover`);
                origin = doFailover(origin, context.config, lat, lon);
            } else {
                context.response = serverResponse;
            }
        } catch (e) {
            console.error(e);
            break;
        }
    }
}

export {handleWsRequest};
