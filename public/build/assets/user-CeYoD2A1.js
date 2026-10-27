import{a as u}from"./app-DvF8Q1cM.js";import{b as d}from"./index-CYAym89V.js";import{c as b}from"./createLucideIcon-PGLpcGPY.js";function p(r){const[e,o]=u.useState(void 0);return d(()=>{if(r){o({width:r.offsetWidth,height:r.offsetHeight});const n=new ResizeObserver(s=>{if(!Array.isArray(s)||!s.length)return;const f=s[0];let t,i;if("borderBoxSize"in f){const c=f.borderBoxSize,a=Array.isArray(c)?c[0]:c;t=a.inlineSize,i=a.blockSize}else t=r.offsetWidth,i=r.offsetHeight;o({width:t,height:i})});return n.observe(r,{box:"border-box"}),()=>n.unobserve(r)}else o(void 0)},[r]),e}function S(r){const e=u.useRef({value:r,previous:r});return u.useMemo(()=>(e.current.value!==r&&(e.current.previous=e.current.value,e.current.value=r),e.current.previous),[r])}/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]],x=b("User",h);export{x as U,p as a,S as u};
