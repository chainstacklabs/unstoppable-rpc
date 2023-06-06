import {RequestContext} from "../types";

class Middleware {
    slug: string = "middleware"

    async process(context: RequestContext): Promise<void> {
    }

    shouldBeProcessed(context: RequestContext): boolean {
        // response is already handled, skip middleware execution
        return !context.response;
    }

}

export default Middleware;