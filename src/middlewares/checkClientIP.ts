import Middleware from "./base";
import {RequestContext} from "../types";
import {getIpFromHeaders} from "../utils";


class AllowByClientIPMiddleware extends Middleware {
    slug: string = "allowByClientIP"
    async process(context: RequestContext): Promise<void> {
        const {request, env} = context;

        const clientIP: string = getIpFromHeaders(request.headers);
        const allowedIPs: string[] = env.ALLOWED_CLIENT_IP || [];
        if (allowedIPs.length == 0) {
            return;
        }
        const isAllowed: boolean = allowedIPs.includes(clientIP);
        if (!isAllowed) {
            context.response = new Response("Forbidden", {status: 403});
        }
    }
}

export default AllowByClientIPMiddleware;