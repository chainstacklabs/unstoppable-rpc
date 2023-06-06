import {doFailover, findNearestOrigin, corsHeaders} from "../utils";
import {Origin, RequestContext} from "../types";

async function makeRequestToServer(
    url: URL,
    body: any,
    method: string,
    headers: Headers,
): Promise<Response> {
    return await fetch(url, {
        // fetch raises "TypeError:Request with a GET or HEAD method cannot have a body"
        body: ['GET', 'HEAD'].includes(method) ? null : body,
        method: method,
        headers: headers,
    });
}

async function handleHttpRequest(context: RequestContext): Promise<void> {
    const {request, config} = context;
    let serverResponse;
    let failoverDone: boolean = false
    // read body and save it
    const requestBody: ArrayBuffer = await request.arrayBuffer();
    // @ts-ignore
    const lat: string | null = request.cf?.latitude;
    // @ts-ignore
    const lon: string | null = request.cf?.longitude;

    let origin: Origin | null = findNearestOrigin(config, lat, lon);

    // check if origin exists and no response
    while (origin && !context.response) {
        try {
            const url: URL = new URL(origin.httpEndpoint);
            serverResponse = await makeRequestToServer(url, requestBody, request.method, request.headers);
            if (serverResponse.status >= 500) {
                console.log(`failed to fetch ${origin.slug} exception, do failover`);
                origin = doFailover(origin, config, lat, lon);
                failoverDone = true
            } else {
                context.response = new Response(serverResponse.body, {
                    status: serverResponse.status,
                    statusText: serverResponse.statusText,
                    headers: corsHeaders,
                });
                context.response.headers.set('x-origin-slug', origin.slug);
                context.response.headers.set('x-failover-done', String(failoverDone));
            }
        } catch (e) {
            console.log(e);
            break;
        }
    }
}

export {handleHttpRequest};
