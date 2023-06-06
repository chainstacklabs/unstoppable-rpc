import Middleware from "./base";
import {RequestContext} from "../types";
import {getUserAgentFromHeaders} from "../utils";


class AllowByUserAgentMiddleware extends Middleware {
    slug: string = "allowByUserAgent"

    async process(context: RequestContext): Promise<void> {
        const {request, env} = context;
        const clientOrigin: string = getUserAgentFromHeaders(request.headers);
        const allowedOrigins: string[] = env.ALLOWED_ORIGINS || [];
        if (allowedOrigins.length == 0) {
            return;
        }
        let isAllowed: boolean = false;
        allowedOrigins.map((origin: string): void => {
            if (new RegExp(origin).test(clientOrigin)) {
                isAllowed = true;
            }
        })

        if (!isAllowed) {
            context.response = new Response("Forbidden", {status: 403});
        }
    }
}

export default AllowByUserAgentMiddleware;