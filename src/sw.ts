/// <reference lib="webworker" />
import {precacheAndRoute,cleanupOutdatedCaches,createHandlerBoundToURL} from 'workbox-precaching';
import {registerRoute,NavigationRoute} from 'workbox-routing';
import {CacheFirst} from 'workbox-strategies';
import {CacheableResponsePlugin} from 'workbox-cacheable-response';
import {clientsClaim} from 'workbox-core';
declare const self:ServiceWorkerGlobalScope & {__WB_MANIFEST:any[]};
precacheAndRoute(self.__WB_MANIFEST);cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));
// These resources are cached ONLY when a user opens/uses a tool that requests them.
registerRoute(({url})=>url.origin===self.location.origin&&(/\/assets\//.test(url.pathname)||/\/vendor\/ocr\//.test(url.pathname)),new CacheFirst({cacheName:'pdf-pro-tools-v2',plugins:[new CacheableResponsePlugin({statuses:[200]})]}));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();for(const key of keys)if(key.startsWith('pdf-pro-tools-')&&key!=='pdf-pro-tools-v2')await caches.delete(key);})());});
clientsClaim();
