import { defineMiddleware } from 'astro/middleware';
import { parse } from 'node-html-parser';
import * as prettier from 'prettier';

const env = import.meta.env;

const rewriteAstroGeneratedContent = (body: string) => {
    const html = parse(body);

    // In dev, add public site url base for all scripts, so it works in external sites
    if (env.DEV) {
        html.querySelectorAll('script').forEach((script: HTMLElement) => {
            const src = script.getAttribute('src');
            if (src != null && src.startsWith('/')) {
                script.setAttribute('src', new URL(src, env.PUBLIC_SITE_URL).toString());
            }
        });
    }
    return html.toString();
};

const BINARY_EXTENSIONS = ['png', 'webp', 'jpeg', 'jpg'];

function isHtml(path: string) {
    const pathItems = path.split('/');
    const fileName = pathItems.slice(-1)[0];
    const isExtension = fileName.includes('.');

    return !isExtension;
}

function isBinary(path: string) {
    const pathItems = path.split('/');
    const fileName = pathItems.slice(-1)[0];
    const fileNameParts = fileName.split('.');
    const extension = fileNameParts.slice(-1)[0];

    return BINARY_EXTENSIONS.includes(extension);
}

export const onRequest = defineMiddleware(async (context, next) => {
    const response = (await next()) as Response;

    const isExample = context.url.pathname.includes('/examples/');
    if (!isExample || isBinary(context.url.pathname)) {
        return response;
    }

    let body = await response.text();

    if (isHtml(context.url.pathname)) {
        body = rewriteAstroGeneratedContent(body);

        try {
            body = await prettier.format(body, {
                parser: 'html',
            });
        } catch (e) {
            // eslint-disable-next-line no-console
            console.warn(`Unable to prettier format for [${context.url.pathname}]`);
        }
    }

    return new Response(body, {
        status: 200,
        headers: response.headers,
    });
});
