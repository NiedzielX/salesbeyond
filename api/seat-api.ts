import {createHoldRuntime} from '../src/server/holdRuntime.ts';
declare const process:{env:Readonly<Record<string,string|undefined>>};
// Frameworkless Vercel Node Function, using its documented Web fetch signature.
export default {fetch:createHoldRuntime(process.env)};
