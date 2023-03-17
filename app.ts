import { main as webserverMain, SERVER as HttpServerInstance } from "./screensy-website/webserver";
import { main as webSocketServerMain } from "./screensy-rendezvous/rendezvous-websocketserver";

webserverMain();
webSocketServerMain(HttpServerInstance);