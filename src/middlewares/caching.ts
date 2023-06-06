import Middleware from "./base";
import {RequestContext} from "../types";
import {sha256} from "../utils";


class CachingMiddleware extends Middleware {
    slug: string = "caching"

    async process(context: RequestContext): Promise<void> {
        const {request, response} = context;

        if (!response) {
            return;
        }

        const requestBody: string = await request.text();
        console.log(requestBody);

        try {
            if (requestBody.includes("eth_getBlockByNumber")) {
                const hash: string = await sha256(requestBody);
                const cacheUrl = new URL(request.url);
                cacheUrl.pathname = cacheUrl.pathname + hash;
                const cacheKey = new Request(cacheUrl.toString(), {
                    headers: request.headers,
                    method: "POST",
                });
                const cache: Cache = caches.default;
                await cache.put(cacheKey, response);
            }
        } catch (e) {
            console.log(e);
        }
    }

    shouldBeProcessed(context: RequestContext): boolean {
        return false;
    }
}

export default CachingMiddleware;