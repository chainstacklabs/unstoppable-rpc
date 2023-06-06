import {Config, loadConfig} from './config';
import {Env, RequestContext} from './types';
import Middleware from "./middlewares/base";
import AllowByClientIPMiddleware from "./middlewares/checkClientIP";
import CheckClientOriginMiddleware from "./middlewares/checkUserAgent";
import HandleRequestMiddleware from "./middlewares/handleRequestMiddleware";
import CachingMiddleware from "./middlewares/caching";
import {getInternalServerErrorResponse} from "./utils";

const middlewares: Middleware[] = [
    new AllowByClientIPMiddleware(),
    new CheckClientOriginMiddleware(),
    new HandleRequestMiddleware(),
    new CachingMiddleware(),
];

export default {
    async fetch(
        request: Request,
        env: Env,
        ctx: ExecutionContext
    ): Promise<Response> {
        let config: Config = await loadConfig(env);

        const requestContext: RequestContext = {
            request,
            env,
            config,
            ctx,
            response: null,
        } as RequestContext

        let middleware: Middleware

        for (middleware of middlewares) {
            if (middleware.shouldBeProcessed(requestContext)) {
                await middleware.process(requestContext);
            }
        }

        if (!requestContext.response) {
            requestContext.response = getInternalServerErrorResponse();
        }

        return requestContext.response;
    },

};
