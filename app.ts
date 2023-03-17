import { main as webserverMain } from "./screensy-website/webserver";
import { main as webSocketServerMain } from "./screensy-rendezvous/rendezvous-websocketserver";

webserverMain();
webSocketServerMain();