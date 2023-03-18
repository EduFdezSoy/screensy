import { createReadStream, existsSync } from "fs";
import { createServer, IncomingMessage, request, ServerResponse } from "http";
import path = require("path");

const PORT = process.env.port as number | undefined || 8080;

export const SERVER = createServer((request: IncomingMessage, response: ServerResponse) => {
    try {
        if (returnCSS(request, response))
            return;
        if (returnJS(request, response))
            return;
        if (filterFileTypes(request, response))
            return;

        // return index if base path, otherwise redirect client to base path
        if (request.url == '/') {
            const lang = request.headers["accept-language"];
            // send the right language file or fallback to en
            var filePath = "";
            var fileFound = false;

            if (lang != null)
                getLangArray(lang).every(element => {
                    filePath = path.resolve("./screensy-website/translations/" + element + ".html")
                    fileFound = existsSync(filePath);

                    if (fileFound) {
                        return false; // stop loop
                    } else {
                        return true; // continue loop
                    }
                });

            if (fileFound) {
                createReadStream(filePath).pipe(response);
            } else {
                // fallback always to english
                createReadStream(path.resolve("./screensy-website/translations/en.html")).pipe(response);
            }
            response.setHeader("Content-Type", 'text/html');
        } else {
            // redirect to base
            response.statusCode = 301;
            response.setHeader("Location", "/");
            response.end();
        }
    } catch (error) {
        response.statusCode = 500;
        response.setHeader("Content-Type", 'text/html');
        response.end("<h1>Error 500</h1><h2>Internal server error</h2>I don't know man, something's fucked up.");
        console.error(error);
    } finally {
        console.log("");
        console.log("req:", request.url);
        console.log("resCode:", response.statusCode, "ConType:", response.getHeader("Content-Type"));
    }
});

// start server
export function main() {
    SERVER.listen(PORT);

    // on ready
    SERVER.on("listening", () => {
        console.log("Web Server started on port", PORT);
    })

    // on error
    SERVER.on('error', (e) => {
        if (e.name === 'EADDRINUSE') {
            console.log('Address in use, retrying...');
            setTimeout(() => {
                SERVER.close();
                SERVER.listen(PORT);
            }, 1000);
        }
    });
}

// manage css files
function returnCSS(request: IncomingMessage, response: ServerResponse): boolean {
    if (request.url != null && request.url.indexOf(".css") !== -1) {
        response.setHeader("Content-Type", 'text/css');

        const filePath = path.resolve("./screensy-website", `.${request.url}`)
        const fileFound = existsSync(filePath);
        if (fileFound) {
            createReadStream(filePath).pipe(response);
        } else {
            response.statusCode = 404;
            response.setHeader("Content-Type", 'text/html');
            response.end("<h1>Error 404</h1><h2>Not Found</h2>");
        }

        return true;
    }

    return false;
}

// manage js files
function returnJS(request: IncomingMessage, response: ServerResponse): boolean {
    if (request.url != null && request.url.indexOf(".js") !== -1) {
        response.setHeader("Content-Type", 'text/javascript');

        const filePath = path.resolve("./screensy-website", `.${request.url}`)
        const fileFound = existsSync(filePath);
        if (fileFound) {
            createReadStream(filePath).pipe(response);
        } else {
            response.statusCode = 404;
            response.setHeader("Content-Type", 'text/html');
            response.end("<h1>Error 404</h1><h2>Not Found</h2>");
        }

        return true;
    }

    return false;
}

/*
 * Manage other file extensions
 * returns to client 404 if one of this files are requested
 * @returns true if handled, false if request should pass
 */
function filterFileTypes(request: IncomingMessage, response: ServerResponse): boolean {
    if (request.url != null) {
        if (request.url.indexOf(".ico") !== -1 ||
            request.url.indexOf(".png") !== -1 ||
            request.url.indexOf(".jpg") !== -1 ||
            request.url.indexOf(".webp") !== -1 ||
            request.url.indexOf(".tiff") !== -1 ||
            request.url.indexOf(".ttf") !== -1 ||
            request.url.indexOf(".otf") !== -1 ||
            request.url.indexOf(".woff") !== -1 ||
            request.url.indexOf(".woff2") !== -1 ||
            request.url.indexOf(".ts") !== -1) {

            response.statusCode = 404;
            response.setHeader("Content-Type", 'text/html');
            response.end("<h1>Error 404</h1><h2>Not Found</h2>");
            return true;
        }
    }

    return false;
}

// get a clean language array
function getLangArray(acceptLanguage: String): string[] {
    const array: string[] = acceptLanguage.split(",");

    const res: string[] = array.map(item => {
        const subarray: string = item.split(";")[0];
        return subarray;
    });

    return res;
}
