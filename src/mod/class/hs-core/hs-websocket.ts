import { HSModuleOptions } from "../../types/hs-types";
import { HSWebSocketObject, HSWebSocketRegistrationParams } from "../../types/module-types/hs-websocket-types";
import { HSUtils } from "../hs-utils/hs-utils";
import { HSLogger } from "./hs-logger";
import { HSModule } from "./module/hs-module";

export class HSWebSocket extends HSModule {

    #webSockets: Map<string, HSWebSocketObject<any>> = new Map();
    #exponentialBackoff = [5000, 15000, 30000, 60000];

    constructor(moduleOptions: HSModuleOptions) {
        super(moduleOptions);
    }

    async init() {
        HSLogger.log(`Initializing HSWebsocket module`, this.context);
        this.isInitialized = true;
    }

    #reconnectWebSocket<T>(name: string) {
        const ws = this.#webSockets.get(name);

        if (!ws) {
            HSLogger.warn(`Tried to reconnect websocket ${name} but it doesn't exist`, this.context);
            return;
        }

        this.#webSockets.delete(name);
        // Pass the preserved reconnection tries to the new instance
        this.registerWebSocket(name, ws.regParams, ws.reconnectionTries);
    }

    /**
     * Forces a reconnection of the named WebSocket.
     * Use this to manually trigger a reconnect if the connection seems stuck.
     */
    forceReconnect(name: string) {
        HSLogger.log(`Forcing reconnection of ${name}...`, this.context);
        const ws = this.#webSockets.get(name);
        if (ws) {
            // Reset retries because this is a manual user action; they expect it to try immediately/freshly.
            ws.reconnectionTries = 0;
            this.#reconnectWebSocket(name);
        } else {
            HSLogger.warn(`Cannot force reconnect ${name}: Socket not found`, this.context);
        }
    }

    registerWebSocket<T>(name: string, regParams: HSWebSocketRegistrationParams<T>, previousTries: number = 0) {
        const self = this;

        if (this.#webSockets.has(name)) {
            HSLogger.debug(`Tried to register websocket ${name} again`, this.context);
            return;
        }

        if (!regParams.url) {
            HSLogger.error(`Tried to register websocket ${name} without a URL`, this.context);
            return;
        }

        const webSocketObject: HSWebSocketObject<T> = {
            socket: new WebSocket(regParams.url),
            reconnectionTries: 0,
            onClose: regParams.onClose ?? HSUtils.Noop,
            onOpen: regParams.onOpen ?? HSUtils.Noop,
            onMessage: regParams.onMessage ?? HSUtils.Noop,
            onRetriesFailed: regParams.onRetriesFailed ?? HSUtils.Noop,
            regParams: regParams
        }

        const onCloseHandler = async (event: CloseEvent) => {
            const ws = self.#webSockets.get(name);

            console.log("WS CLOSED", name, {
                code: event.code,
                reason: event.reason,
                wasClean: event.wasClean,
                tries: ws?.reconnectionTries
            });

            const delay = self.#exponentialBackoff[++webSocketObject.reconnectionTries];

            if (delay !== undefined) {
                HSLogger.log(`Reconnecting ${name} in ${delay}ms (attempt ${webSocketObject.reconnectionTries})`, self.context);
                setTimeout(() => {
                    self.#reconnectWebSocket(name);
                }, delay);
            } else {
                HSLogger.warn(`WebSocket ${name} failed to reconnect after ${webSocketObject.reconnectionTries} tries`);
                await (webSocketObject.onRetriesFailed ?? HSUtils.Noop)();
            }

            await (webSocketObject.onClose ?? HSUtils.Noop)(event);
        };

        const onMessageHandler = async (event: MessageEvent) => {
            const ws = self.#webSockets.get(name);

            if (!ws) {
                HSLogger.warnOnce(`wsOnOpen(): Socket ${name} not found`, self.context);
                return;
            }

            let parsedData: T | undefined;

            try {
                parsedData = JSON.parse(event.data) as T | undefined;
            } catch (error) {
                HSLogger.warn(`Failed to parse WebSocket message for ${name}: ${error}`, this.context);
                parsedData = undefined;
            }

            await (ws.onMessage ?? HSUtils.Noop)(parsedData);
        };

        const onOpenHandler = async (event: Event) => {
            const ws = self.#webSockets.get(name);

            if (!ws) {
                HSLogger.warnOnce(`wsOnOpen(): Socket ${name} not found`, self.context);
                return;
            }

            ws.reconnectionTries = 0;

            HSLogger.log(`WebSocket ${name} connected successfully`, self.context);

            await (ws.onOpen ?? HSUtils.Noop)(event);
        };

        webSocketObject.socket.onclose = onCloseHandler;
        webSocketObject.socket.onopen = onOpenHandler;
        webSocketObject.socket.onmessage = onMessageHandler;

        this.#webSockets.set(name, webSocketObject);

        HSLogger.log(`Registered websocket ${name}`, this.context);
    }

    unregisterWebSocket(name: string) {
        const socketObject = this.#webSockets.get(name);

        if (socketObject) {
            if (socketObject.socket.readyState === WebSocket.OPEN ||
                socketObject.socket.readyState === WebSocket.CONNECTING) {
                socketObject.socket.close();
            }
            this.#webSockets.delete(name);

            HSLogger.log(`Unregistered websocket ${name}`, this.context);
        } else {
            HSLogger.debug(`Could not unregister websocket (Maybe you're not logged in?) ${name}`, this.context);
        }
    }

    getWebSocket<T>(name: string): HSWebSocketObject<T> | undefined {
        return this.#webSockets.get(name);
    }
}